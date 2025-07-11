// src/app/quotes/page.tsx
'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import Link from 'next/link'
import { Plus, Search, Edit, Trash2, Eye, Send, DollarSign, Calendar, FileText } from 'lucide-react'

interface Quote {
  id: string
  quote_number: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  total_amount: number
  valid_until: string | null
  notes: string | null
  created_at: string
  project_id: string
  projects: {
    name: string
    clients: {
      name: string
      company_name: string | null
      email: string | null
    }
  }
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
}

const statusIcons = {
  draft: FileText,
  sent: Send,
  accepted: DollarSign,
  rejected: Eye
}

export default function QuotesPage() {
  const { user, supabase } = useSupabase()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [sendingQuoteId, setSendingQuoteId] = useState<string | null>(null)

  const fetchQuotes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          projects (
            name,
            clients (
              name,
              company_name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setQuotes(data || [])
    } catch (error) {
      console.error('Error fetching quotes:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (user) {
      fetchQuotes()
    }
  }, [user, fetchQuotes])

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setQuotes(quotes.filter(quote => quote.id !== id))
      setDeleteId(null)
    } catch (error) {
      console.error('Error deleting quote:', error)
    }
  }

  const handleSendQuote = async (quoteId: string, recipientEmail: string | null) => {
    if (!recipientEmail) {
      alert('No recipient email found for this quote.')
      return
    }

    setSendingQuoteId(quoteId)
    try {
      // Update quote status to 'sent'
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'sent' })
        .eq('id', quoteId)

      if (error) throw error

      // Update local state
      setQuotes(
        quotes.map((quote) =>
          quote.id === quoteId ? { ...quote, status: 'sent' as const } : quote
        )
      )

      // Send email with quote PDF
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'quote',
          recipientEmail,
          documentId: quoteId,
          fromEmail: user?.email || undefined
        })
      })

      if (response.ok) {
        alert('Quote emailed successfully!')
      } else {
        const err = await response.json()
        throw new Error(err.error || 'Failed to send email')
      }

    } catch (error) {
      console.error('Error sending quote:', error)
      alert('Failed to send quote. Please try again.')
    } finally {
      setSendingQuoteId(null)
    }
  }

  const filteredQuotes = quotes.filter(quote =>
    quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.projects.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.projects.clients.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.projects.clients.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
          <p className="mt-1 text-sm text-gray-700">
            Create and manage project quotes for your clients
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/quotes/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Quote
          </Link>
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
              placeholder="Search quotes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Quotes Grid */}
      {filteredQuotes.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredQuotes.map((quote) => {
            const StatusIcon = statusIcons[quote.status]
            const isExpired = quote.valid_until && new Date(quote.valid_until) < new Date()
            
            return (
              <div key={quote.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {quote.quote_number}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {quote.projects.clients.company_name || quote.projects.clients.name}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/quotes/${quote.id}`}
                        className="text-gray-600 hover:text-gray-900"
                        title="View Quote"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/quotes/${quote.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit Quote"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteId(quote.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Quote"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[quote.status]}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {quote.status.toUpperCase()}
                    </span>
                    {isExpired && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        EXPIRED
                      </span>
                    )}
                  </div>

                  {/* Project */}
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Project:</strong> {quote.projects.name}
                  </p>

                  {/* Amount */}
                  <div className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                    <DollarSign className="w-5 h-5 mr-1" />
                    {quote.total_amount.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    })}
                  </div>

                  {/* Valid Until */}
                  {quote.valid_until && (
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>
                        Valid until: {new Date(quote.valid_until).toLocaleDateString()}
                        {isExpired && <span className="text-red-600 ml-1">(Expired)</span>}
                      </span>
                    </div>
                  )}

                  {/* Notes */}
                  {quote.notes && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {quote.notes}
                    </p>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      Created {new Date(quote.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex space-x-2">
                      {quote.status === 'draft' && (
                        <button 
                          onClick={() => handleSendQuote(quote.id, quote.projects.clients.email)}
                          disabled={sendingQuoteId === quote.id}
                          className="text-sm font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
                        >
                          {sendingQuoteId === quote.id ? 'Sending...' : 'Send Quote'}
                        </button>
                      )}
                      <Link
                        href={`/quotes/${quote.id}`}
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No quotes</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first quote.</p>
            <div className="mt-6">
              <Link
                href="/quotes/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Quote
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
              <h3 className="text-lg font-medium text-gray-900">Delete Quote</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this quote? This action cannot be undone.
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