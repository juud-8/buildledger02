// Optimized header component with centralized icons and performance improvements
'use client'

import { memo } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { HardHat, Moon, Sun } from '@/lib/icons'

interface OptimizedHeaderProps {
  className?: string
}

// Memoize the component to prevent unnecessary re-renders
const OptimizedHeader = memo(function OptimizedHeader({ className }: OptimizedHeaderProps) {
  const { theme, setTheme } = useTheme()

  return (
    <header className={`sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Optimized with next/link for performance */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <HardHat className="w-6 h-6 text-yellow-500" />
            BuildLedger
          </Link>

          {/* Navigation - Only render on larger screens to reduce mobile bundle */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/auth/login" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              Login
            </Link>
          </nav>

          {/* Theme Toggle - Optimized with proper accessibility */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
})

export default OptimizedHeader