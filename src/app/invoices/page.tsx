// src/app/invoices/page.tsx
'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import Link from 'next/link'
import { Plus, Search, Edit, Trash2, Eye, Send, DollarSign, Calendar, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface Invoice {
  id: string
  invoice_number: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'partial' | 'overdue'
  total_amount: number
  amount_paid: number
  due_date: string | null
  issued_date: string
  notes: string | null
  created_at: string
  project_id: string
  projects: {
    name: string
    clients: {
      name: string
      company_name: string | null
    }[]
  }
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800'
}

const paymentStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  partial: 'bg-orange-100 text-orange-800',
  overdue: 'bg-red-100 text-red-800'
}

const statusIcons = {
  draft: FileText,
  sent: Send,
  paid: CheckCircle,
  overdue: AlertCircle,
  cancelled: Eye
}

const paymentStatusIcons = {
  pending: Clock,
  paid: CheckCircle,
  partial: DollarSign,
  overdue: AlertCircle
}

export default function InvoicesPage() {
  const { user, supabase } = useSupabase()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null)
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null)

  const fetchInvoices = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          projects (
            name,
            clients (
              name,
              company_name
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvoices(data || [])
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (user) {
      fetchInvoices()
    }
  }, [user, fetchInvoices])

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setInvoices(invoices.filter(invoice => invoice.id !== id))
      setDeleteId(null)
    } catch (error) {
      console.error('Error deleting invoice:', error)
    }
  }

  const handleSendInvoice = async (invoiceId: string) => {
    setSendingInvoiceId(invoiceId)
    try {
      // Update invoice status to 'sent'
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', invoiceId)

      if (error) throw error

      // Update local state
      setInvoices(invoices.map(invoice => 
        invoice.id === invoiceId 
          ? { ...invoice, status: 'sent' as const }
          : invoice
      ))

      alert('Invoice status updated to "Sent". Email functionality coming soon!')

    } catch (error) {
      console.error('Error sending invoice:', error)
      alert('Failed to send invoice. Please try again.')
    } finally {
      setSendingInvoiceId(null)
    }
  }

  const handleMarkAsPaid = async (invoiceId: string) => {
    setMarkingPaidId(invoiceId)
    try {
      const invoice = invoices.find(inv => inv.id === invoiceId)
      if (!invoice) return

      // Update invoice status and payment status
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: 'paid',
          payment_status: 'paid',
          amount_paid: invoice.total_amount
        })
        .eq('id', invoiceId)

      if (error) throw error

      // Update local state
      setInvoices(invoices.map(inv => 
        inv.id === invoiceId 
          ? { 
              ...inv, 
              status: 'paid' as const,
              payment_status: 'paid' as const,
              amount_paid: inv.total_amount
            }
          : inv
      ))

      alert('Invoice marked as paid!')

    } catch (error) {
      console.error('Error marking invoice as paid:', error)
      alert('Failed to mark invoice as paid. Please try again.')
    } finally {
      setMarkingPaidId(null)
    }
  }

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.projects.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.projects.clients[0]?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.projects.clients[0]?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalOutstanding = invoices
    .filter(invoice => invoice.payment_status !== 'paid')
    .reduce((sum, invoice) => sum + (invoice.total_amount - invoice.amount_paid), 0)

  const totalPaid = invoices
    .filter(invoice => invoice.payment_status === 'paid')
    .reduce((sum, invoice) => sum + invoice.total_amount, 0)

  const overdueCount = invoices.filter(invoice => 
    invoice.due_date && 
    new Date(invoice.due_date) < new Date() && 
    invoice.payment_status !== 'paid'
  ).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-1 text-sm text-gray-700">
            Manage your construction invoices and track payments
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/invoices/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Outstanding</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Paid</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Overdue</dt>
                  <dd className="text-lg font-medium text-gray-900">{overdueCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Invoices</dt>
                  <dd className="text-lg font-medium text-gray-900">{invoices.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Invoices Grid */}
      {filteredInvoices.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredInvoices.map((invoice) => {
            const StatusIcon = statusIcons[invoice.status]
            const PaymentIcon = paymentStatusIcons[invoice.payment_status]
            const isOverdue = invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.payment_status !== 'paid'
            const remainingAmount = invoice.total_amount - invoice.amount_paid
            
            return (
              <div key={invoice.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {invoice.invoice_number}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {invoice.projects.clients[0]?.company_name || invoice.projects.clients[0]?.name}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="text-gray-600 hover:text-gray-900"
                        title="View Invoice"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/invoices/${invoice.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit Invoice"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteId(invoice.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[invoice.status]}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {invoice.status.toUpperCase()}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatusColors[invoice.payment_status]}`}>
                        <PaymentIcon className="w-3 h-3 mr-1" />
                        {invoice.payment_status.toUpperCase()}
                      </span>
                    </div>
                    {isOverdue && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        OVERDUE
                      </span>
                    )}
                  </div>

                  {/* Project */}
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Project:</strong> {invoice.projects.name}
                  </p>

                  {/* Amount */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-lg font-semibold text-gray-900 mb-1">
                      <span>Total Amount:</span>
                      <span>${invoice.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {invoice.amount_paid > 0 && (
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Amount Paid:</span>
                        <span>${invoice.amount_paid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {remainingAmount > 0 && (
                      <div className="flex items-center justify-between text-sm font-medium text-red-600">
                        <span>Remaining:</span>
                        <span>${remainingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="space-y-1 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Issued: {new Date(invoice.issued_date).toLocaleDateString()}</span>
                    </div>
                    {invoice.due_date && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span className={isOverdue ? 'text-red-600' : ''}>
                          Due: {new Date(invoice.due_date).toLocaleDateString()}
                          {isOverdue && ' (Overdue)'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {invoice.notes && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {invoice.notes}
                    </p>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      Created {new Date(invoice.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex space-x-2">
                      {invoice.status === 'draft' && (
                        <button 
                          onClick={() => handleSendInvoice(invoice.id)}
                          disabled={sendingInvoiceId === invoice.id}
                          className="text-sm font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
                        >
                          {sendingInvoiceId === invoice.id ? 'Sending...' : 'Send Invoice'}
                        </button>
                      )}
                      {invoice.payment_status !== 'paid' && (
                        <button 
                          onClick={() => handleMarkAsPaid(invoice.id)}
                          disabled={markingPaidId === invoice.id}
                          className="text-sm font-medium text-green-600 hover:text-green-500 disabled:opacity-50"
                        >
                          {markingPaidId === invoice.id ? 'Marking...' : 'Mark as Paid'}
                        </button>
                      )}
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first invoice.</p>
            <div className="mt-6">
              <Link
                href="/invoices/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Invoice
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Delete Invoice</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this invoice? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-4 px-4 py-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 