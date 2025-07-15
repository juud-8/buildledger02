// Heavy PDF generation component - loaded only when needed
'use client'

import { useEffect } from 'react'

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

interface PDFGeneratorProps {
  data: InvoiceData | QuoteData
  type: 'invoice' | 'quote'
  onComplete: () => void
}

export function PDFGenerator({ data, type, onComplete }: PDFGeneratorProps) {
  useEffect(() => {
    const generatePDF = async () => {
      try {
        // Dynamic imports to reduce bundle size
        const { default: jsPDF } = await import('jspdf')
        
        // Create PDF document
        const pdf = new jsPDF()
        
        // Add content based on type
        if (type === 'invoice') {
          pdf.text('INVOICE', 20, 20)
          pdf.text(`Invoice #: ${data.id}`, 20, 30)
          pdf.text(`Date: ${new Date(data.created_at).toLocaleDateString()}`, 20, 40)
          pdf.text(`Client: ${data.client_name}`, 20, 50)
          pdf.text(`Amount: $${data.total_amount}`, 20, 60)
        } else {
          pdf.text('QUOTE', 20, 20)
          pdf.text(`Quote #: ${data.id}`, 20, 30)
          pdf.text(`Date: ${new Date(data.created_at).toLocaleDateString()}`, 20, 40)
          pdf.text(`Client: ${data.client_name}`, 20, 50)
          pdf.text(`Amount: $${data.total_amount}`, 20, 60)
        }

        // Add line items
        const yPosition = 80
        data.items?.forEach((item, index) => {
          pdf.text(`${item.description}: $${item.amount}`, 20, yPosition + (index * 10))
        })

        // Save the PDF
        pdf.save(`${type}-${data.id}.pdf`)
        
        onComplete()
      } catch (error) {
        console.error('Error generating PDF:', error)
        onComplete()
      }
    }

    generatePDF()
  }, [data, type, onComplete])

  return null // This component doesn't render anything visible
}