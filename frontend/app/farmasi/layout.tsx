'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import FarmasiLayout from '@/layouts/FarmasiLayout'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRole="farmasi">
      <FarmasiLayout>
        {children}
      </FarmasiLayout>
    </ProtectedRoute>
  )
}
