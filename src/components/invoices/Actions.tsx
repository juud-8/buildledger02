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
  const handleSendClick = () => {
    console.log('🚨 Send Invoice button clicked!', { status, sendingInvoice })
    
    // Add confirmation to prevent accidental sending
    const userConfirmed = window.confirm(
      `Are you sure you want to send this ${status} invoice via email?\n\n` +
      'This will:\n' +
      '• Open the email form\n' +
      '• Allow you to customize the message\n' +
      '• Send the invoice to the client\n\n' +
      'Click OK to continue or Cancel to go back.'
    )
    
    if (userConfirmed) {
      console.log('✅ User confirmed - opening email dialog')
      onSend()
    } else {
      console.log('❌ User cancelled - staying on view page')
    }
  }

  const handleMarkAsPaidClick = () => {
    console.log('💰 Mark as Paid button clicked!', { status, markingPaid })
    onMarkAsPaid()
  }

  console.log('🔧 Actions component rendered:', { status, sendingInvoice, markingPaid })

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
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700"
              title="Send this invoice via email to the client (requires confirmation)"
            >
              <Send className="w-4 h-4 mr-2" />
              {sendingInvoice ? 'Sending...' : '📧 Email Invoice'}
            </Button>
          )}
          {status !== 'paid' && (
            <Button 
              onClick={handleMarkAsPaidClick} 
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
      
      {/* Status indicator for debugging */}
      <div className="mt-2 text-xs text-gray-400">
        Status: {status} | Actions available: {status === 'draft' ? 'Email Invoice' : ''} {status !== 'paid' ? 'Mark as Paid' : ''}
      </div>
    </div>
  )
} 