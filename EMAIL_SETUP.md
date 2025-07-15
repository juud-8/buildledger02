# Email Setup Guide for BuildLedger

## Prerequisites

1. **SendGrid Account**: Sign up at [sendgrid.com](https://sendgrid.com)
2. **Domain Email**: A verified domain email address for sending emails

## Step 1: SendGrid Setup

### 1.1 Create SendGrid Account
- Go to [sendgrid.com](https://sendgrid.com)
- Sign up for a free account (allows 100 emails/day)
- Verify your account

### 1.2 Get API Key
1. Navigate to **Settings > API Keys** in SendGrid dashboard
2. Click **Create API Key**
3. Choose **Full Access** or **Restricted Access** with **Mail Send** permissions
4. Copy the API key (you won't see it again)

### 1.3 Verify Sender Email
1. Go to **Settings > Sender Authentication**
2. Choose **Single Sender Verification** or **Domain Authentication** (recommended)
3. Follow the verification process
4. Use this email as your `DEFAULT_SENDER_EMAIL`

## Step 2: Environment Variables

Create a `.env.local` file in your project root:

```bash
# Supabase Configuration (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# SendGrid Email Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
DEFAULT_SENDER_EMAIL=noreply@yourdomain.com
```

## Step 3: Test Email Functionality

1. Start your development server: `npm run dev`
2. Create an invoice with a client that has an email address
3. Go to the invoice view page
4. Click "Send Invoice" button
5. Check the client's email for the invoice

## Step 4: Troubleshooting

### Common Issues:

1. **"SendGrid API key not configured"**
   - Check that `SENDGRID_API_KEY` is set in `.env.local`
   - Restart your development server after adding environment variables

2. **"Unauthorized sender"**
   - Verify your sender email in SendGrid dashboard
   - Use a verified email address as `DEFAULT_SENDER_EMAIL`

3. **Emails not sending**
   - Check SendGrid dashboard for delivery status
   - Verify API key has proper permissions
   - Check browser console for errors

### Testing:

1. **Test with a real email address** in the client record
2. **Check SendGrid dashboard** for email delivery status
3. **Monitor browser console** for any errors
4. **Verify PDF attachment** is included in the email

## Step 5: Production Deployment

### Vercel Deployment:
1. Add environment variables in Vercel dashboard
2. Deploy your application
3. Test email functionality in production

### Other Platforms:
- Add environment variables to your hosting platform
- Ensure `SENDGRID_API_KEY` and `DEFAULT_SENDER_EMAIL` are set

## Email Features

✅ **Invoice Emails**: Professional invoice emails with PDF attachments
✅ **Quote Emails**: Quote emails with PDF attachments  
✅ **Custom Messages**: Optional custom message support
✅ **PDF Attachments**: Automatically generated PDFs
✅ **Professional Templates**: HTML and text email templates
✅ **Error Handling**: Proper error messages and logging

## Security Notes

- Never commit your `.env.local` file to version control
- Use environment variables for all sensitive data
- Regularly rotate your SendGrid API key
- Monitor SendGrid dashboard for unusual activity 