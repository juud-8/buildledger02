import { Send, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ActionsProps = {
  status: string
  sendingInvoice: boolean
  markingPaid: boolean
  onSend: () => void
  onMarkAsPaid: () => void
  updatedAt: string
}

export default function Actions({ status, sendingInvoice, markingPaid, onSend, onMarkAsPaid, updatedAt }: ActionsProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Last updated {new Date(updatedAt).toLocaleDateString()}
        </div>
        <div className="flex space-x-3">
          <Button onClick={onSend} disabled={sendingInvoice} className="inline-flex items-center">
            <Send className="w-4 h-4 mr-2" />
            {sendingInvoice ? 'Sending...' : 'Send Invoice'}
          </Button>
          {status !== 'paid' && (
            <Button onClick={onMarkAsPaid} disabled={markingPaid} className="inline-flex items-center bg-green-600 hover:bg-green-700">
              <DollarSign className="w-4 h-4 mr-2" />
              {markingPaid ? 'Marking...' : 'Mark as Paid'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 