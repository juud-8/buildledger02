'use client'
import { useEffect, useState } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit } from 'lucide-react'
import EmailDialog from '@/components/email/EmailDialog'
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
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [autoOpenPrevented, setAutoOpenPrevented] = useState(false)

  const invoiceId = params.id as string

  // Create a safe version of setShowEmailDialog that logs all attempts to open the dialog
  const safeSetShowEmailDialog = (value: boolean) => {
    if (value === true) {
      console.log('🚨 ATTEMPT TO OPEN EMAIL DIALOG:', {
        autoOpenPrevented,
        currentURL: window?.location?.href,
        stack: new Error().stack?.split('\n').slice(0, 5).join('\n')
      })
      
      // Prevent auto-opening for the first 2 seconds after page load
      if (!autoOpenPrevented) {
        console.log('🛡️ PREVENTED AUTO-OPEN - dialog opening blocked during initial load')
        return
      }
    }
    
    console.log('📧 EmailDialog state change:', value)
    setShowEmailDialog(value)
  }

  // Debug logging to help identify the issue
  useEffect(() => {
    console.log('Invoice view page loaded - invoiceId:', invoiceId)
    console.log('showEmailDialog initial state:', showEmailDialog)
    console.log('Current URL:', typeof window !== 'undefined' ? window.location.href : 'N/A')
  }, [invoiceId, showEmailDialog])

  // Ensure showEmailDialog is always false on component mount
  useEffect(() => {
    setShowEmailDialog(false)
    
    // Set up auto-open prevention for the first 2 seconds
    const timer = setTimeout(() => {
      setAutoOpenPrevented(true)
      console.log('🛡️ Auto-open prevention lifted - manual dialog opening now allowed')
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [])

  // Clear any URL parameters that might be causing issues
  useEffect(() => {
    if (typeof window !== 'undefined' && window.history.replaceState) {
      const url = new URL(window.location.href)
      let hasProblematicParams = false
      
      // Check for various parameters that might trigger the dialog
      const problematicParams = ['action', 'send', 'email', 'dialog', 'form', 'auto', 'open', 'submit', 'save']
      
      problematicParams.forEach(param => {
        if (url.searchParams.has(param)) {
          url.searchParams.delete(param)
          hasProblematicParams = true
          console.log(`Cleared URL parameter: ${param}`)
        }
      })
      
      if (hasProblematicParams) {
        window.history.replaceState({}, '', url.toString())
        console.log('Cleared URL parameters that might cause dialog to open')
        console.log('New URL:', url.toString())
      }
    }
  }, [])

  // Additional safety check to prevent dialog from opening on page load
  useEffect(() => {
    // Wait a bit after component mount to ensure we don't open dialog accidentally
    const timer = setTimeout(() => {
      if (showEmailDialog) {
        console.warn('EmailDialog was open after page load - forcing it closed')
        setShowEmailDialog(false)
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, [showEmailDialog]) // Include showEmailDialog since we're reading its value

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

  // Get the client information
  const client = invoice?.projects?.clients?.[0]

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

  return (
    <div className="space-y-6">
      {/* Clear Page Indicator */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              📄 <strong>Invoice View Page</strong> - You are viewing invoice details. This is NOT a send/email form.
              {invoice.status === 'draft' && (
                <span className="ml-2">
                  To email this invoice, click the &quot;📧 Email Invoice&quot; button at the bottom of the page.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/invoices"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Invoices
        </Link>
        <div className="flex space-x-2">
          <Link
            href={`/invoices/${invoice.id}/edit`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Invoice
          </Link>
        </div>
      </div>

      {/* Invoice Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Invoice #{invoice.invoice_number}</h1>
        <div className="mt-2 flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            Status: <span className="font-medium">{invoice.status.toUpperCase()}</span>
          </span>
          <span className="text-sm text-gray-600">
            📄 Viewing Invoice Details
          </span>
          {invoice.status === 'draft' && (
            <span className="text-sm text-blue-600 font-medium">
              💡 You can email this invoice using the button below
            </span>
          )}
        </div>
      </div>

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
            💰 Record Payment
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
        onSend={() => safeSetShowEmailDialog(true)}
        onMarkAsPaid={handleMarkAsPaid}
        updatedAt={invoice.updated_at}
      />

      {/* Email Dialog */}
      <EmailDialog
        isOpen={showEmailDialog}
        onClose={() => {
          console.log('📧 EmailDialog manually closed by user')
          setShowEmailDialog(false)
        }}
        onSend={handleSendInvoice}
        type="invoice"
        documentNumber={invoice.invoice_number}
        recipientEmail={client?.email || ''}
        loading={sendingInvoice}
      />
    </div>
  )
} 