# Supabase Storage Setup for Logo Uploads

This document explains how to set up Supabase Storage to handle logo uploads for the BuildLedger application.

## Prerequisites

- Supabase project with Storage enabled
- Admin access to your Supabase dashboard

## Step 1: Create Storage Bucket

1. Go to your Supabase dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Configure the bucket:
   - **Name**: `logos`
   - **Public bucket**: ✅ Check this option (logos need to be publicly accessible for PDF generation)
   - **File size limit**: 5MB (or your preferred limit)
   - **Allowed MIME types**: `image/*` (allows all image types)

## Step 2: Configure Storage Policies

After creating the bucket, you need to set up Row Level Security (RLS) policies to control access:

### Policy 1: Allow authenticated users to upload logos

```sql
-- Allow users to upload their own logos
CREATE POLICY "Users can upload their own logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Policy 2: Allow users to view their own logos

```sql
-- Allow users to view their own logos
CREATE POLICY "Users can view their own logos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Policy 3: Allow users to update their own logos

```sql
-- Allow users to update their own logos
CREATE POLICY "Users can update their own logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Policy 4: Allow users to delete their own logos

```sql
-- Allow users to delete their own logos
CREATE POLICY "Users can delete their own logos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Policy 5: Allow public access to logos (for PDF generation)

```sql
-- Allow public access to logos (needed for PDF generation)
CREATE POLICY "Public access to logos" ON storage.objects
FOR SELECT USING (bucket_id = 'logos');
```

## Step 3: Run the SQL Scripts

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Run the following scripts in order:

### First, run the logo support SQL:
```sql
-- Run the contents of docs/add-logo-support.sql
```

### Then, run the storage policies:
```sql
-- Run the storage policies from above
```

## Step 4: Test the Setup

1. Start your development server
2. Go to Settings > Business tab
3. Try uploading a logo image
4. Verify the logo appears in the preview
5. Generate a PDF quote or invoice to test logo inclusion

## File Naming Convention

The application uses the following naming convention for uploaded logos:
- Format: `{user_id}-{timestamp}.{extension}`
- Example: `123e4567-e89b-12d3-a456-426614174000-1640995200000.jpg`

This ensures:
- Each user can only access their own logos
- No filename conflicts between users
- Easy cleanup when users delete their logos

## Troubleshooting

### Common Issues:

1. **"Unauthorized" error when uploading**
   - Check that the storage policies are correctly applied
   - Verify the bucket name is exactly `logos`

2. **Logo not appearing in PDFs**
   - Check that the logo URL is publicly accessible
   - Verify the logo file exists in the storage bucket
   - Check browser console for CORS errors

3. **File size too large**
   - Adjust the bucket's file size limit in Supabase dashboard
   - The application validates 5MB limit on the frontend

4. **Invalid file type**
   - Ensure the bucket allows `image/*` MIME types
   - The application validates file types on the frontend

### Debugging:

1. Check the browser's Network tab for upload requests
2. Verify the logo URL in the user's profile data
3. Check Supabase logs for any storage-related errors
4. Test PDF generation with and without logos

## Security Considerations

- Logos are stored in a public bucket but with user-specific access controls
- File names include user IDs to prevent unauthorized access
- File types are validated both client-side and server-side
- File size limits are enforced to prevent abuse
- Old logos are automatically cleaned up when users upload new ones 