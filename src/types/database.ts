// src/types/database.ts
export interface Database {
    public: {
      Tables: {
        profiles: {
          Row: {
            id: string
            email: string | null
            full_name: string | null
            company_name: string | null
            phone: string | null
            address: string | null
            city: string | null
            state: string | null
            zip_code: string | null
            trade_type: string | null
            license_number: string | null
            // Logo fields
            logo_url: string | null
            logo_filename: string | null
            logo_position: string | null
            logo_size: string | null
            logo_enabled: boolean | null
            logo_width: number | null
            logo_height: number | null
            // Settings fields
            notifications_email: boolean | null
            notifications_sms: boolean | null
            default_payment_terms: number | null
            default_currency: string | null
            invoice_prefix: string | null
            quote_prefix: string | null
            auto_send_reminders: boolean | null
            reminder_days: number | null
            theme: string | null
            timezone: string | null
            website: string | null
            tax_id: string | null
            country: string | null
            created_at: string
            updated_at: string
          }
          Insert: {
            id: string
            email?: string | null
            full_name?: string | null
            company_name?: string | null
            phone?: string | null
            address?: string | null
            city?: string | null
            state?: string | null
            zip_code?: string | null
            trade_type?: string | null
            license_number?: string | null
            // Logo fields
            logo_url?: string | null
            logo_filename?: string | null
            logo_position?: string | null
            logo_size?: string | null
            logo_enabled?: boolean | null
            logo_width?: number | null
            logo_height?: number | null
            // Settings fields
            notifications_email?: boolean | null
            notifications_sms?: boolean | null
            default_payment_terms?: number | null
            default_currency?: string | null
            invoice_prefix?: string | null
            quote_prefix?: string | null
            auto_send_reminders?: boolean | null
            reminder_days?: number | null
            theme?: string | null
            timezone?: string | null
            website?: string | null
            tax_id?: string | null
            country?: string | null
            created_at?: string
            updated_at?: string
          }
          Update: {
            id?: string
            email?: string | null
            full_name?: string | null
            company_name?: string | null
            phone?: string | null
            address?: string | null
            city?: string | null
            state?: string | null
            zip_code?: string | null
            trade_type?: string | null
            license_number?: string | null
            // Logo fields
            logo_url?: string | null
            logo_filename?: string | null
            logo_position?: string | null
            logo_size?: string | null
            logo_enabled?: boolean | null
            logo_width?: number | null
            logo_height?: number | null
            // Settings fields
            notifications_email?: boolean | null
            notifications_sms?: boolean | null
            default_payment_terms?: number | null
            default_currency?: string | null
            invoice_prefix?: string | null
            quote_prefix?: string | null
            auto_send_reminders?: boolean | null
            reminder_days?: number | null
            theme?: string | null
            timezone?: string | null
            website?: string | null
            tax_id?: string | null
            country?: string | null
            created_at?: string
            updated_at?: string
          }
        }
        clients: {
          Row: {
            id: string
            user_id: string
            name: string
            email: string | null
            phone: string | null
            address: string | null
            city: string | null
            state: string | null
            zip_code: string | null
            company_name: string | null
            notes: string | null
            created_at: string
            updated_at: string
          }
          Insert: {
            id?: string
            user_id: string
            name: string
            email?: string | null
            phone?: string | null
            address?: string | null
            city?: string | null
            state?: string | null
            zip_code?: string | null
            company_name?: string | null
            notes?: string | null
            created_at?: string
            updated_at?: string
          }
          Update: {
            id?: string
            user_id?: string
            name?: string
            email?: string | null
            phone?: string | null
            address?: string | null
            city?: string | null
            state?: string | null
            zip_code?: string | null
            company_name?: string | null
            notes?: string | null
            created_at?: string
            updated_at?: string
          }
        }
        projects: {
          Row: {
            id: string
            user_id: string
            client_id: string
            name: string
            description: string | null
            address: string | null
            city: string | null
            state: string | null
            zip_code: string | null
            status: 'draft' | 'quoted' | 'approved' | 'in_progress' | 'completed' | 'cancelled'
            start_date: string | null
            end_date: string | null
            created_at: string
            updated_at: string
          }
          Insert: {
            id?: string
            user_id: string
            client_id: string
            name: string
            description?: string | null
            address?: string | null
            city?: string | null
            state?: string | null
            zip_code?: string | null
            status?: 'draft' | 'quoted' | 'approved' | 'in_progress' | 'completed' | 'cancelled'
            start_date?: string | null
            end_date?: string | null
            created_at?: string
            updated_at?: string
          }
          Update: {
            id?: string
            user_id?: string
            client_id?: string
            name?: string
            description?: string | null
            address?: string | null
            city?: string | null
            state?: string | null
            zip_code?: string | null
            status?: 'draft' | 'quoted' | 'approved' | 'in_progress' | 'completed' | 'cancelled'
            start_date?: string | null
            end_date?: string | null
            created_at?: string
            updated_at?: string
          }
        }
        line_items: {
          Row: {
            id: string
            project_id: string
            item_type: 'service' | 'material' | 'labor'
            description: string
            quantity: number
            unit_price: number
            total_price: number
            created_at: string
            updated_at: string
          }
          Insert: {
            id?: string
            project_id: string
            item_type?: 'service' | 'material' | 'labor'
            description: string
            quantity?: number
            unit_price: number
            created_at?: string
            updated_at?: string
          }
          Update: {
            id?: string
            project_id?: string
            item_type?: 'service' | 'material' | 'labor'
            description?: string
            quantity?: number
            unit_price?: number
            created_at?: string
            updated_at?: string
          }
        }
        quotes: {
          Row: {
            id: string
            user_id: string
            project_id: string
            quote_number: string
            status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired'
            subtotal: number
            tax_rate: number
            tax_amount: number
            total_amount: number
            notes: string | null
            terms: string | null
            valid_until: string | null
            created_at: string
            updated_at: string
          }
          Insert: {
            id?: string
            user_id: string
            project_id: string
            quote_number?: string
            status?: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired'
            subtotal?: number
            tax_rate?: number
            notes?: string | null
            terms?: string | null
            valid_until?: string | null
            created_at?: string
            updated_at?: string
          }
          Update: {
            id?: string
            user_id?: string
            project_id?: string
            quote_number?: string
            status?: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired'
            subtotal?: number
            tax_rate?: number
            notes?: string | null
            terms?: string | null
            valid_until?: string | null
            created_at?: string
            updated_at?: string
          }
        }
        invoices: {
          Row: {
            id: string
            user_id: string
            project_id: string
            quote_id: string | null
            invoice_number: string
            status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
            subtotal: number
            tax_rate: number
            tax_amount: number
            total_amount: number
            amount_paid: number
            balance_due: number
            due_date: string | null
            notes: string | null
            terms: string | null
            created_at: string
            updated_at: string
          }
          Insert: {
            id?: string
            user_id: string
            project_id: string
            quote_id?: string | null
            invoice_number?: string
            status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
            subtotal?: number
            tax_rate?: number
            amount_paid?: number
            due_date?: string | null
            notes?: string | null
            terms?: string | null
            created_at?: string
            updated_at?: string
          }
          Update: {
            id?: string
            user_id?: string
            project_id?: string
            quote_id?: string | null
            invoice_number?: string
            status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
            subtotal?: number
            tax_rate?: number
            amount_paid?: number
            due_date?: string | null
            notes?: string | null
            terms?: string | null
            created_at?: string
            updated_at?: string
          }
        }
        payments: {
          Row: {
            id: string
            user_id: string
            invoice_id: string
            amount: number
            payment_date: string
            payment_method: string | null
            reference_number: string | null
            notes: string | null
            created_at: string
          }
          Insert: {
            id?: string
            user_id: string
            invoice_id: string
            amount: number
            payment_date: string
            payment_method?: string | null
            reference_number?: string | null
            notes?: string | null
            created_at?: string
          }
          Update: {
            id?: string
            user_id?: string
            invoice_id?: string
            amount?: number
            payment_date?: string
            payment_method?: string | null
            reference_number?: string | null
            notes?: string | null
            created_at?: string
          }
        }
      }
    }
  }
  