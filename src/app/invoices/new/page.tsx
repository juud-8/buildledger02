// src/app/invoices/new/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'

interface Project {
  id: string
  name: string
  clients: {
    name: string
    company_name: string | null
  }[]
}

const invoiceSchema = z.object({
  project_id: z.string().nonempty('Project is required'),
  invoice_number: z.string().nonempty('Invoice number is required'),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
  due_date: z.string().optional(),
  amount_paid: z.number().min(0, 'Amount paid must be positive').optional(),
  notes: z.string().optional(),
  lineItems: z.array(z.object({
    description: z.string().nonempty('Description is required'),
    quantity: z.number().min(0, 'Quantity must be positive'),
    unit_price: z.number().min(0, 'Unit price must be positive')
  })).min(1, 'At least one line item is required')
})

type InvoiceForm = z.infer<typeof invoiceSchema>

export default function NewInvoicePage() {
  const { user, supabase } = useSupabase()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, control, formState: { errors }, setValue, getValues } = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      project_id: '',
      invoice_number: '',
      status: 'draft',
      due_date: '',
      amount_paid: 0,
      notes: '',
      lineItems: [{ description: '', quantity: 1, unit_price: 0 }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems'
  })

  // Generate invoice number
  useEffect(() => {
    const generateInvoiceNumber = () => {
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      return `INV-${year}${month}${day}-${random}`
    }
    setValue('invoice_number', generateInvoiceNumber())
  }, [setValue])

  // Fetch projects for dropdown
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
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

        if (error) throw error
        setProjects(data || [])
      } catch (error) {
        console.error('Error fetching projects:', error)
      }
    }

    if (user) {
      fetchProjects()
    }
  }, [user, supabase])

  const onSubmit = async (data: InvoiceForm) => {
    setLoading(true)
    setError('')
    try {
      const totalAmount = data.lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([{
          invoice_number: data.invoice_number,
          project_id: data.project_id,
          status: data.status,
          subtotal: totalAmount,
          tax_rate: 0,
          amount_paid: data.amount_paid,
          due_date: data.due_date || null,
          notes: data.notes || null,
          user_id: user?.id
        }])
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // Create line items
      const lineItemsData = data.lineItems.map(item => ({
        project_id: data.project_id,
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

      router.push(`/invoices/${invoice.id}`)
    } catch (error) {
      console.error('Error creating invoice:', error)
      setError('Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/invoices"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Invoices
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Invoice</h1>
        <p className="mt-1 text-sm text-gray-700">
          Generate a professional invoice for your construction project
        </p>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
          {error && <div className="bg-red-50 border border-red-200 rounded-md p-4"><div className="text-sm text-red-600">{error}</div></div>}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="invoice_number" className="block text-sm font-medium text-gray-700">Invoice Number</label>
              <input type="text" {...register('invoice_number')} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              {errors.invoice_number && <p className="mt-1 text-sm text-red-600">{errors.invoice_number.message}</p>}
            </div>
            <div>
              <label htmlFor="project_id" className="block text-sm font-medium text-gray-700">Project *</label>
              <select {...register('project_id')} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} - {project.clients[0]?.company_name || project.clients[0]?.name}
                  </option>
                ))}
              </select>
              {errors.project_id && <p className="mt-1 text-sm text-red-600">{errors.project_id.message}</p>}
              {projects.length === 0 && <p className="mt-1 text-sm text-gray-500">No projects found. <Link href="/projects/new" className="text-indigo-600 hover:text-indigo-500">Create a project first</Link>.</p>}
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
              <select {...register('status')} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">Due Date</label>
              <input type="date" {...register('due_date')} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="amount_paid" className="block text-sm font-medium text-gray-700">Amount Paid</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input type="number" step="0.01" {...register('amount_paid', { valueAsNumber: true })} className="block w-full pl-7 pr-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              {errors.amount_paid && <p className="mt-1 text-sm text-red-600">{errors.amount_paid.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea rows={3} {...register('notes')} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
          </div>
          {/* Line Items */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
              <button type="button" onClick={() => append({ description: '', quantity: 1, unit_price: 0 })} className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </button>
            </div>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 gap-4 sm:grid-cols-12 items-end">
                  <div className="sm:col-span-5">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <input {...register(`lineItems.${index}.description`)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    {errors.lineItems?.[index]?.description && <p className="mt-1 text-sm text-red-600">{errors.lineItems[index].description.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Quantity</label>
                    <input type="number" step="0.01" {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    {errors.lineItems?.[index]?.quantity && <p className="mt-1 text-sm text-red-600">{errors.lineItems[index].quantity.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Unit Price</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input type="number" step="0.01" {...register(`lineItems.${index}.unit_price`, { valueAsNumber: true })} className="block w-full pl-7 pr-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                    {errors.lineItems?.[index]?.unit_price && <p className="mt-1 text-sm text-red-600">{errors.lineItems[index].unit_price.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Total</label>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      ${ (getValues(`lineItems.${index}.quantity`) * getValues(`lineItems.${index}.unit_price`)).toFixed(2) }
                    </div>
                  </div>
                  <div className="sm:col-span-1">
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(index)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {errors.lineItems && <p className="mt-2 text-sm text-red-600">{errors.lineItems.message}</p>}
            {/* Total */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <div className="flex justify-end">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total Amount</div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${ getValues('lineItems').reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toFixed(2) }
                  </div>
                  {(getValues('amount_paid') ?? 0) > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                      Remaining: ${ (getValues('lineItems').reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) - (getValues('amount_paid') ?? 0)).toFixed(2) }
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link href="/invoices" className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Cancel
            </Link>
            <Button type="submit" disabled={loading} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 