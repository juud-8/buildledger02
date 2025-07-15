import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, documentId } = body

    if (!type || !documentId) {
      return NextResponse.json({ error: 'Missing type or documentId' }, { status: 400 })
    }

    let pdfData

    if (type === 'invoice') {
      pdfData = await generateInvoicePDF(documentId, supabase)
    } else if (type === 'quote') {
      pdfData = await generateQuotePDF(documentId, supabase)
    } else {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      pdfData
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Generate a comprehensive Invoice PDF
const generateInvoicePDF = async (invoiceId: string, supabase: SupabaseClient) => {
  const { data: invoice } = await supabase
    .from('invoices')
    .select(`
      *,
      projects (
        name,
        description,
        clients (
          name,
          company_name,
          email,
          phone,
          address
        )
      )
    `)
    .eq('id', invoiceId)
    .single()

  if (!invoice) {
    throw new Error('Invoice not found')
  }

  // Get line items
  const { data: lineItems } = await supabase
    .from('line_items')
    .select('*')
    .eq('project_id', invoice.project_id)
    .order('created_at')

  // Get user profile for company info
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_name, full_name, email, phone, logo_url, logo_display')
    .eq('id', invoice.user_id)
    .single()

  const jsPDF = (await import('jspdf')).default
  const doc = new jsPDF()

  // Fetch and add logo image after doc is created
  const logoUrl = profile?.logo_url
  const logoDisplay = profile?.logo_display || 'top-right'
  if (logoUrl) {
    const img = await fetch(logoUrl).then(r => r.blob()).then(blob => new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    }))
    if (logoDisplay === 'background') {
      doc.addImage(img as string, 'PNG', 30, 80, 150, 150, undefined, 'FAST')
      doc.setDrawColor(255,255,255)
    } else if (logoDisplay === 'top-left') {
      doc.addImage(img as string, 'PNG', 20, 10, 40, 40, undefined, 'FAST')
    } else {
      doc.addImage(img as string, 'PNG', 150, 10, 40, 40, undefined, 'FAST')
    }
  }
  
  // Set up fonts and colors
  doc.setFont('helvetica')
  
  // Header
  doc.setFontSize(24)
  doc.setTextColor(44, 62, 80)
  doc.text('INVOICE', 20, 30)
  
  // Company info (top right)
  doc.setFontSize(12)
  doc.setTextColor(52, 73, 94)
  const companyName = profile?.company_name || profile?.full_name || 'Your Company'
  doc.text(companyName, 120, 25)
  
  if (profile?.email) {
    doc.setFontSize(10)
    doc.setTextColor(127, 140, 141)
    doc.text(profile.email, 120, 32)
  }
  
  if (profile?.phone) {
    doc.text(profile.phone, 120, 37)
  }
  
  // Invoice details
  doc.setFontSize(14)
  doc.setTextColor(44, 62, 80)
  doc.text(`Invoice #: ${invoice.invoice_number}`, 20, 50)
  
  doc.setFontSize(10)
  doc.setTextColor(127, 140, 141)
  doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 20, 60)
  
  if (invoice.due_date) {
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 20, 67)
  }
  
  // Client info
  const client = invoice.projects.clients[0]
  doc.setFontSize(12)
  doc.setTextColor(44, 62, 80)
  doc.text('Bill To:', 20, 85)
  
  doc.setFontSize(10)
  doc.setTextColor(52, 73, 94)
  const clientName = client?.company_name || client?.name || 'Client'
  doc.text(clientName, 20, 95)
  
  if (client?.name && client?.company_name) {
    doc.text(client.name, 20, 102)
  }
  
  if (client?.email) {
    doc.text(client.email, 20, 109)
  }
  
  if (client?.phone) {
    doc.text(client.phone, 20, 116)
  }
  
  if (client?.address) {
    const addressLines = client.address.split('\n')
    addressLines.forEach((line: string, index: number) => {
      doc.text(line, 20, 123 + (index * 7))
    })
  }
  
  // Project info
  doc.setFontSize(12)
  doc.setTextColor(44, 62, 80)
  doc.text('Project:', 120, 85)
  
  doc.setFontSize(10)
  doc.setTextColor(52, 73, 94)
  doc.text(invoice.projects.name, 120, 95)
  
  if (invoice.projects.description) {
    const descLines = doc.splitTextToSize(invoice.projects.description, 60)
    descLines.forEach((line: string, index: number) => {
      doc.text(line, 120, 102 + (index * 5))
    })
  }
  
  // Line items table
  const startY = 150
  const tableHeaders = ['Description', 'Type', 'Qty', 'Unit Price', 'Total']
  const columnWidths = [70, 25, 20, 30, 30]
  const startX = 20
  
  // Table header
  doc.setFillColor(236, 240, 241)
  doc.rect(startX, startY - 10, 175, 8, 'F')
  
  doc.setFontSize(10)
  doc.setTextColor(44, 62, 80)
  doc.setFont('helvetica', 'bold')
  
  let currentX = startX
  tableHeaders.forEach((header, index) => {
    doc.text(header, currentX + 2, startY - 3)
    currentX += columnWidths[index]
  })
  
  // Table content
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(52, 73, 94)
  
  let currentY = startY + 5
  lineItems?.forEach((item: { description: string; item_type: string; quantity: number; unit_price: number; total_price: number }) => {
    if (currentY > 250) {
      doc.addPage()
      currentY = 20
    }
    
    currentX = startX
    doc.text(item.description, currentX + 2, currentY)
    currentX += columnWidths[0]
    
    doc.text(item.item_type, currentX + 2, currentY)
    currentX += columnWidths[1]
    
    doc.text(item.quantity.toString(), currentX + 2, currentY)
    currentX += columnWidths[2]
    
    doc.text(`$${item.unit_price.toFixed(2)}`, currentX + 2, currentY)
    currentX += columnWidths[3]
    
    doc.text(`$${item.total_price.toFixed(2)}`, currentX + 2, currentY)
    
    currentY += 8
  })
  
  // Totals
  const totalsY = Math.max(currentY + 10, 220)
  
  doc.setFontSize(10)
  doc.setTextColor(44, 62, 80)
  
  // Subtotal
  doc.text('Subtotal:', 140, totalsY)
  doc.text(`$${invoice.subtotal.toFixed(2)}`, 170, totalsY)
  
  // Tax
  if (invoice.tax_rate > 0) {
    doc.text(`Tax (${invoice.tax_rate}%):`, 140, totalsY + 8)
    doc.text(`$${invoice.tax_amount.toFixed(2)}`, 170, totalsY + 8)
  }
  
  // Total
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Total:', 140, totalsY + 20)
  doc.text(`$${invoice.total_amount.toFixed(2)}`, 170, totalsY + 20)
  
  // Amount paid and balance
  if (invoice.amount_paid > 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(39, 174, 96)
    doc.text('Amount Paid:', 140, totalsY + 32)
    doc.text(`$${invoice.amount_paid.toFixed(2)}`, 170, totalsY + 32)
    
    doc.setTextColor(231, 76, 60)
    doc.text('Balance Due:', 140, totalsY + 40)
    doc.text(`$${invoice.balance_due.toFixed(2)}`, 170, totalsY + 40)
  }
  
  // Notes and Terms
  const notesY = totalsY + 60
  if (invoice.notes) {
    doc.setFontSize(10)
    doc.setTextColor(44, 62, 80)
    doc.setFont('helvetica', 'bold')
    doc.text('Notes:', 20, notesY)
    
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(52, 73, 94)
    const notesLines = doc.splitTextToSize(invoice.notes, 80)
    notesLines.forEach((line: string, index: number) => {
      doc.text(line, 20, notesY + 8 + (index * 5))
    })
  }
  
  if (invoice.terms) {
    const termsY = notesY + (invoice.notes ? 30 : 0)
    doc.setFontSize(10)
    doc.setTextColor(44, 62, 80)
    doc.setFont('helvetica', 'bold')
    doc.text('Terms:', 20, termsY)
    
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(52, 73, 94)
    const termsLines = doc.splitTextToSize(invoice.terms, 80)
    termsLines.forEach((line: string, index: number) => {
      doc.text(line, 20, termsY + 8 + (index * 5))
    })
  }
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(127, 140, 141)
    doc.text(`Page ${i} of ${pageCount}`, 20, 280)
    doc.text('Generated by BuildLedger', 150, 280)
  }

  const pdfString = doc.output('datauristring')
  const base64 = pdfString.split(',')[1]

  return {
    content: base64,
    filename: `invoice-${invoice.invoice_number}.pdf`,
    type: 'application/pdf'
  }
}

// Generate a comprehensive Quote PDF
const generateQuotePDF = async (quoteId: string, supabase: SupabaseClient) => {
  const { data: quote } = await supabase
    .from('quotes')
    .select(`
      *,
      projects (
        name,
        description,
        clients (
          name,
          company_name,
          email,
          phone,
          address
        )
      )
    `)
    .eq('id', quoteId)
    .single()

  if (!quote) {
    throw new Error('Quote not found')
  }

  // Get line items
  const { data: lineItems } = await supabase
    .from('line_items')
    .select('*')
    .eq('project_id', quote.project_id)
    .order('created_at')

  // Get user profile for company info
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_name, full_name, email, phone, logo_url, logo_display')
    .eq('id', quote.user_id)
    .single()

  const jsPDF = (await import('jspdf')).default
  const doc = new jsPDF()

  // Fetch and add logo image after doc is created
  const logoUrl = profile?.logo_url
  const logoDisplay = profile?.logo_display || 'top-right'
  if (logoUrl) {
    const img = await fetch(logoUrl).then(r => r.blob()).then(blob => new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    }))
    if (logoDisplay === 'background') {
      doc.addImage(img as string, 'PNG', 30, 80, 150, 150, undefined, 'FAST')
      doc.setDrawColor(255,255,255)
    } else if (logoDisplay === 'top-left') {
      doc.addImage(img as string, 'PNG', 20, 10, 40, 40, undefined, 'FAST')
    } else {
      doc.addImage(img as string, 'PNG', 150, 10, 40, 40, undefined, 'FAST')
    }
  }
  
  // Set up fonts and colors
  doc.setFont('helvetica')
  
  // Header
  doc.setFontSize(24)
  doc.setTextColor(44, 62, 80)
  doc.text('QUOTE', 20, 30)
  
  // Company info (top right)
  doc.setFontSize(12)
  doc.setTextColor(52, 73, 94)
  const companyName = profile?.company_name || profile?.full_name || 'Your Company'
  doc.text(companyName, 120, 25)
  
  if (profile?.email) {
    doc.setFontSize(10)
    doc.setTextColor(127, 140, 141)
    doc.text(profile.email, 120, 32)
  }
  
  if (profile?.phone) {
    doc.text(profile.phone, 120, 37)
  }
  
  // Quote details
  doc.setFontSize(14)
  doc.setTextColor(44, 62, 80)
  doc.text(`Quote #: ${quote.quote_number}`, 20, 50)
  
  doc.setFontSize(10)
  doc.setTextColor(127, 140, 141)
  doc.text(`Date: ${new Date(quote.created_at).toLocaleDateString()}`, 20, 60)
  
  if (quote.valid_until) {
    doc.text(`Valid Until: ${new Date(quote.valid_until).toLocaleDateString()}`, 20, 67)
  }
  
  // Client info
  const client = quote.projects.clients[0]
  doc.setFontSize(12)
  doc.setTextColor(44, 62, 80)
  doc.text('For:', 20, 85)
  
  doc.setFontSize(10)
  doc.setTextColor(52, 73, 94)
  const clientName = client?.company_name || client?.name || 'Client'
  doc.text(clientName, 20, 95)
  
  if (client?.name && client?.company_name) {
    doc.text(client.name, 20, 102)
  }
  
  if (client?.email) {
    doc.text(client.email, 20, 109)
  }
  
  if (client?.phone) {
    doc.text(client.phone, 20, 116)
  }
  
  if (client?.address) {
    const addressLines = client.address.split('\n')
    addressLines.forEach((line: string, index: number) => {
      doc.text(line, 20, 123 + (index * 7))
    })
  }
  
  // Project info
  doc.setFontSize(12)
  doc.setTextColor(44, 62, 80)
  doc.text('Project:', 120, 85)
  
  doc.setFontSize(10)
  doc.setTextColor(52, 73, 94)
  doc.text(quote.projects.name, 120, 95)
  
  if (quote.projects.description) {
    const descLines = doc.splitTextToSize(quote.projects.description, 60)
    descLines.forEach((line: string, index: number) => {
      doc.text(line, 120, 102 + (index * 5))
    })
  }
  
  // Line items table
  const startY = 150
  const tableHeaders = ['Description', 'Type', 'Qty', 'Unit Price', 'Total']
  const columnWidths = [70, 25, 20, 30, 30]
  const startX = 20
  
  // Table header
  doc.setFillColor(236, 240, 241)
  doc.rect(startX, startY - 10, 175, 8, 'F')
  
  doc.setFontSize(10)
  doc.setTextColor(44, 62, 80)
  doc.setFont('helvetica', 'bold')
  
  let currentX = startX
  tableHeaders.forEach((header, index) => {
    doc.text(header, currentX + 2, startY - 3)
    currentX += columnWidths[index]
  })
  
  // Table content
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(52, 73, 94)
  
  let currentY = startY + 5
  lineItems?.forEach((item: { description: string; item_type: string; quantity: number; unit_price: number; total_price: number }) => {
    if (currentY > 250) {
      doc.addPage()
      currentY = 20
    }
    
    currentX = startX
    doc.text(item.description, currentX + 2, currentY)
    currentX += columnWidths[0]
    
    doc.text(item.item_type, currentX + 2, currentY)
    currentX += columnWidths[1]
    
    doc.text(item.quantity.toString(), currentX + 2, currentY)
    currentX += columnWidths[2]
    
    doc.text(`$${item.unit_price.toFixed(2)}`, currentX + 2, currentY)
    currentX += columnWidths[3]
    
    doc.text(`$${item.total_price.toFixed(2)}`, currentX + 2, currentY)
    
    currentY += 8
  })
  
  // Totals
  const totalsY = Math.max(currentY + 10, 220)
  
  doc.setFontSize(10)
  doc.setTextColor(44, 62, 80)
  
  // Subtotal
  doc.text('Subtotal:', 140, totalsY)
  doc.text(`$${quote.subtotal.toFixed(2)}`, 170, totalsY)
  
  // Tax
  if (quote.tax_rate > 0) {
    doc.text(`Tax (${quote.tax_rate}%):`, 140, totalsY + 8)
    doc.text(`$${quote.tax_amount.toFixed(2)}`, 170, totalsY + 8)
  }
  
  // Total
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Total:', 140, totalsY + 20)
  doc.text(`$${quote.total_amount.toFixed(2)}`, 170, totalsY + 20)
  
  // Notes and Terms
  const notesY = totalsY + 40
  if (quote.notes) {
    doc.setFontSize(10)
    doc.setTextColor(44, 62, 80)
    doc.setFont('helvetica', 'bold')
    doc.text('Notes:', 20, notesY)
    
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(52, 73, 94)
    const notesLines = doc.splitTextToSize(quote.notes, 80)
    notesLines.forEach((line: string, index: number) => {
      doc.text(line, 20, notesY + 8 + (index * 5))
    })
  }
  
  if (quote.terms) {
    const termsY = notesY + (quote.notes ? 30 : 0)
    doc.setFontSize(10)
    doc.setTextColor(44, 62, 80)
    doc.setFont('helvetica', 'bold')
    doc.text('Terms:', 20, termsY)
    
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(52, 73, 94)
    const termsLines = doc.splitTextToSize(quote.terms, 80)
    termsLines.forEach((line: string, index: number) => {
      doc.text(line, 20, termsY + 8 + (index * 5))
    })
  }
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(127, 140, 141)
    doc.text(`Page ${i} of ${pageCount}`, 20, 280)
    doc.text('Generated by BuildLedger', 150, 280)
  }

  const pdfString = doc.output('datauristring')
  const base64 = pdfString.split(',')[1]

  return {
    content: base64,
    filename: `quote-${quote.quote_number}.pdf`,
    type: 'application/pdf'
  }
} 