// src/components/invoices/InvoiceHeader.tsx
import { FileText, Send, CheckCircle, AlertCircle, Clock } from 'lucide-react'

type InvoiceHeaderProps = {
  invoiceNumber: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  totalAmount: number
  createdAt: string
  isOverdue: boolean
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800'
}

const statusIcons = {
  draft: FileText,
  sent: Send,
  paid: CheckCircle,
  overdue: AlertCircle,
  cancelled: Clock
}

export default function InvoiceHeader({ invoiceNumber, status, totalAmount, createdAt, isOverdue }: InvoiceHeaderProps) {
  const StatusIcon = statusIcons[status]
  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Invoice {invoiceNumber}</h1>
        <div className="flex items-center mt-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[status]}`}>
            <StatusIcon className="w-4 h-4 mr-2" />
            {status.toUpperCase()}
          </span>
          {isOverdue && <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">OVERDUE</span>}
        </div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-gray-900">${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        <div className="text-sm text-gray-500">Created {new Date(createdAt).toLocaleDateString()}</div>
      </div>
    </div>
  )
} 