// src/lib/schemas/validation.ts
import { z } from 'zod'

// Common field validations
const emailValidation = z.string().email('Please enter a valid email address').optional().or(z.literal(''))
const phoneValidation = z.string().optional()
const requiredString = z.string().min(1, 'This field is required')
const optionalString = z.string().optional()
const positiveNumber = z.number().positive('Must be a positive number')
const nonNegativeNumber = z.number().min(0, 'Must be 0 or greater')

// Client validation schema
export const clientSchema = z.object({
  name: requiredString.max(100, 'Name must be less than 100 characters'),
  email: emailValidation,
  phone: phoneValidation,
  company_name: optionalString.max(100, 'Company name must be less than 100 characters'),
  address: optionalString.max(200, 'Address must be less than 200 characters'),
  city: optionalString.max(50, 'City must be less than 50 characters'),
  state: optionalString.max(50, 'State must be less than 50 characters'),
  zip_code: optionalString.max(10, 'ZIP code must be less than 10 characters'),
  notes: optionalString.max(500, 'Notes must be less than 500 characters')
})

export type ClientFormData = z.infer<typeof clientSchema>

// Project validation schema
export const projectSchema = z.object({
  name: requiredString.max(100, 'Project name must be less than 100 characters'),
  description: optionalString.max(500, 'Description must be less than 500 characters'),
  client_id: requiredString,
  status: z.enum(['draft', 'quoted', 'approved', 'in_progress', 'completed', 'cancelled']),
  address: optionalString.max(200, 'Address must be less than 200 characters'),
  city: optionalString.max(50, 'City must be less than 50 characters'),
  state: optionalString.max(50, 'State must be less than 50 characters'),
  zip_code: optionalString.max(10, 'ZIP code must be less than 10 characters'),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal(''))
}).refine((data) => {
  if (data.start_date && data.end_date) {
    return new Date(data.start_date) <= new Date(data.end_date)
  }
  return true
}, {
  message: 'End date must be after start date',
  path: ['end_date']
})

export type ProjectFormData = z.infer<typeof projectSchema>

// Line item validation schema
export const lineItemSchema = z.object({
  id: z.string(),
  description: requiredString.max(200, 'Description must be less than 200 characters'),
  quantity: positiveNumber.max(999999, 'Quantity too large'),
  unit_price: nonNegativeNumber.max(999999, 'Unit price too large'),
  item_type: z.enum(['service', 'material', 'labor']).default('service')
})

export type LineItemFormData = z.infer<typeof lineItemSchema>

// Quote validation schema
export const quoteSchema = z.object({
  project_id: requiredString,
  quote_number: requiredString.max(50, 'Quote number must be less than 50 characters'),
  status: z.enum(['draft', 'sent', 'approved', 'rejected', 'expired']).default('draft'),
  valid_until: z.string().optional().or(z.literal('')),
  tax_rate: nonNegativeNumber.max(100, 'Tax rate cannot exceed 100%').default(0),
  notes: optionalString.max(500, 'Notes must be less than 500 characters'),
  terms: optionalString.max(500, 'Terms must be less than 500 characters'),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required')
}).refine((data) => {
  if (data.valid_until) {
    return new Date(data.valid_until) > new Date()
  }
  return true
}, {
  message: 'Valid until date must be in the future',
  path: ['valid_until']
})

export type QuoteFormData = z.infer<typeof quoteSchema>

// Invoice validation schema
export const invoiceSchema = z.object({
  project_id: requiredString,
  invoice_number: requiredString.max(50, 'Invoice number must be less than 50 characters'),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).default('draft'),
  issued_date: requiredString,
  due_date: z.string().optional().or(z.literal('')),
  amount_paid: nonNegativeNumber.default(0),
  tax_rate: nonNegativeNumber.max(100, 'Tax rate cannot exceed 100%').default(0),
  notes: optionalString.max(500, 'Notes must be less than 500 characters'),
  terms: optionalString.max(500, 'Terms must be less than 500 characters'),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required')
}).refine((data) => {
  if (data.due_date) {
    return new Date(data.due_date) >= new Date(data.issued_date)
  }
  return true
}, {
  message: 'Due date must be after issued date',
  path: ['due_date']
})

export type InvoiceFormData = z.infer<typeof invoiceSchema>

// User profile validation schema
export const userProfileSchema = z.object({
  full_name: optionalString.max(100, 'Full name must be less than 100 characters'),
  company_name: optionalString.max(100, 'Company name must be less than 100 characters'),
  phone: phoneValidation,
  address: optionalString.max(200, 'Address must be less than 200 characters'),
  city: optionalString.max(50, 'City must be less than 50 characters'),
  state: optionalString.max(50, 'State must be less than 50 characters'),
  zip_code: optionalString.max(10, 'ZIP code must be less than 10 characters'),
  trade_type: optionalString.max(50, 'Trade type must be less than 50 characters'),
  license_number: optionalString.max(50, 'License number must be less than 50 characters'),
  website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
  tax_id: optionalString.max(50, 'Tax ID must be less than 50 characters'),
  country: optionalString.max(50, 'Country must be less than 50 characters')
})

export type UserProfileFormData = z.infer<typeof userProfileSchema>

// Settings validation schema
export const settingsSchema = z.object({
  notifications_email: z.boolean().default(true),
  notifications_sms: z.boolean().default(false),
  default_payment_terms: z.number().int().min(1).max(365).default(30),
  default_currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  invoice_prefix: z.string().max(10, 'Invoice prefix must be less than 10 characters').default('INV'),
  quote_prefix: z.string().max(10, 'Quote prefix must be less than 10 characters').default('QUO'),
  auto_send_reminders: z.boolean().default(true),
  reminder_days: z.number().int().min(1).max(30).default(7),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  timezone: z.string().default('America/New_York')
})

export type SettingsFormData = z.infer<typeof settingsSchema>

// Login validation schema
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export type LoginFormData = z.infer<typeof loginSchema>

// Signup validation schema
export const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  full_name: optionalString.max(100, 'Full name must be less than 100 characters'),
  company_name: optionalString.max(100, 'Company name must be less than 100 characters')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

export type SignupFormData = z.infer<typeof signupSchema> 