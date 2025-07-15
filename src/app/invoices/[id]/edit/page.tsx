'use client'
import { useState, useEffect } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

interface Project {
  id: string
  name: string
  clients: {
    name: string
    company_name: string | null
  }[]
}

interface LineItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

interface Invoice {
  id: string
  invoice_number: string
  project_id: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  subtotal: number
  tax_rate: number
  amount_paid: number
  due_date: string | null
  notes: string | null
  terms: string | null
}

export default function EditInvoicePage() {
  const { user, supabase } = useSupabase()
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const invoiceId = params.id as string

  // Form state
  const [formData, setFormData] = useState({
    project_id: '',
    invoice_number: '',
    status: 'draft' as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled',
    due_date: '',
    amount_paid: 0,
    tax_rate: 0,
    notes: '',
    terms: ''
  })

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unit_price: 0, total: 0 }
  ])

  // Fetch invoice and projects
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch invoice details
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', invoiceId)
          .single()

        if (invoiceError) throw invoiceError
        setInvoice(invoiceData)

        // Set form data
        setFormData({
          project_id: invoiceData.project_id,
          invoice_number: invoiceData.invoice_number,
          status: invoiceData.status,
          due_date: invoiceData.due_date || '',
          amount_paid: invoiceData.amount_paid,
          tax_rate: invoiceData.tax_rate,
          notes: invoiceData.notes || '',
          terms: invoiceData.terms || ''
        })

        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select(`
            id,
            name,
            clients (
              name,
              company_name
            )
          `)
          .order('name')

        if (projectsError) throw projectsError
        setProjects(projectsData || [])

        // Fetch line items
        const { data: lineItemsData, error: lineItemsError } = await supabase
          .from('line_items')
          .select('*')
          .eq('project_id', invoiceData.project_id)
          .order('created_at')

        if (lineItemsError) throw lineItemsError

        if (lineItemsData && lineItemsData.length > 0) {
          setLineItems(lineItemsData.map((item, index) => ({
            id: (index + 1).toString(),
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.quantity * item.unit_price
          })))
        }
      } catch (error) {
        console.error('Error fetching invoice:', error)
        setError('Failed to load invoice')
      } finally {
        setLoading(false)
      }
    }

    if (user && invoiceId) {
      fetchData()
    }
  }, [user, invoiceId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const totalAmount = lineItems.reduce((sum, item) => sum + item.total, 0)
      const taxAmount = (totalAmount * formData.tax_rate) / 100

      // Update invoice
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          project_id: formData.project_id,
          invoice_number: formData.invoice_number,
          status: formData.status,
          subtotal: totalAmount,
          tax_rate: formData.tax_rate,
          amount_paid: formData.amount_paid,
          due_date: formData.due_date || null,
          notes: formData.notes || null,
          terms: formData.terms || null
        })
        .eq('id', invoiceId)

      if (invoiceError) throw invoiceError

      // Delete existing line items for this project
      const { error: deleteError } = await supabase
        .from('line_items')
        .delete()
        .eq('project_id', formData.project_id)

      if (deleteError) throw deleteError

      // Create new line items
      const lineItemsData = lineItems
        .filter(item => item.description.trim() !== '')
        .map(item => ({
          project_id: formData.project_id,
          item_type: 'service',
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))

      if (lineItemsData.length > 0) {
        const { error: lineItemsError } = await supabase
          .from('line_items')
          .insert(lineItemsData)

        if (lineItemsError) throw lineItemsError
      }

      router.push(`/invoices/${invoiceId}`)
    } catch (error) {
      console.error('Error updating invoice:', error)
      setError(error instanceof Error ? error.message : 'Failed to update invoice')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount_paid' || name === 'tax_rate' ? parseFloat(value) || 0 : value
    }))
  }

  const handleLineItemChange = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'unit_price') {
          updated.total = updated.quantity * updated.unit_price
        }
        return updated
      }
      return item
    }))
  }

  const addLineItem = () => {
    const newId = (lineItems.length + 1).toString()
    setLineItems(prev => [...prev, {
      id: newId,
      description: '',
      quantity: 1,
      unit_price: 0,
      total: 0
    }])
  }

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(prev => prev.filter(item => item.id !== id))
    }
  }

  const totalAmount = lineItems.reduce((sum, item) => sum + item.total, 0)
  const taxAmount = (totalAmount * formData.tax_rate) / 100
  const totalWithTax = totalAmount + taxAmount

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
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href={`/invoices/${invoiceId}`}
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Invoice
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Invoice</h1>
        <p className="mt-1 text-sm text-gray-700">
          Update invoice details and line items
        </p>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-600">{error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Invoice Number */}
            <div>
              <label htmlFor="invoice_number" className="block text-sm font-medium text-gray-700">
                Invoice Number
              </label>
              <input
                type="text"
                name="invoice_number"
                id="invoice_number"
                value={formData.invoice_number}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="INV-20240101-001"
              />
            </div>

            {/* Project Selection */}
            <div>
              <label htmlFor="project_id" className="block text-sm font-medium text-gray-700">
                Project *
              </label>
              <select
                name="project_id"
                id="project_id"
                required
                value={formData.project_id}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} - {project.clients[0]?.company_name || project.clients[0]?.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                name="status"
                id="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                Due Date
              </label>
              <input
                type="date"
                name="due_date"
                id="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Amount Paid */}
            <div>
              <label htmlFor="amount_paid" className="block text-sm font-medium text-gray-700">
                Amount Paid
              </label>
              <input
                type="number"
                name="amount_paid"
                id="amount_paid"
                step="0.01"
                value={formData.amount_paid}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="0.00"
              />
            </div>

            {/* Tax Rate */}
            <div>
              <label htmlFor="tax_rate" className="block text-sm font-medium text-gray-700">
                Tax Rate (%)
              </label>
              <input
                type="number"
                name="tax_rate"
                id="tax_rate"
                step="0.01"
                value={formData.tax_rate}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
              <button
                type="button"
                onClick={addLineItem}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {lineItems.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Item description"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Price
                    </label>
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleLineItemChange(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total
                    </label>
                    <div className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-sm">
                      ${item.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => removeLineItem(item.id)}
                      disabled={lineItems.length === 1}
                      className="inline-flex items-center p-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-end">
              <div className="w-64">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-900">${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {formData.tax_rate > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax ({formData.tax_rate}%):</span>
                      <span className="text-gray-900">${taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between text-lg font-medium">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-gray-900">${totalWithTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes and Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                name="notes"
                id="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Additional notes for the invoice"
              />
            </div>
            <div>
              <label htmlFor="terms" className="block text-sm font-medium text-gray-700">
                Terms
              </label>
              <textarea
                name="terms"
                id="terms"
                rows={4}
                value={formData.terms}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Payment terms and conditions"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              href={`/invoices/${invoiceId}`}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 