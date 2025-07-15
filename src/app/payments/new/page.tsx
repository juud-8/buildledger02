// src/app/payments/new/page.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { formatCurrency } from '@/lib/utils/formatters'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

type Invoice = {
  id: string
  invoice_number: string
  total_amount: number
  amount_paid: number
  balance_due: number
}

const formSchema = z.object({
  invoice_id: z.string().nonempty('Select an invoice'),
  amount: z.number().positive('Amount must be positive'),
  payment_date: z.string().nonempty('Select a date'),
  payment_method: z.string().optional(),
  reference_number: z.string().optional(),
  notes: z.string().optional()
})

export default function NewPaymentPage() {
  const { supabase, user } = useSupabase()
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedInvoiceId = searchParams.get('invoiceId')

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { amount: 0, payment_date: new Date().toISOString().split('T')[0] }
  })

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('id, invoice_number, total_amount, amount_paid, balance_due')
          .eq('status', 'sent') // Only open invoices
          .order('invoice_number')

        if (error) throw error
        setInvoices(data || [])
      } catch (err) {
        console.error('Error fetching invoices:', err)
      }
    }
    if (user) fetchInvoices()
  }, [user, supabase])

  useEffect(() => {
    if (preselectedInvoiceId && invoices.length > 0) {
      handleInvoiceChange(preselectedInvoiceId)
      setValue('invoice_id', preselectedInvoiceId)
    }
  }, [invoices, preselectedInvoiceId, setValue])

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!user) return
    
    setLoading(true)
    setError('')
    try {
      // Insert payment
      const { error: insertError } = await supabase
        .from('payments')
        .insert([{
          user_id: user.id,
          invoice_id: data.invoice_id,
          amount: data.amount,
          payment_date: data.payment_date,
          payment_method: data.payment_method,
          reference_number: data.reference_number,
          notes: data.notes
        }])
        .select()

      if (insertError) throw insertError

      // Update invoice amount_paid
      if (!selectedInvoice) throw new Error('Selected invoice not found')
      const newAmountPaid = selectedInvoice.amount_paid + data.amount
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ amount_paid: newAmountPaid })
        .eq('id', data.invoice_id)

      if (updateError) throw updateError

      router.push('/payments')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment')
      console.error('Error recording payment:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInvoiceChange = useCallback((id: string) => {
    const invoice = invoices.find(inv => inv.id === id)
    setSelectedInvoice(invoice || null)
    setValue('amount', invoice?.balance_due || 0)
  }, [invoices, setValue])

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Record New Payment</h1>
      {error && <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md flex items-center"><AlertCircle className="mr-2" /> {error}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="invoice_id" className="block text-sm font-medium text-gray-700 mb-1">Invoice *</label>
          <select
            id="invoice_id"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            {...register('invoice_id')}
            onChange={e => { handleInvoiceChange(e.target.value); register('invoice_id').onChange(e); }}
          >
            <option value="">Select an invoice</option>
            {invoices.map(inv => (
              <option key={inv.id} value={inv.id}>
                {inv.invoice_number} - Balance: {formatCurrency(inv.balance_due)}
              </option>
            ))}
          </select>
          {errors.invoice_id && <p className="mt-1 text-sm text-red-600">{errors.invoice_id.message}</p>}
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
          <input
            id="amount"
            type="number"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            {...register('amount', { valueAsNumber: true })}
          />
          {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
          {selectedInvoice && <p className="mt-1 text-sm text-gray-500">Balance Due: {formatCurrency(selectedInvoice.balance_due)}</p>}
        </div>
        <div>
          <label htmlFor="payment_date" className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
          <input
            id="payment_date"
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            {...register('payment_date')}
          />
          {errors.payment_date && <p className="mt-1 text-sm text-red-600">{errors.payment_date.message}</p>}
        </div>
        <div>
          <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
          <select
            id="payment_method"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            {...register('payment_method')}
          >
            <option value="">Select method</option>
            <option value="cash">Cash</option>
            <option value="check">Check</option>
            <option value="credit_card">Credit Card</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>
        <div>
          <label htmlFor="reference_number" className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
          <input
            id="reference_number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            {...register('reference_number')}
          />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            id="notes"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm resize-none"
            {...register('notes')}
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Saving...' : 'Record Payment'}
        </Button>
      </form>
    </div>
  )
} 