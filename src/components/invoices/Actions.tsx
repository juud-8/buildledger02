import { Send, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

type ActionsProps = {
  status: string
  sendingInvoice: boolean
  markingPaid: boolean
  onSend: () => void
  onMarkAsPaid: () => void
  updatedAt: string
}

export default function Actions({ status, sendingInvoice, markingPaid, onSend, onMarkAsPaid, updatedAt }: ActionsProps) {
  const [showSendConfirmation, setShowSendConfirmation] = useState(false)

  const handleSendClick = () => {
    // Add confirmation to prevent accidental sending
    if (window.confirm('Are you sure you want to send this invoice via email? This will open the email form.')) {
      onSend()
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Last updated {new Date(updatedAt).toLocaleDateString()}
        </div>
        <div className="flex space-x-3">
          {status === 'draft' && (
            <Button 
              onClick={handleSendClick} 
              disabled={sendingInvoice} 
              className="inline-flex items-center"
              title="Send this invoice via email to the client"
            >
              <Send className="w-4 h-4 mr-2" />
              {sendingInvoice ? 'Sending...' : 'Email Invoice'}
            </Button>
          )}
          {status !== 'paid' && (
            <Button 
              onClick={onMarkAsPaid} 
              disabled={markingPaid} 
              className="inline-flex items-center bg-green-600 hover:bg-green-700"
              title="Mark this invoice as paid"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              {markingPaid ? 'Marking...' : 'Mark as Paid'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 