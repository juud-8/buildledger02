// src/app/clients/new/page.tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { clientSchema, ClientFormData } from '@/lib/schemas/validation'
import { useToast } from '@/components/ui/Toast'
import { parseSupabaseError, getSuccessMessage } from '@/lib/utils/errorHandling'

interface FormFieldProps {
  label: string
  name: keyof ClientFormData
  type?: string
  placeholder?: string
  required?: boolean
  rows?: number
  register: any
  error?: string
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  placeholder,
  required,
  rows,
  register,
  error
}) => {
  const isTextarea = type === 'textarea'
  
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {isTextarea ? (
        <textarea
          {...register(name)}
          id={name}
          rows={rows || 3}
          placeholder={placeholder}
          className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
          }`}
        />
      ) : (
        <input
          {...register(name)}
          type={type}
          id={name}
          placeholder={placeholder}
          className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
          }`}
        />
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

export default function NewClientPage() {
  const { user, supabase } = useSupabase()
  const router = useRouter()
  const { showSuccess, showError } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company_name: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      notes: ''
    }
  })

  const onSubmit = async (data: ClientFormData) => {
    if (!user) {
      showError('You must be logged in to create a client')
      return
    }

    try {
      const { error } = await supabase
        .from('clients')
        .insert([{
          ...data,
          // Convert empty strings to null for optional fields
          email: data.email || null,
          phone: data.phone || null,
          company_name: data.company_name || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          zip_code: data.zip_code || null,
          notes: data.notes || null,
          user_id: user.id
        }])

      if (error) {
        const appError = parseSupabaseError(error)
        
        // If the error is field-specific, set it on the form
        if (appError.field && appError.field in data) {
          setError(appError.field as keyof ClientFormData, {
            type: 'server',
            message: appError.message
          })
        } else {
          showError(appError.details ? `${appError.message}: ${appError.details}` : appError.message)
        }
        return
      }

      const successMessage = getSuccessMessage('create', 'Client')
      showSuccess(successMessage.message)
      router.push('/clients')

    } catch (error) {
      const appError = parseSupabaseError(error as Error)
      showError(appError.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            href="/clients"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Clients
          </Link>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add New Client</h1>
        <p className="mt-1 text-sm text-gray-600">
          Create a new client to manage projects and billing information.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Basic Information
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Essential client details for identification and communication.
              </p>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6 sm:col-span-3">
                  <FormField
                    label="Full Name"
                    name="name"
                    placeholder="John Doe"
                    required
                    register={register}
                    error={errors.name?.message}
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <FormField
                    label="Company Name"
                    name="company_name"
                    placeholder="ABC Construction"
                    register={register}
                    error={errors.company_name?.message}
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <FormField
                    label="Email Address"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    register={register}
                    error={errors.email?.message}
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <FormField
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    register={register}
                    error={errors.phone?.message}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Address Information
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Location details for project planning and service delivery.
              </p>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6">
                  <FormField
                    label="Street Address"
                    name="address"
                    placeholder="123 Main Street"
                    register={register}
                    error={errors.address?.message}
                  />
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <FormField
                    label="City"
                    name="city"
                    placeholder="New York"
                    register={register}
                    error={errors.city?.message}
                  />
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <FormField
                    label="State / Province"
                    name="state"
                    placeholder="NY"
                    register={register}
                    error={errors.state?.message}
                  />
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <FormField
                    label="ZIP / Postal Code"
                    name="zip_code"
                    placeholder="10001"
                    register={register}
                    error={errors.zip_code?.message}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Additional Notes
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Any additional information about this client.
              </p>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <FormField
                label="Notes"
                name="notes"
                type="textarea"
                rows={4}
                placeholder="Special requirements, preferences, or important details..."
                register={register}
                error={errors.notes?.message}
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <Link
            href="/clients"
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Client
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}