'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LogoUploadProps {
  currentLogoUrl?: string | null
  onLogoUpload: (file: File) => Promise<void>
  onLogoRemove: () => Promise<void>
  disabled?: boolean
  className?: string
}

export default function LogoUpload({
  currentLogoUrl,
  onLogoUpload,
  onLogoRemove,
  disabled = false,
  className = ''
}: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, GIF, etc.)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setIsUploading(true)
    try {
      await onLogoUpload(file)
    } catch (error) {
      console.error('Error uploading logo:', error)
      alert('Failed to upload logo. Please try again.')
      setPreviewUrl(currentLogoUrl || null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveLogo = async () => {
    setIsUploading(true)
    try {
      await onLogoRemove()
      setPreviewUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error removing logo:', error)
      alert('Failed to remove logo. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Company Logo
        </label>
        {previewUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemoveLogo}
            disabled={disabled || isUploading}
            className="text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4 mr-1" />
            Remove
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {/* Logo Preview */}
        <div className="flex-shrink-0">
          {previewUrl ? (
            <div className="relative">
              <Image
                src={previewUrl}
                alt="Company logo"
                width={80}
                height={80}
                className="w-20 h-20 object-contain border border-gray-300 rounded-lg bg-white"
              />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Upload Area */}
        <div className="flex-1">
          <div
            onClick={handleClick}
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
              disabled
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled || isUploading}
            />
            
            {isUploading ? (
              <div className="space-y-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-sm text-gray-600">Uploading...</p>
              </div>
            ) : previewUrl ? (
              <div className="space-y-2">
                <Upload className="w-6 h-6 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-600">
                  Click to change logo
                </p>
                <p className="text-xs text-gray-500">
                  JPG, PNG, GIF up to 5MB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-6 h-6 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-600">
                  Click to upload logo
                </p>
                <p className="text-xs text-gray-500">
                  JPG, PNG, GIF up to 5MB
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Your logo will appear on quotes and invoices. Recommended size: 200x200 pixels or larger.
      </p>
    </div>
  )
} 