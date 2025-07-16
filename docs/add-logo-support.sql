-- Add logo support to profiles table
-- Run this in your Supabase SQL Editor to add logo upload and customization support

-- Logo storage fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_filename TEXT;

-- Logo customization fields for document positioning
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_position TEXT DEFAULT 'top-right' CHECK (logo_position IN ('top-left', 'top-right', 'top-center', 'bottom-left', 'bottom-right', 'bottom-center'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_size TEXT DEFAULT 'medium' CHECK (logo_size IN ('small', 'medium', 'large'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_enabled BOOLEAN DEFAULT true;

-- Logo dimensions (for PDF generation)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_width INTEGER DEFAULT 60;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_height INTEGER DEFAULT 60;

-- Comments for documentation
COMMENT ON COLUMN profiles.logo_url IS 'URL to the uploaded logo file in Supabase Storage';
COMMENT ON COLUMN profiles.logo_filename IS 'Original filename of the uploaded logo';
COMMENT ON COLUMN profiles.logo_position IS 'Position of logo on generated documents (quotes/invoices)';
COMMENT ON COLUMN profiles.logo_size IS 'Size of logo on generated documents';
COMMENT ON COLUMN profiles.logo_enabled IS 'Whether to include logo on generated documents';
COMMENT ON COLUMN profiles.logo_width IS 'Width of logo in pixels for PDF generation';
COMMENT ON COLUMN profiles.logo_height IS 'Height of logo in pixels for PDF generation'; 