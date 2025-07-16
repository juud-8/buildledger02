'use client'

import { useState } from 'react'
import { Settings, Image as ImageIcon } from 'lucide-react'

interface LogoCustomizationProps {
  logoEnabled: boolean
  logoPosition: string
  logoSize: string
  onLogoEnabledChange: (enabled: boolean) => void
  onLogoPositionChange: (position: string) => void
  onLogoSizeChange: (size: string) => void
  disabled?: boolean
  className?: string
}

const positionOptions = [
  { value: 'top-left', label: 'Top Left', icon: '↖' },
  { value: 'top-center', label: 'Top Center', icon: '↑' },
  { value: 'top-right', label: 'Top Right', icon: '↗' },
  { value: 'bottom-left', label: 'Bottom Left', icon: '↙' },
  { value: 'bottom-center', label: 'Bottom Center', icon: '↓' },
  { value: 'bottom-right', label: 'Bottom Right', icon: '↘' },
]

const sizeOptions = [
  { value: 'small', label: 'Small (40px)', size: 40 },
  { value: 'medium', label: 'Medium (60px)', size: 60 },
  { value: 'large', label: 'Large (80px)', size: 80 },
]

export default function LogoCustomization({
  logoEnabled,
  logoPosition,
  logoSize,
  onLogoEnabledChange,
  onLogoPositionChange,
  onLogoSizeChange,
  disabled = false,
  className = ''
}: LogoCustomizationProps) {
  const [showPreview, setShowPreview] = useState(false)

  const selectedSize = sizeOptions.find(s => s.value === logoSize)

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Logo Customization</h3>
        </div>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      </div>

      {/* Enable/Disable Logo */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h4 className="text-sm font-medium text-gray-900">Include Logo on Documents</h4>
          <p className="text-sm text-gray-500">
            Show your company logo on quotes and invoices
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={logoEnabled}
            onChange={(e) => onLogoEnabledChange(e.target.checked)}
            disabled={disabled}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      {logoEnabled && (
        <>
          {/* Logo Position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Logo Position
            </label>
            <div className="grid grid-cols-3 gap-3">
              {positionOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onLogoPositionChange(option.value)}
                  disabled={disabled}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    logoPosition === option.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="text-lg mb-1">{option.icon}</div>
                  <div className="text-xs font-medium">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Logo Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Logo Size
            </label>
            <div className="grid grid-cols-3 gap-3">
              {sizeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onLogoSizeChange(option.value)}
                  disabled={disabled}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    logoSize === option.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex justify-center mb-2">
                    <div
                      className="bg-gray-300 rounded"
                      style={{
                        width: `${option.size * 0.3}px`,
                        height: `${option.size * 0.3}px`
                      }}
                    />
                  </div>
                  <div className="text-xs font-medium">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="border border-gray-300 rounded-lg p-4 bg-white">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Document Preview</h4>
              <div className="relative border border-gray-200 rounded-lg p-6 bg-gray-50 min-h-[200px]">
                {/* Simulated document content */}
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">INVOICE</h2>
                  <p className="text-sm text-gray-600">Invoice #: INV-0001</p>
                </div>

                {/* Logo preview based on position and size */}
                <div
                  className={`absolute ${
                    logoPosition === 'top-left' ? 'top-4 left-4' :
                    logoPosition === 'top-center' ? 'top-4 left-1/2 transform -translate-x-1/2' :
                    logoPosition === 'top-right' ? 'top-4 right-4' :
                    logoPosition === 'bottom-left' ? 'bottom-4 left-4' :
                    logoPosition === 'bottom-center' ? 'bottom-4 left-1/2 transform -translate-x-1/2' :
                    'bottom-4 right-4'
                  }`}
                >
                  <div
                    className="bg-indigo-100 border-2 border-indigo-300 rounded flex items-center justify-center text-indigo-600"
                    style={{
                      width: `${selectedSize?.size || 60}px`,
                      height: `${selectedSize?.size || 60}px`
                    }}
                  >
                    <ImageIcon className="w-1/2 h-1/2" />
                  </div>
                </div>

                {/* Document content */}
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Company Name</p>
                  <p>123 Business St</p>
                  <p>City, State 12345</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This is a preview of how your logo will appear on documents
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
} 