// src/lib/email/sendgrid.ts
import sgMail from '@sendgrid/mail'

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

export interface EmailData {
  to: string
  from: string
  subject: string
  text: string
  html: string
  attachments?: Array<{
    content: string
    filename: string
    type: string
    disposition: string
  }>
}

export const sendEmail = async (emailData: EmailData) => {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SendGrid API key not configured')
    }

    const msg = {
      to: emailData.to,
      from: emailData.from, // This should be a verified sender in SendGrid
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
      attachments: emailData.attachments || []
    }

    const response = await sgMail.send(msg)
    console.log('Email sent successfully:', response[0].statusCode)
    return { success: true, messageId: response[0].headers['x-message-id'] }
  } catch (error) {
    console.error('SendGrid error:', error)
    throw error
  }
}

// Email templates
export const createQuoteEmail = (
  clientName: string,
  quoteNumber: string,
  companyName: string,
  message?: string
) => {
  const defaultMessage = `Dear ${clientName},

Please find attached your quote ${quoteNumber}. We appreciate the opportunity to work with you.

If you have any questions or would like to proceed with this quote, please don't hesitate to contact us.

Best regards,
${companyName}`

  return {
    subject: `Quote ${quoteNumber} from ${companyName}`,
    text: message || defaultMessage,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 20px;">Quote ${quoteNumber}</h2>
          <p style="line-height: 1.6; color: #555;">
            ${(message || defaultMessage).replace(/\n/g, '<br>')}
          </p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #888; font-size: 12px;">
              This email was sent from BuildLedger - Professional invoicing for tradespeople
            </p>
          </div>
        </div>
      </div>
    `
  }
}

export const createInvoiceEmail = (
  clientName: string,
  invoiceNumber: string,
  companyName: string,
  dueDate: string,
  totalAmount: string,
  message?: string
) => {
  const defaultMessage = `Dear ${clientName},

Please find attached invoice ${invoiceNumber} in the amount of ${totalAmount}.

Payment is due by ${dueDate}.

Thank you for your business!

Best regards,
${companyName}`

  return {
    subject: `Invoice ${invoiceNumber} from ${companyName}`,
    text: message || defaultMessage,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 20px;">Invoice ${invoiceNumber}</h2>
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 0; font-weight: bold; color: #1976d2;">
              Amount Due: ${totalAmount}
            </p>
            <p style="margin: 5px 0 0 0; color: #1976d2;">
              Due Date: ${dueDate}
            </p>
          </div>
          <p style="line-height: 1.6; color: #555;">
            ${(message || defaultMessage).replace(/\n/g, '<br>')}
          </p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #888; font-size: 12px;">
              This email was sent from BuildLedger - Professional invoicing for tradespeople
            </p>
          </div>
        </div>
      </div>
    `
  }
}