-- Fix profiles table schema issues
-- Run this in your Supabase SQL Editor to resolve 406 errors

-- First, let's check if the columns exist and add them if they don't
DO $$ 
BEGIN
    -- Add logo_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'logo_url') THEN
        ALTER TABLE profiles ADD COLUMN logo_url TEXT;
    END IF;
    
    -- Add logo_filename column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'logo_filename') THEN
        ALTER TABLE profiles ADD COLUMN logo_filename TEXT;
    END IF;
    
    -- Add logo_position column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'logo_position') THEN
        ALTER TABLE profiles ADD COLUMN logo_position TEXT DEFAULT 'top-right';
    END IF;
    
    -- Add logo_size column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'logo_size') THEN
        ALTER TABLE profiles ADD COLUMN logo_size TEXT DEFAULT 'medium';
    END IF;
    
    -- Add logo_enabled column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'logo_enabled') THEN
        ALTER TABLE profiles ADD COLUMN logo_enabled BOOLEAN DEFAULT true;
    END IF;
    
    -- Add logo_width column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'logo_width') THEN
        ALTER TABLE profiles ADD COLUMN logo_width INTEGER DEFAULT 60;
    END IF;
    
    -- Add logo_height column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'logo_height') THEN
        ALTER TABLE profiles ADD COLUMN logo_height INTEGER DEFAULT 60;
    END IF;
    
    -- Add other missing columns that might be needed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'notifications_email') THEN
        ALTER TABLE profiles ADD COLUMN notifications_email BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'notifications_sms') THEN
        ALTER TABLE profiles ADD COLUMN notifications_sms BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'default_payment_terms') THEN
        ALTER TABLE profiles ADD COLUMN default_payment_terms INTEGER DEFAULT 30;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'default_currency') THEN
        ALTER TABLE profiles ADD COLUMN default_currency TEXT DEFAULT 'USD';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'invoice_prefix') THEN
        ALTER TABLE profiles ADD COLUMN invoice_prefix TEXT DEFAULT 'INV';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'quote_prefix') THEN
        ALTER TABLE profiles ADD COLUMN quote_prefix TEXT DEFAULT 'QUO';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'auto_send_reminders') THEN
        ALTER TABLE profiles ADD COLUMN auto_send_reminders BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'reminder_days') THEN
        ALTER TABLE profiles ADD COLUMN reminder_days INTEGER DEFAULT 7;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'theme') THEN
        ALTER TABLE profiles ADD COLUMN theme TEXT DEFAULT 'system';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'timezone') THEN
        ALTER TABLE profiles ADD COLUMN timezone TEXT DEFAULT 'America/New_York';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'website') THEN
        ALTER TABLE profiles ADD COLUMN website TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'tax_id') THEN
        ALTER TABLE profiles ADD COLUMN tax_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'country') THEN
        ALTER TABLE profiles ADD COLUMN country TEXT;
    END IF;
    
END $$;

-- Now let's add the constraints for logo_position and logo_size
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_logo_position_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_logo_position_check 
    CHECK (logo_position IN ('top-left', 'top-right', 'top-center', 'bottom-left', 'bottom-right', 'bottom-center'));

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_logo_size_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_logo_size_check 
    CHECK (logo_size IN ('small', 'medium', 'large'));

-- Add comments for documentation
COMMENT ON COLUMN profiles.logo_url IS 'URL to the uploaded logo file in Supabase Storage';
COMMENT ON COLUMN profiles.logo_filename IS 'Original filename of the uploaded logo';
COMMENT ON COLUMN profiles.logo_position IS 'Position of logo on generated documents (quotes/invoices)';
COMMENT ON COLUMN profiles.logo_size IS 'Size of logo on generated documents';
COMMENT ON COLUMN profiles.logo_enabled IS 'Whether to include logo on generated documents';
COMMENT ON COLUMN profiles.logo_width IS 'Width of logo in pixels for PDF generation';
COMMENT ON COLUMN profiles.logo_height IS 'Height of logo in pixels for PDF generation'; 