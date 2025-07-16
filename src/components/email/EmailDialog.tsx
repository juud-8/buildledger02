'use client'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogOverlay } from '@radix-ui/react-dialog'
import { X, Send, FileText } from 'lucide-react'

interface EmailDialogProps {
  isOpen: boolean
  onClose: () => void
  onSend: (recipientEmail: string, message: string) => Promise<void>
  type: 'invoice' | 'quote'
  documentNumber: string
  recipientEmail: string
  loading?: boolean
}

export default function EmailDialog({
  isOpen,
  onClose,
  onSend,
  type,
  documentNumber,
  recipientEmail: initialRecipientEmail,
  loading = false
}: EmailDialogProps) {
  const [recipientEmail, setRecipientEmail] = useState(initialRecipientEmail)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [emailError, setEmailError] = useState('')

  // Update local state if prop changes
  useEffect(() => {
    setRecipientEmail(initialRecipientEmail)
  }, [initialRecipientEmail])

  const validateEmail = (email: string) => {
    // Simple email regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSend = async () => {
    setEmailError('')
    if (!recipientEmail || !validateEmail(recipientEmail)) {
      setEmailError('Please enter a valid recipient email address.')
      return
    }
    setSending(true)
    try {
      await onSend(recipientEmail, message)
      setMessage('')
      onClose()
    } catch (error) {
      console.error('Error sending email:', error)
    } finally {
      setSending(false)
    }
  }

  const getDefaultMessage = () => {
    if (type === 'invoice') {
      return `Dear Client,

Please find attached invoice ${documentNumber}. 

Payment is due according to the terms specified in the invoice.

Thank you for your business!

Best regards,
Your Company`
    } else {
      return `Dear Client,

Please find attached quote ${documentNumber}.

We appreciate the opportunity to work with you on this project.

If you have any questions or would like to proceed with this quote, please don't hesitate to contact us.

Best regards,
Your Company`
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
      <DialogContent className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Send {type === 'invoice' ? 'Invoice' : 'Quote'}
                </h2>
                <p className="text-sm text-gray-500">
                  {documentNumber}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Recipient Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <label htmlFor="recipientEmail" className="block text-sm font-medium text-gray-700 mb-1">
                To:
              </label>
              <input
                id="recipientEmail"
                type="email"
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="client@email.com"
                required
              />
              {emailError && (
                <p className="mt-1 text-xs text-red-600">{emailError}</p>
              )}
            </div>

            {/* Message */}
            <div className="mb-4">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message (Optional)
              </label>
              <textarea
                id="message"
                rows={8}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={getDefaultMessage()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm resize-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave empty to use the default message
              </p>
            </div>

            {/* Info */}
            <div className="mb-6 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">What&apos;s included:</p>
                  <ul className="mt-1 space-y-1">
                    <li>• Professional {type === 'invoice' ? 'invoice' : 'quote'} email</li>
                    <li>• PDF attachment with all details</li>
                    <li>• Your company branding</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={sending}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || loading}
                className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send {type === 'invoice' ? 'Invoice' : 'Quote'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}