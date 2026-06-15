'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import DokterLayout from '@/layouts/DokterLayout'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRole="dokter">
      <DokterLayout>
        {children}
      </DokterLayout>
    </ProtectedRoute>
  )
}
