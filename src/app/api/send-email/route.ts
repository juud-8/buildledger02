// src/app/api/send-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, createQuoteEmail, createInvoiceEmail } from '@/lib/email/sendgrid'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

const emailSchema = z.object({
  type: z.enum(['quote', 'invoice']),
  recipientEmail: z.string().email(),
  documentId: z.string().uuid(),
  fromEmail: z.string().email(),
  message: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = emailSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const { type, recipientEmail, documentId, message, fromEmail } = parsed.data

    const supabase = createServerComponentClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

      // TODO: Generate PDF attachment
      // pdfAttachment = await generateQuotePDF(documentId)

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

      // TODO: Generate PDF attachment
      // pdfAttachment = await generateInvoicePDF(documentId)
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
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}