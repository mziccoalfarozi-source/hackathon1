'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import AdminLayout from '@/layouts/AdminLayout'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRole="admin">
      <AdminLayout>
        {children}
      </AdminLayout>
    </ProtectedRoute>
  )
}
