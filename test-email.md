# Email Functionality Test Guide

## Quick Test Steps

### 1. Environment Setup
```bash
# Add to your .env.local file:
SENDGRID_API_KEY=your_sendgrid_api_key_here
DEFAULT_SENDER_EMAIL=noreply@yourdomain.com
```

### 2. Test Email Functionality

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Create a test client with email:**
   - Go to `/clients/new`
   - Create a client with a real email address
   - Save the client

3. **Create a test project:**
   - Go to `/projects/new`
   - Create a project for the client
   - Add some line items
   - Save the project

4. **Create a test invoice:**
   - Go to `/invoices/new`
   - Select the project
   - Add line items
   - Save the invoice

5. **Test email sending:**
   - Go to the invoice view page
   - Click "Send Invoice" button
   - Fill in optional custom message
   - Click "Send Invoice"
   - Check the client's email

### 3. Expected Results

✅ **Success Indicators:**
- Invoice status changes to "Sent"
- Success message appears
- Email arrives in client's inbox
- PDF attachment is included
- Professional email formatting

❌ **Common Issues:**
- "SendGrid API key not configured" → Check environment variables
- "Unauthorized sender" → Verify sender email in SendGrid
- "No recipient email" → Add email to client record
- Email not received → Check spam folder, verify SendGrid dashboard

### 4. SendGrid Dashboard Check

1. Log into SendGrid dashboard
2. Go to **Activity > Email Activity**
3. Look for your sent email
4. Check delivery status and any bounces

### 5. Troubleshooting

**If emails aren't sending:**
1. Check browser console for errors
2. Verify SendGrid API key is correct
3. Ensure sender email is verified
4. Check SendGrid account status

**If emails are going to spam:**
1. Set up domain authentication in SendGrid
2. Use a professional sender email
3. Include proper email content
4. Warm up your sending reputation

## Production Deployment

When deploying to production:

1. **Add environment variables** to your hosting platform
2. **Verify sender domain** in SendGrid
3. **Test with real email addresses**
4. **Monitor SendGrid dashboard** for delivery issues
5. **Set up email analytics** if needed

## Security Best Practices

- ✅ Use environment variables for API keys
- ✅ Verify sender emails in SendGrid
- ✅ Monitor email sending activity
- ✅ Regularly rotate API keys
- ✅ Use professional sender addresses
- ❌ Never hardcode API keys
- ❌ Don't use unverified sender emails 