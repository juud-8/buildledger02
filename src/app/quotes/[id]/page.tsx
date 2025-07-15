'use client'
import { useEffect, useState } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Send, DollarSign, Calendar, FileText, CheckCircle, AlertCircle, Clock, Download, Printer } from 'lucide-react'

interface Quote {
  id: string
  quote_number: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  valid_until: string | null
  notes: string | null
  terms: string | null
  created_at: string
  updated_at: string
  project_id: string
  projects: {
    name: string
    description: string | null
    clients: {
      name: string
      company_name: string | null
      email: string | null
      phone: string | null
      address: string | null
    }[]
  }
}

interface LineItem {
  id: string
  item_type: 'service' | 'material' | 'labor'
  description: string
  quantity: number
  unit_price: number
  total_price: number
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
}

const statusIcons = {
  draft: FileText,
  sent: Send,
  accepted: CheckCircle,
  rejected: AlertCircle
}

export default function QuoteViewPage() {
  const { user, supabase } = useSupabase()
  const params = useParams()
  const router = useRouter()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sendingQuote, setSendingQuote] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false)

  const quoteId = params.id as string

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        // Fetch quote details
        const { data: quoteData, error: quoteError } = await supabase
          .from('quotes')
          .select(`
            *,
            projects (
              name,
              description,
              clients (
                name,
                company_name,
                email,
                phone,
                address
              )
            )
          `)
          .eq('id', quoteId)
          .single()

        if (quoteError) throw quoteError
        setQuote(quoteData)

        // Fetch line items
        const { data: lineItemsData, error: lineItemsError } = await supabase
          .from('line_items')
          .select('*')
          .eq('project_id', quoteData.project_id)
          .order('created_at')

        if (lineItemsError) throw lineItemsError
        setLineItems(lineItemsData || [])
      } catch (error) {
        console.error('Error fetching quote:', error)
        setError('Failed to load quote')
      } finally {
        setLoading(false)
      }
    }

    if (user && quoteId) {
      fetchQuote()
    }
  }, [user, quoteId, supabase])

  const handleSendQuote = async () => {
    if (!quote?.projects.clients[0]?.email) {
      alert('No recipient email found for this quote.')
      return
    }

    setSendingQuote(true)
    try {
      // Update quote status to 'sent'
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'sent' })
        .eq('id', quoteId)

      if (error) throw error

      setQuote(prev => prev ? { ...prev, status: 'sent' as const } : null)

      // Send email with quote PDF
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'quote',
          recipientEmail: quote.projects.clients[0].email,
          documentId: quoteId,
          fromEmail: user?.email || undefined
        })
      })

      if (response.ok) {
        alert('Quote emailed successfully!')
      } else {
        const err = await response.json()
        throw new Error(err.error || 'Failed to send email')
      }

    } catch (error) {
      console.error('Error sending quote:', error)
      alert('Failed to send quote. Please try again.')
    } finally {
      setSendingQuote(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true)
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'quote',
          documentId: quoteId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const data = await response.json()
      
      if (data.success && data.pdfData) {
        // Convert base64 to blob
        const byteCharacters = atob(data.pdfData.content)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'application/pdf' })
        
        // Create download link
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = data.pdfData.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        throw new Error('Invalid PDF data received')
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setDownloadingPDF(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Quote not found</div>
        <Link
          href="/quotes"
          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Quotes
        </Link>
      </div>
    )
  }

  const StatusIcon = statusIcons[quote.status]
  const isExpired = quote.valid_until && new Date(quote.valid_until) < new Date()
  const client = quote.projects.clients[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/quotes"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Quotes
          </Link>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-2" />
            {downloadingPDF ? 'Generating...' : 'Download PDF'}
          </button>
          <Link
            href={`/quotes/${quote.id}/edit`}
            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Link>
        </div>
      </div>

      {/* Quote Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quote {quote.quote_number}</h1>
            <div className="flex items-center mt-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[quote.status]}`}>
                <StatusIcon className="w-4 h-4 mr-2" />
                {quote.status.toUpperCase()}
              </span>
              {isExpired && (
                <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  EXPIRED
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              ${quote.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-gray-500">
              Created {new Date(quote.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Client and Project Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">For</h3>
            <div className="text-sm text-gray-600">
              <div className="font-medium text-gray-900">
                {client?.company_name || client?.name}
              </div>
              {client?.name && client?.company_name && (
                <div>{client.name}</div>
              )}
              {client?.email && <div>{client.email}</div>}
              {client?.phone && <div>{client.phone}</div>}
              {client?.address && <div className="mt-2">{client.address}</div>}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Project</h3>
            <div className="text-sm text-gray-600">
              <div className="font-medium text-gray-900">{quote.projects.name}</div>
              {quote.projects.description && (
                <div className="mt-1">{quote.projects.description}</div>
              )}
            </div>
          </div>
        </div>

        {/* Quote Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Quote Number</h3>
            <div className="text-sm text-gray-900">{quote.quote_number}</div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Valid Until</h3>
            <div className="text-sm text-gray-900">
              {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : 'Not specified'}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <div className="text-sm text-gray-900">{quote.status}</div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Line Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.item_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    ${item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    ${item.total_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-end">
          <div className="w-64">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900">${quote.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              {quote.tax_rate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({quote.tax_rate}%):</span>
                  <span className="text-gray-900">${quote.tax_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between text-lg font-medium">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">${quote.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes and Terms */}
      {(quote.notes || quote.terms) && (
        <div className="bg-white shadow rounded-lg p-6">
          {quote.notes && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Notes</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}
          {quote.terms && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Terms</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote.terms}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Last updated {new Date(quote.updated_at).toLocaleDateString()}
          </div>
          <div className="flex space-x-3">
            {quote.status === 'draft' && (
              <button
                onClick={handleSendQuote}
                disabled={sendingQuote}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Send className="w-4 h-4 mr-2" />
                {sendingQuote ? 'Sending...' : 'Send Quote'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 