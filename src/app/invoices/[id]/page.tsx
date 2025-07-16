'use client'
import { useEffect, useState } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, DollarSign, Download, Printer } from 'lucide-react'
import EmailDialog from '@/components/email/EmailDialog'
import InvoiceHeader from '@/components/invoices/InvoiceHeader'
import LineItemsTable from '@/components/invoices/LineItemsTable'
import Totals from '@/components/invoices/Totals'
import NotesSection from '@/components/invoices/NotesSection'
import Actions from '@/components/invoices/Actions'

interface Invoice {
  id: string
  invoice_number: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  amount_paid: number
  balance_due: number
  due_date: string | null
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

interface Payment {
  id: string
  amount: number
  payment_date: string
  payment_method: string
  reference_number: string
  notes: string
  created_at: string
}

export default function InvoiceViewPage() {
  const { user, supabase } = useSupabase()
  const params = useParams()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sendingInvoice, setSendingInvoice] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])

  const invoiceId = params.id as string

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        // Fetch invoice details
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
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
          .eq('id', invoiceId)
          .single()

        if (invoiceError) throw invoiceError
        setInvoice(invoiceData)

        // Fetch line items
        const { data: lineItemsData, error: lineItemsError } = await supabase
          .from('line_items')
          .select('*')
          .eq('project_id', invoiceData.project_id)
          .order('created_at')

        if (lineItemsError) throw lineItemsError
        setLineItems(lineItemsData || [])

        // Fetch payments
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .eq('invoice_id', invoiceId)
          .order('payment_date', { ascending: false })

        if (paymentsError) throw paymentsError
        setPayments(paymentsData || [])
      } catch (error) {
        console.error('Error fetching invoice:', error)
        setError('Failed to load invoice')
      } finally {
        setLoading(false)
      }
    }

    if (user && invoiceId) {
      fetchInvoice()
    }
  }, [user, invoiceId, supabase])

  // Update handleSendInvoice to accept recipientEmail
  const handleSendInvoice = async (recipientEmail: string, message?: string) => {
    if (!recipientEmail) {
      alert('No recipient email found for this invoice. Please enter an email address.')
      return
    }

    setSendingInvoice(true)
    try {
      // Update invoice status to 'sent'
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', invoiceId)

      if (error) throw error

      setInvoice(prev => prev ? { ...prev, status: 'sent' as const } : null)

      // Send email with invoice PDF
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'invoice',
          recipientEmail: recipientEmail,
          documentId: invoiceId,
          message: message,
          fromEmail: user?.email || process.env.DEFAULT_SENDER_EMAIL
        })
      })

      if (response.ok) {
        alert('Invoice sent successfully! Check the client\'s email.')
      } else {
        const err = await response.json()
        throw new Error(err.error || 'Failed to send email')
      }

    } catch (error) {
      console.error('Error sending invoice:', error)
      alert('Failed to send invoice. Please try again.')
    } finally {
      setSendingInvoice(false)
    }
  }

  const handleMarkAsPaid = async () => {
    setMarkingPaid(true)
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: 'paid',
          amount_paid: invoice?.total_amount || 0
        })
        .eq('id', invoiceId)

      if (error) throw error

      setInvoice(prev => prev ? { 
        ...prev, 
        status: 'paid' as const,
        amount_paid: prev.total_amount
      } : null)
      alert('Invoice marked as paid!')
    } catch (error) {
      console.error('Error marking invoice as paid:', error)
      alert('Failed to mark invoice as paid. Please try again.')
    } finally {
      setMarkingPaid(false)
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
          type: 'invoice',
          documentId: invoiceId
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

  if (error || !invoice) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Invoice not found</div>
        <Link
          href="/invoices"
          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Invoices
        </Link>
      </div>
    )
  }

  const isOverdue = invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.status !== 'paid'
  const client = invoice.projects.clients[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/invoices"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Invoices
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
            href={`/invoices/${invoice.id}/edit`}
            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Link>
        </div>
      </div>

      {/* Invoice Header */}
      <InvoiceHeader
        invoiceNumber={invoice.invoice_number}
        status={invoice.status}
        totalAmount={invoice.total_amount}
        createdAt={invoice.created_at}
        isOverdue={Boolean(isOverdue)}
      />

      {/* Client and Project Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Bill To</h3>
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
              <div className="font-medium text-gray-900">{invoice.projects.name}</div>
              {invoice.projects.description && (
                <div className="mt-1">{invoice.projects.description}</div>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Invoice Number</h3>
            <div className="text-sm text-gray-900">{invoice.invoice_number}</div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
            <div className="text-sm text-gray-900">
              {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Not specified'}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <div className="text-sm text-gray-900">{invoice.status}</div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <LineItemsTable lineItems={lineItems} />

      {/* Totals */}
      <Totals
        subtotal={invoice.subtotal}
        taxRate={invoice.tax_rate}
        taxAmount={invoice.tax_amount}
        totalAmount={invoice.total_amount}
        amountPaid={invoice.amount_paid}
        balanceDue={invoice.balance_due}
      />

      {/* Payments Section (keep as is for now) */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Payments</h2>
          <Link href={`/payments/new?invoiceId=${invoiceId}`} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center">
            <DollarSign className="w-4 h-4 mr-2" />
            Record Payment
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(payment.payment_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.payment_method || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.reference_number || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{payment.notes || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {payments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No payments recorded yet.
          </div>
        )}
      </div>

      {/* Notes and Terms */}
      <NotesSection notes={invoice.notes} terms={invoice.terms} />

      {/* Actions */}
      <Actions
        status={invoice.status}
        sendingInvoice={sendingInvoice}
        markingPaid={markingPaid}
        onSend={() => setShowEmailDialog(true)}
        onMarkAsPaid={handleMarkAsPaid}
        updatedAt={invoice.updated_at}
      />

      {/* Email Dialog */}
      <EmailDialog
        isOpen={showEmailDialog}
        onClose={() => setShowEmailDialog(false)}
        onSend={handleSendInvoice}
        type="invoice"
        documentNumber={invoice.invoice_number}
        recipientEmail={client?.email || ''}
        loading={sendingInvoice}
      />
    </div>
  )
} 