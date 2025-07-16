'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Check, X, Download, Printer } from 'lucide-react'
import InvoiceHeader from '@/components/invoices/InvoiceHeader'
import LineItemsTable from '@/components/invoices/LineItemsTable'
import Totals from '@/components/invoices/Totals'
import NotesSection from '@/components/invoices/NotesSection'
import ConfirmationModal from '@/components/ui/ConfirmationModal'

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

export default function InvoicePreviewPage() {
  const { id: invoiceId } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, supabase } = useSupabase()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Check if this is a preview after editing
  const isEditMode = searchParams.get('mode') === 'edit'
  const isNewInvoice = searchParams.get('new') === 'true'

  const fetchInvoiceData = useCallback(async () => {
    try {
      // Fetch invoice with related data
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

      // Fetch line items
      const { data: lineItemsData, error: lineItemsError } = await supabase
        .from('line_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at')

      if (lineItemsError) throw lineItemsError

      setInvoice(invoiceData)
      setLineItems(lineItemsData || [])
    } catch (error) {
      console.error('Error fetching invoice:', error)
      router.push('/invoices')
    } finally {
      setLoading(false)
    }
  }, [invoiceId, supabase, router])

  useEffect(() => {
    if (invoiceId && user) {
      fetchInvoiceData()
    }
  }, [invoiceId, user, fetchInvoiceData])

  const handleConfirm = async () => {
    if (!invoice) return
    
    setConfirming(true)
    try {
      // If this is a new invoice, we might want to update its status
      if (isNewInvoice && invoice.status === 'draft') {
        const { error } = await supabase
          .from('invoices')
          .update({ 
            status: 'draft', // Keep as draft but mark as confirmed
            updated_at: new Date().toISOString()
          })
          .eq('id', invoiceId)

        if (error) throw error
      }

      // Navigate to the final invoice view
      router.push(`/invoices/${invoiceId}`)
    } catch (error) {
      console.error('Error confirming invoice:', error)
      alert('Failed to confirm invoice. Please try again.')
    } finally {
      setConfirming(false)
    }
  }

  const handleEdit = () => {
    router.push(`/invoices/${invoiceId}/edit`)
  }

  const handleCancel = () => {
    if (isNewInvoice) {
      // If this is a new invoice, show confirmation modal
      setShowCancelModal(true)
    } else {
      // If editing, just go back to invoice view
      router.push(`/invoices/${invoiceId}`)
    }
  }

  const deleteInvoice = async () => {
    setDeleting(true)
    try {
      // Delete line items first
      await supabase
        .from('line_items')
        .delete()
        .eq('invoice_id', invoiceId)

      // Delete invoice
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId)

      if (error) throw error

      router.push('/invoices')
    } catch (error) {
      console.error('Error deleting invoice:', error)
      alert('Failed to delete invoice. Please try again.')
    } finally {
      setDeleting(false)
      setShowCancelModal(false)
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
          id: invoiceId,
        }),
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

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Invoice not found</h2>
        <Link href="/invoices" className="mt-4 text-indigo-600 hover:text-indigo-500">
          Back to Invoices
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Preview Badge */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/invoices"
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Invoices
            </Link>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                PREVIEW MODE
              </span>
              {isNewInvoice && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  NEW INVOICE
                </span>
              )}
              {isEditMode && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  EDITED
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Preview
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" />
              {downloadingPDF ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none">
        <div className="p-8 print:p-0">
          <InvoiceHeader 
            invoiceNumber={invoice.invoice_number}
            status={invoice.status}
            totalAmount={invoice.total_amount}
            createdAt={invoice.created_at}
            isOverdue={invoice.due_date ? new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' : false}
          />
          <LineItemsTable lineItems={lineItems} />
          <Totals 
            subtotal={invoice.subtotal}
            taxRate={invoice.tax_rate}
            taxAmount={invoice.tax_amount}
            totalAmount={invoice.total_amount}
            amountPaid={invoice.amount_paid}
            balanceDue={invoice.balance_due}
          />
          <NotesSection notes={invoice.notes} terms={invoice.terms} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white shadow rounded-lg p-6 print:hidden">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {isNewInvoice ? 'Review New Invoice' : isEditMode ? 'Review Changes' : 'Invoice Preview'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {isNewInvoice 
                ? 'Please review the invoice details before confirming.' 
                : isEditMode 
                ? 'Please review your changes before saving.'
                : 'Review the invoice details below.'
              }
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <X className="w-4 h-4 mr-2" />
              {isNewInvoice ? 'Cancel & Delete' : 'Cancel'}
            </button>
            <button
              onClick={handleEdit}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Invoice
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              <Check className="w-4 h-4 mr-2" />
              {confirming ? 'Confirming...' : isNewInvoice ? 'Confirm Invoice' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={deleteInvoice}
        title="Cancel Invoice Creation"
        description="This will permanently delete the invoice and all its data. This action cannot be undone."
        confirmText="Delete Invoice"
        cancelText="Keep Working"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}