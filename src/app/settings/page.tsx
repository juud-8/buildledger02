// src/app/settings/page.tsx
'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { User, Building, Bell, Shield, Save } from 'lucide-react'
import LogoUpload from '@/components/ui/LogoUpload'
import LogoCustomization from '@/components/ui/LogoCustomization'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  company_name: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  country: string | null
  website: string | null
  tax_id: string | null
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
  theme: 'light' | 'dark' | 'system' | null
  timezone: string | null
  created_at: string
}

interface Settings {
  notifications_email: boolean
  notifications_sms: boolean
  default_payment_terms: number
  default_currency: string
  invoice_prefix: string
  quote_prefix: string
  auto_send_reminders: boolean
  reminder_days: number
  theme: 'light' | 'dark' | 'system'
  timezone: string
}

export default function SettingsPage() {
  const { user, supabase } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileData, setProfileData] = useState({
    full_name: '',
    company_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    website: '',
    tax_id: ''
  })

  // Settings state
  const [settings, setSettings] = useState<Settings>({
    notifications_email: true,
    notifications_sms: false,
    default_payment_terms: 30,
    default_currency: 'USD',
    invoice_prefix: 'INV',
    quote_prefix: 'QUO',
    auto_send_reminders: true,
    reminder_days: 7,
    theme: 'system',
    timezone: 'America/New_York'
  })

  // Password change state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  // Logo state
  const [logoData, setLogoData] = useState({
    logo_enabled: true,
    logo_position: 'top-right',
    logo_size: 'medium'
  })

  const fetchProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      if (data) {
        setProfile(data)
        setProfileData({
          full_name: data.full_name || '',
          company_name: data.company_name || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zip_code: data.zip_code || '',
          country: data.country || '',
          website: data.website || '',
          tax_id: data.tax_id || ''
        })
        
        // Set logo data
        setLogoData({
          logo_enabled: data.logo_enabled ?? true,
          logo_position: data.logo_position || 'top-right',
          logo_size: data.logo_size || 'medium'
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, user?.id])

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      if (data) {
        // Extract settings from profile data
        setSettings(prev => ({
          ...prev,
          notifications_email: data.notifications_email ?? prev.notifications_email,
          notifications_sms: data.notifications_sms ?? prev.notifications_sms,
          default_payment_terms: data.default_payment_terms ?? prev.default_payment_terms,
          default_currency: data.default_currency ?? prev.default_currency,
          invoice_prefix: data.invoice_prefix ?? prev.invoice_prefix,
          quote_prefix: data.quote_prefix ?? prev.quote_prefix,
          auto_send_reminders: data.auto_send_reminders ?? prev.auto_send_reminders,
          reminder_days: data.reminder_days ?? prev.reminder_days,
          theme: data.theme ?? prev.theme,
          timezone: data.timezone ?? prev.timezone
        }))
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }, [supabase, user?.id])

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchSettings()
    }
  }, [user, fetchProfile, fetchSettings])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user?.id,
          email: user?.email,
          ...profileData,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      setSuccess('Profile updated successfully!')
      fetchProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      setError(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user?.id,
          email: user?.email,
          ...settings,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      setSuccess('Settings updated successfully!')
      fetchSettings()
    } catch (error) {
      console.error('Error updating settings:', error)
      setError(error instanceof Error ? error.message : 'Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match')
      setSaving(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password
      })

      if (error) throw error
      setSuccess('Password updated successfully!')
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
      setShowPasswordChange(false)
    } catch (error) {
      console.error('Error updating password:', error)
      setError(error instanceof Error ? error.message : 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
  }

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               type === 'number' ? parseInt(value) : value
    }))
  }

  // Logo handlers
  const handleLogoUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload-logo', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Upload error response:', error)
      console.error('Response status:', response.status)
      console.error('Full error object:', error)
      // Show both error and details if available
      const errorMessage = error.details
        ? `${error.error || 'Failed to upload logo'}: ${error.details}`
        : error.error || 'Failed to upload logo'
      
      console.error('Throwing error:', errorMessage)
      throw new Error(errorMessage)
    }

    // Refresh profile to get updated logo URL
    await fetchProfile()
  }

  const handleLogoRemove = async () => {
    const response = await fetch('/api/upload-logo', {
      method: 'DELETE'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to remove logo')
    }

    // Refresh profile to get updated logo URL
    await fetchProfile()
  }

  const handleLogoCustomizationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user?.id,
          email: user?.email,
          ...logoData,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      setSuccess('Logo settings updated successfully!')
      fetchProfile()
    } catch (error) {
      console.error('Error updating logo settings:', error)
      setError(error instanceof Error ? error.message : 'Failed to update logo settings')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'business', name: 'Business', icon: Building },
    { id: 'preferences', name: 'Preferences', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-700">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="text-sm text-green-600">{success}</div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Update your personal details and contact information.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    id="full_name"
                    value={profileData.full_name}
                    onChange={handleProfileChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    id="website"
                    value={profileData.website}
                    onChange={handleProfileChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    id="address"
                    value={profileData.address}
                    onChange={handleProfileChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    id="city"
                    value={profileData.city}
                    onChange={handleProfileChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                    State/Province
                  </label>
                  <input
                    type="text"
                    name="state"
                    id="state"
                    value={profileData.state}
                    onChange={handleProfileChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700">
                    ZIP/Postal Code
                  </label>
                  <input
                    type="text"
                    name="zip_code"
                    id="zip_code"
                    value={profileData.zip_code}
                    onChange={handleProfileChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    id="country"
                    value={profileData.country}
                    onChange={handleProfileChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Business Tab */}
          {activeTab === 'business' && (
            <div className="space-y-8">
              {/* Business Information Form */}
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Business Information</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure your business details for invoices and quotes.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="company_name"
                      id="company_name"
                      value={profileData.company_name}
                      onChange={handleProfileChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="tax_id" className="block text-sm font-medium text-gray-700">
                      Tax ID / EIN
                    </label>
                    <input
                      type="text"
                      name="tax_id"
                      id="tax_id"
                      value={profileData.tax_id}
                      onChange={handleProfileChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>

              {/* Logo Upload Section */}
              <div className="border-t border-gray-200 pt-8">
                <LogoUpload
                  currentLogoUrl={profile?.logo_url}
                  onLogoUpload={handleLogoUpload}
                  onLogoRemove={handleLogoRemove}
                  onError={(error) => setError(error)}
                />
              </div>

              {/* Logo Customization Section */}
              <div className="border-t border-gray-200 pt-8">
                <form onSubmit={handleLogoCustomizationSubmit} className="space-y-6">
                  <LogoCustomization
                    logoEnabled={logoData.logo_enabled}
                    logoPosition={logoData.logo_position}
                    logoSize={logoData.logo_size}
                    onLogoEnabledChange={(enabled) => setLogoData(prev => ({ ...prev, logo_enabled: enabled }))}
                    onLogoPositionChange={(position) => setLogoData(prev => ({ ...prev, logo_position: position }))}
                    onLogoSizeChange={(size) => setLogoData(prev => ({ ...prev, logo_size: size }))}
                    disabled={saving}
                  />

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Logo Settings'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <form onSubmit={handleSettingsSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Application Preferences</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Customize your application settings and defaults.
                </p>
              </div>

              <div className="space-y-6">
                {/* Invoice Settings */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Invoice & Quote Settings</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label htmlFor="invoice_prefix" className="block text-sm font-medium text-gray-700">
                        Invoice Prefix
                      </label>
                      <input
                        type="text"
                        name="invoice_prefix"
                        id="invoice_prefix"
                        value={settings.invoice_prefix}
                        onChange={handleSettingsChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="quote_prefix" className="block text-sm font-medium text-gray-700">
                        Quote Prefix
                      </label>
                      <input
                        type="text"
                        name="quote_prefix"
                        id="quote_prefix"
                        value={settings.quote_prefix}
                        onChange={handleSettingsChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="default_payment_terms" className="block text-sm font-medium text-gray-700">
                        Default Payment Terms (days)
                      </label>
                      <input
                        type="number"
                        name="default_payment_terms"
                        id="default_payment_terms"
                        value={settings.default_payment_terms}
                        onChange={handleSettingsChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Notification Settings */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        id="notifications_email"
                        name="notifications_email"
                        type="checkbox"
                        checked={settings.notifications_email}
                        onChange={handleSettingsChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notifications_email" className="ml-3 block text-sm text-gray-700">
                        Email notifications
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="auto_send_reminders"
                        name="auto_send_reminders"
                        type="checkbox"
                        checked={settings.auto_send_reminders}
                        onChange={handleSettingsChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="auto_send_reminders" className="ml-3 block text-sm text-gray-700">
                        Auto-send payment reminders
                      </label>
                    </div>
                  </div>
                </div>

                {/* Currency & Locale */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Currency & Locale</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="default_currency" className="block text-sm font-medium text-gray-700">
                        Default Currency
                      </label>
                      <select
                        name="default_currency"
                        id="default_currency"
                        value={settings.default_currency}
                        onChange={handleSettingsChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                        Timezone
                      </label>
                      <select
                        name="timezone"
                        id="timezone"
                        value={settings.timezone}
                        onChange={handleSettingsChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your account security and password.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Password</h4>
                    <p className="text-sm text-gray-500">
                      Last updated: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Change Password
                  </button>
                </div>
              </div>

              {showPasswordChange && (
                <form onSubmit={handlePasswordChange} className="space-y-4 bg-white border rounded-lg p-4">
                  <div>
                    <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="new_password"
                      id="new_password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirm_password"
                      id="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowPasswordChange(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {saving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 