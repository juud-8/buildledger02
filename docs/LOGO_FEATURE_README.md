# Logo Upload and Customization Feature

This document describes the new logo upload and customization feature added to BuildLedger, allowing users to upload their business logos and customize their appearance on quotes and invoices.

## Features

### 🎨 Logo Upload
- **File Support**: Upload JPG, PNG, GIF, and other image formats
- **Size Limit**: Maximum 5MB per logo
- **Preview**: Real-time preview of uploaded logos
- **Storage**: Secure storage in Supabase with automatic cleanup

### ⚙️ Logo Customization
- **Enable/Disable**: Toggle logo visibility on documents
- **Position Control**: Choose from 6 positions:
  - Top Left
  - Top Center
  - Top Right (default)
  - Bottom Left
  - Bottom Center
  - Bottom Right
- **Size Options**: Three size presets:
  - Small (40px)
  - Medium (60px) - default
  - Large (80px)
- **Live Preview**: See how your logo will appear on documents

### 📄 Document Integration
- **PDF Generation**: Logos automatically included in generated PDFs
- **Quote Support**: Logos appear on quote PDFs
- **Invoice Support**: Logos appear on invoice PDFs
- **Smart Positioning**: Company information adjusts based on logo position

## How to Use

### 1. Upload Your Logo
1. Go to **Settings** > **Business** tab
2. In the "Company Logo" section, click the upload area
3. Select an image file (JPG, PNG, GIF, etc.)
4. The logo will be uploaded and displayed in the preview

### 2. Customize Logo Settings
1. In the "Logo Customization" section:
   - Toggle "Include Logo on Documents" to enable/disable
   - Choose logo position using the position grid
   - Select logo size from the size options
2. Click "Show Preview" to see how it will look on documents
3. Click "Save Logo Settings" to apply changes

### 3. Generate Documents
- Create quotes or invoices as usual
- When you generate PDFs, your logo will appear according to your settings
- If logo is disabled, documents will display without logos

## Technical Implementation

### Database Schema
New fields added to the `profiles` table:
```sql
-- Logo storage fields
logo_url TEXT
logo_filename TEXT

-- Logo customization fields
logo_position TEXT DEFAULT 'top-right'
logo_size TEXT DEFAULT 'medium'
logo_enabled BOOLEAN DEFAULT true

-- Logo dimensions (for PDF generation)
logo_width INTEGER DEFAULT 60
logo_height INTEGER DEFAULT 60
```

### Components
- **LogoUpload**: Handles file upload, preview, and removal
- **LogoCustomization**: Manages logo position, size, and enable/disable settings

### API Routes
- **POST /api/upload-logo**: Upload new logo
- **DELETE /api/upload-logo**: Remove existing logo

### PDF Generation
- Updated `generateInvoicePDF` and `generateQuotePDF` functions
- Logo positioning logic based on user preferences
- Fallback handling if logo loading fails

## Setup Instructions

### 1. Database Setup
Run the SQL script in your Supabase SQL Editor:
```sql
-- Run docs/add-logo-support.sql
```

### 2. Storage Setup
Follow the instructions in `docs/supabase-storage-setup.md` to:
- Create a `logos` storage bucket
- Configure storage policies
- Set up proper access controls

### 3. Application Setup
The feature is automatically available once the database and storage are configured.

## File Structure

```
src/
├── components/ui/
│   ├── LogoUpload.tsx          # Logo upload component
│   └── LogoCustomization.tsx   # Logo settings component
├── app/
│   ├── api/upload-logo/
│   │   └── route.ts            # Logo upload API
│   ├── settings/
│   │   └── page.tsx            # Updated settings page
│   └── api/generate-pdf/
│       └── route.ts            # Updated PDF generation
└── types/
    └── database.ts             # Updated database types

docs/
├── add-logo-support.sql        # Database schema updates
├── supabase-storage-setup.md   # Storage setup guide
└── LOGO_FEATURE_README.md      # This file
```

## Security Features

- **User Isolation**: Each user can only access their own logos
- **File Validation**: Server-side validation of file types and sizes
- **Secure Storage**: Files stored in Supabase with proper access controls
- **Automatic Cleanup**: Old logos are removed when new ones are uploaded

## Browser Support

- Modern browsers with File API support
- Image preview requires Canvas API support
- PDF generation works in all environments where jsPDF is supported

## Troubleshooting

### Logo Not Uploading
- Check file size (must be under 5MB)
- Ensure file is an image format
- Verify Supabase storage is properly configured

### Logo Not Appearing in PDFs
- Check that logo is enabled in settings
- Verify logo URL is accessible
- Check browser console for errors

### Storage Issues
- Ensure storage bucket exists and is named `logos`
- Verify storage policies are correctly applied
- Check Supabase dashboard for storage errors

## Future Enhancements

Potential improvements for future versions:
- **Multiple Logos**: Support for different logos for different document types
- **Logo Templates**: Pre-designed logo placement templates
- **Advanced Positioning**: Pixel-perfect positioning controls
- **Logo Effects**: Support for transparency, borders, etc.
- **Bulk Operations**: Upload logos for multiple users (admin feature)

## Support

For issues or questions about the logo feature:
1. Check the troubleshooting section above
2. Review the Supabase storage setup guide
3. Check browser console for error messages
4. Verify all database and storage configurations are correct 