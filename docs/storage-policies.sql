-- Storage Policies for Logo Upload Feature
-- Run this in your Supabase SQL Editor after creating the 'logos' bucket

-- Policy 1: Allow authenticated users to upload their own logos
CREATE POLICY "Users can upload their own logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Allow users to view their own logos
CREATE POLICY "Users can view their own logos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Allow users to update their own logos
CREATE POLICY "Users can update their own logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Allow users to delete their own logos
CREATE POLICY "Users can delete their own logos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 5: Allow public access to logos (needed for PDF generation)
CREATE POLICY "Public access to logos" ON storage.objects
FOR SELECT USING (bucket_id = 'logos'); 