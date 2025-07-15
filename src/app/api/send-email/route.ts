// src/app/api/send-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, createQuoteEmail, createInvoiceEmail } from '@/lib/email/sendgrid'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, recipientEmail, documentId, message, fromEmail } = body

    // Get user profile for company info
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_name, full_name')
      .eq('id', user.id)
      .single()

    const companyName = profile?.company_name || profile?.full_name || 'Your Company'

    let emailContent
    let pdfAttachment

    if (type === 'quote') {
      // Get quote details
      const { data: quote } = await supabase
        .from('quotes')
        .select(`
          quote_number,
          projects!inner (
            name,
            clients!inner (name)
          )
        `)
        .eq('id', documentId)
        .single()

      if (!quote) {
        return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
      }

      const clientName = (quote.projects as { clients?: { name?: string } })?.clients?.name || 'Client'
      emailContent = createQuoteEmail(clientName, quote.quote_number, companyName, message)

      // Generate PDF attachment
      pdfAttachment = await generateQuotePDF(documentId)

    } else if (type === 'invoice') {
      // Get invoice details
      const { data: invoice } = await supabase
        .from('invoices')
        .select(`
          invoice_number,
          total_amount,
          due_date,
          projects!inner (
            name,
            clients!inner (name)
          )
        `)
        .eq('id', documentId)
        .single()

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      }

      const clientName = (invoice.projects as { clients?: { name?: string } })?.clients?.name || 'Client'
      const dueDate = new Date(invoice.due_date).toLocaleDateString()
      const totalAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(invoice.total_amount)

      emailContent = createInvoiceEmail(
        clientName,
        invoice.invoice_number,
        companyName,
        dueDate,
        totalAmount,
        message
      )

      // Generate PDF attachment
      pdfAttachment = await generateInvoicePDF(documentId)
    } else {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }

    // Send email
    const emailData = {
      to: recipientEmail,
      from: fromEmail, // This must be a verified sender in SendGrid
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
      attachments: pdfAttachment ? [pdfAttachment] : undefined
    }

    const result = await sendEmail(emailData)

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: 'Email sent successfully'
    })

  } catch (error) {
    console.error('Email API error:', error)
    let errorMessage = 'Failed to send email'
    let status = 500
    
    // Type guard to check if error has response property
    if (error && typeof error === 'object' && 'response' in error) {
      const responseError = error as { response?: { status?: number } }
      if (responseError.response?.status === 401) {
        errorMessage = 'Unauthorized: Invalid SendGrid API key or sender verification'
        status = 401
      } else if (responseError.response?.status === 400) {
        errorMessage = 'Bad Request: Invalid email data'
        status = 400
      }
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.message : 'Unknown error' },
      { status }
    )
  }
}

// Generate a simple Quote PDF using jsPDF
const generateQuotePDF = async (quoteId: string) => {
  const supabase = createServerClient()
  const { data: quote } = await supabase
    .from('quotes')
    .select(
      `quote_number, total_amount, projects!inner (name, clients!inner (name))`
    )
    .eq('id', quoteId)
    .single()

  if (!quote) {
    throw new Error('Quote not found')
  }

  const jsPDF = (await import('jspdf')).default
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(`Quote ${quote.quote_number}`, 10, 20)

  const projectName = (quote.projects as { name?: string })?.name || ''
  const clientName = (quote.projects as { clients?: { name?: string } })?.clients?.name || ''

  doc.setFontSize(12)
  if (projectName) doc.text(`Project: ${projectName}`, 10, 30)
  if (clientName) doc.text(`Client: ${clientName}`, 10, 40)
  if (typeof quote.total_amount === 'number') {
    doc.text(`Total: $${quote.total_amount.toFixed(2)}`, 10, 50)
  }

  const pdfString = doc.output('datauristring')
  const base64 = pdfString.split(',')[1]

  return {
    content: base64,
    filename: `quote-${quote.quote_number}.pdf`,
    type: 'application/pdf',
    disposition: 'attachment'
  }
}

// Generate a simple Invoice PDF using jsPDF
const generateInvoicePDF = async (invoiceId: string) => {
  const supabase = createServerClient()
  const { data: invoice } = await supabase
    .from('invoices')
    .select(
      `invoice_number, total_amount, due_date, projects!inner (name, clients!inner (name))`
    )
    .eq('id', invoiceId)
    .single()

  if (!invoice) {
    throw new Error('Invoice not found')
  }

  const jsPDF = (await import('jspdf')).default
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(`Invoice ${invoice.invoice_number}`, 10, 20)

  const projectName = (invoice.projects as { name?: string })?.name || ''
  const clientName = (invoice.projects as { clients?: { name?: string } })?.clients?.name || ''

  doc.setFontSize(12)
  if (projectName) doc.text(`Project: ${projectName}`, 10, 30)
  if (clientName) doc.text(`Client: ${clientName}`, 10, 40)

  if (invoice.due_date) {
    const dueDate = new Date(invoice.due_date).toLocaleDateString()
    doc.text(`Due: ${dueDate}`, 10, 50)
  }
  if (typeof invoice.total_amount === 'number') {
    doc.text(`Total: $${invoice.total_amount.toFixed(2)}`, 10, 60)
  }

  const pdfString = doc.output('datauristring')
  const base64 = pdfString.split(',')[1]

  return {
    content: base64,
    filename: `invoice-${invoice.invoice_number}.pdf`,
    type: 'application/pdf',
    disposition: 'attachment'
  }
}
