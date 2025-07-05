// src/app/clients/layout.tsx
import AuthGuard from '@/components/layout/AuthGuard'
import Navbar from '@/components/layout/Navbar'

export default function ClientsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
} 