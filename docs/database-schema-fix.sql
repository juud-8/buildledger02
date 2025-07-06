-- Database Schema Fixes for BuildLedger
-- Run this script to fix all data model inconsistencies

-- Add missing invoice fields
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS issued_date DATE;

-- Update line_items table to support both quotes and invoices
ALTER TABLE line_items ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE;
ALTER TABLE line_items ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE;

-- Add constraint to ensure line item belongs to either quote or invoice, but not both
ALTER TABLE line_items ADD CONSTRAINT check_line_item_parent 
CHECK (
    (quote_id IS NOT NULL AND invoice_id IS NULL) OR 
    (quote_id IS NULL AND invoice_id IS NOT NULL)
);

-- Update line_items policies to work with both quotes and invoices
DROP POLICY IF EXISTS "Users can view own line items" ON line_items;
DROP POLICY IF EXISTS "Users can create own line items" ON line_items;
DROP POLICY IF EXISTS "Users can update own line items" ON line_items;
DROP POLICY IF EXISTS "Users can delete own line items" ON line_items;

CREATE POLICY "Users can view own line items" ON line_items FOR SELECT USING (
  (quote_id IS NOT NULL AND EXISTS (SELECT 1 FROM quotes WHERE quotes.id = line_items.quote_id AND quotes.user_id = auth.uid())) OR
  (invoice_id IS NOT NULL AND EXISTS (SELECT 1 FROM invoices WHERE invoices.id = line_items.invoice_id AND invoices.user_id = auth.uid())) OR
  (project_id IS NOT NULL AND EXISTS (SELECT 1 FROM projects WHERE projects.id = line_items.project_id AND projects.user_id = auth.uid()))
);

CREATE POLICY "Users can create own line items" ON line_items FOR INSERT WITH CHECK (
  (quote_id IS NOT NULL AND EXISTS (SELECT 1 FROM quotes WHERE quotes.id = line_items.quote_id AND quotes.user_id = auth.uid())) OR
  (invoice_id IS NOT NULL AND EXISTS (SELECT 1 FROM invoices WHERE invoices.id = line_items.invoice_id AND invoices.user_id = auth.uid())) OR
  (project_id IS NOT NULL AND EXISTS (SELECT 1 FROM projects WHERE projects.id = line_items.project_id AND projects.user_id = auth.uid()))
);

CREATE POLICY "Users can update own line items" ON line_items FOR UPDATE USING (
  (quote_id IS NOT NULL AND EXISTS (SELECT 1 FROM quotes WHERE quotes.id = line_items.quote_id AND quotes.user_id = auth.uid())) OR
  (invoice_id IS NOT NULL AND EXISTS (SELECT 1 FROM invoices WHERE invoices.id = line_items.invoice_id AND invoices.user_id = auth.uid())) OR
  (project_id IS NOT NULL AND EXISTS (SELECT 1 FROM projects WHERE projects.id = line_items.project_id AND projects.user_id = auth.uid()))
);

CREATE POLICY "Users can delete own line items" ON line_items FOR DELETE USING (
  (quote_id IS NOT NULL AND EXISTS (SELECT 1 FROM quotes WHERE quotes.id = line_items.quote_id AND quotes.user_id = auth.uid())) OR
  (invoice_id IS NOT NULL AND EXISTS (SELECT 1 FROM invoices WHERE invoices.id = line_items.invoice_id AND invoices.user_id = auth.uid())) OR
  (project_id IS NOT NULL AND EXISTS (SELECT 1 FROM projects WHERE projects.id = line_items.project_id AND projects.user_id = auth.uid()))
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_line_items_quote_id ON line_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_line_items_invoice_id ON line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_line_items_project_id ON line_items(project_id);

-- Update any existing line_items to have proper project_id if missing
-- This is a data migration step - adjust as needed based on your existing data 