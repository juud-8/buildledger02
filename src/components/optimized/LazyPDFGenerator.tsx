// Lazy-loaded PDF generator to reduce initial bundle size
'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Download } from '@/lib/icons'

// Dynamically import heavy PDF dependencies only when needed
const PDFGenerator = dynamic(
  () => import('./PDFGenerator').then(mod => mod.PDFGenerator),
  {
    loading: () => (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full"></div>
        Loading PDF generator...
      </div>
    ),
    ssr: false, // PDF generation should only happen on client
  }
)

interface InvoiceData {
  id: string
  invoice_number?: string
  created_at: string
  client_name: string
  total_amount: number
  items?: Array<{
    description: string
    amount: number
  }>
}

interface QuoteData {
  id: string
  quote_number?: string
  created_at: string
  client_name: string
  total_amount: number
  items?: Array<{
    description: string
    amount: number
  }>
}

interface LazyPDFGeneratorProps {
  data: InvoiceData | QuoteData
  type: 'invoice' | 'quote'
  className?: string
}

export default function LazyPDFGenerator({ data, type, className }: LazyPDFGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)

  const handleDownload = () => {
    setIsLoading(true)
    setShowGenerator(true)
  }

  return (
    <>
      <button
        onClick={handleDownload}
        disabled={isLoading}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 ${className || ''}`}
      >
        <Download className="w-4 h-4" />
        {isLoading ? 'Preparing PDF...' : 'Download PDF'}
      </button>
      
      {showGenerator && (
        <PDFGenerator
          data={data}
          type={type}
          onComplete={() => {
            setIsLoading(false)
            setShowGenerator(false)
          }}
        />
      )}
    </>
  )
}