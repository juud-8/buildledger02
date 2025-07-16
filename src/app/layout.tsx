// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Optimize font loading with display swap and preload
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
})

export const metadata: Metadata = {
  title: 'BuildLedger - Invoice & Quote Management for Trades',
  description: 'Professional invoicing and quoting software designed specifically for tradespeople and general contractors.',
  // Performance optimizations
  robots: 'index, follow',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
  // App icons and manifest
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/buildledger-icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  // Preload critical resources
  other: {
    'preload': '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        {/* Preload critical fonts */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect" 
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//supabase.co" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}