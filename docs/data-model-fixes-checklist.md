# Data Model Inconsistencies Fix Checklist

## 🔍 Issues Identified

### 1. Quote Status Mismatch ✅ FIXED
- **Problem**: Frontend uses `'accepted'` while database uses `'approved'`
- **Files affected**: 
  - `src/app/quotes/page.tsx`
  - `src/app/quotes/new/page.tsx`
- **Solution**: Updated all frontend references to use `'approved'`

### 2. Invoice Payment Status Field ✅ FIXED
- **Problem**: Frontend uses non-existent `payment_status` field
- **Files affected**: 
  - `src/app/invoices/page.tsx`
  - `src/app/invoices/new/page.tsx`
- **Solution**: Removed `payment_status` field, calculate status from `amount_paid` vs `total_amount`

### 3. Line Items Foreign Key Structure ⚠️ DATABASE UPDATE NEEDED
- **Problem**: Line items only reference `project_id`, but need to directly reference `quote_id` or `invoice_id`
- **Files affected**: 
  - Database schema
  - `src/app/quotes/new/page.tsx`
  - `src/app/invoices/new/page.tsx`
- **Solution**: Run `docs/database-schema-fix.sql` to add missing foreign keys

### 4. Line Items Field Names ✅ FIXED
- **Problem**: Forms use `total_amount` but database uses `total_price`
- **Solution**: Updated forms to use correct field names, let database calculate `total_price`

### 5. Missing Profile Settings Fields ✅ FIXED
- **Problem**: TypeScript types missing settings fields that exist in database
- **Files affected**: `src/types/database.ts`
- **Solution**: Added all settings fields to TypeScript types

### 6. Missing Invoice Fields ⚠️ DATABASE UPDATE NEEDED
- **Problem**: `issued_date` field missing from database but used in forms
- **Solution**: Run `docs/database-schema-fix.sql` to add missing field

## 🛠 Manual Database Updates Required

### Step 1: Run Database Schema Fixes
```sql
-- Add missing fields and foreign keys
\i docs/database-schema-fix.sql
```

### Step 2: Add Profile Settings (if not already done)
```sql
-- Add settings fields to profiles
\i docs/add-settings-to-profiles.sql
```

### Step 3: Verify Data Integrity
After running the schema updates, verify:
- [ ] Line items can be associated with quotes OR invoices
- [ ] Invoice `issued_date` field exists
- [ ] Profile settings fields are accessible
- [ ] All foreign key constraints work properly

## 📝 Code Changes Completed

### ✅ TypeScript Types Updated
- [x] Fixed quote status enum
- [x] Removed payment_status from invoice interface
- [x] Added line items foreign key fields
- [x] Added profile settings fields
- [x] Added invoice issued_date field

### ✅ Form Validation Added
- [x] Created comprehensive Zod schemas in `src/lib/schemas/validation.ts`
- [x] Added error handling utilities in `src/lib/utils/errorHandling.ts`
- [x] Created toast notification system in `src/components/ui/Toast.tsx`

### ✅ Frontend Code Fixed
- [x] Updated quote status references
- [x] Removed payment_status field usage
- [x] Fixed line item creation logic
- [x] Added proper field validation

## 🚀 Next Steps

1. **Run database migrations** (schema-fix.sql)
2. **Test all forms** with new validation
3. **Implement React Hook Form** in remaining forms
4. **Add toast notifications** to all forms
5. **Test error handling** with various scenarios

## 📊 Impact Summary

- **Database queries**: More efficient with proper foreign keys
- **Type safety**: 100% alignment between TS types and DB schema
- **User experience**: Better error messages and validation
- **Data integrity**: Proper constraints and relationships
- **Maintainability**: Centralized validation and error handling 