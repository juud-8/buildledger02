-- Add settings fields to profiles table
-- Run this in your Supabase SQL Editor to add user settings support

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notifications_email BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notifications_sms BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_payment_terms INTEGER DEFAULT 30;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_currency TEXT DEFAULT 'USD';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invoice_prefix TEXT DEFAULT 'INV';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS quote_prefix TEXT DEFAULT 'QUO';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auto_send_reminders BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reminder_days INTEGER DEFAULT 7;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;

-- Update the UserProfile interface to match these new fields
-- The settings page should now work correctly with these additions 