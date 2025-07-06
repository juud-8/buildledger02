// src/lib/utils/errorHandling.ts
import { PostgrestError } from '@supabase/supabase-js'

export interface AppError {
  message: string
  type: 'error' | 'warning' | 'info' | 'success'
  details?: string
  field?: string
}

// Parse Supabase errors into user-friendly messages
export const parseSupabaseError = (error: PostgrestError | Error): AppError => {
  if ('code' in error) {
    // Supabase PostgrestError
    switch (error.code) {
      case '23505': // Unique constraint violation
        if (error.message.includes('email')) {
          return {
            message: 'Email address is already in use',
            type: 'error',
            field: 'email'
          }
        }
        if (error.message.includes('invoice_number')) {
          return {
            message: 'Invoice number already exists',
            type: 'error',
            field: 'invoice_number'
          }
        }
        if (error.message.includes('quote_number')) {
          return {
            message: 'Quote number already exists',
            type: 'error',
            field: 'quote_number'
          }
        }
        return {
          message: 'This value is already in use',
          type: 'error'
        }

      case '23503': // Foreign key constraint violation
        if (error.message.includes('client_id')) {
          return {
            message: 'Selected client does not exist',
            type: 'error',
            field: 'client_id'
          }
        }
        if (error.message.includes('project_id')) {
          return {
            message: 'Selected project does not exist',
            type: 'error',
            field: 'project_id'
          }
        }
        return {
          message: 'Referenced record does not exist',
          type: 'error'
        }

      case '23514': // Check constraint violation
        return {
          message: 'Invalid value provided',
          type: 'error'
        }

      case '42501': // Insufficient privilege
        return {
          message: 'You do not have permission to perform this action',
          type: 'error'
        }

      case 'PGRST301': // Row level security violation
        return {
          message: 'Access denied',
          type: 'error'
        }

      default:
        return {
          message: error.message || 'An unexpected database error occurred',
          type: 'error',
          details: error.details
        }
    }
  }

  // Regular Error
  return {
    message: error.message || 'An unexpected error occurred',
    type: 'error'
  }
}

// Form validation error handler
export const getFieldError = (errors: any, fieldName: string): string | undefined => {
  const fieldError = errors[fieldName]
  if (fieldError) {
    return fieldError.message || 'Invalid value'
  }
  return undefined
}

// Success messages for different operations
export const getSuccessMessage = (operation: string, entity: string): AppError => {
  const messages = {
    create: `${entity} created successfully`,
    update: `${entity} updated successfully`,
    delete: `${entity} deleted successfully`,
    send: `${entity} sent successfully`
  }

  return {
    message: messages[operation as keyof typeof messages] || 'Operation completed successfully',
    type: 'success'
  }
}

// Convert any error to AppError
export const toAppError = (error: unknown): AppError => {
  if (error instanceof Error) {
    return parseSupabaseError(error)
  }
  
  if (typeof error === 'string') {
    return {
      message: error,
      type: 'error'
    }
  }

  return {
    message: 'An unknown error occurred',
    type: 'error'
  }
} 