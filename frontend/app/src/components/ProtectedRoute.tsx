import { Navigate } from 'react-router'
import { useAuth, getRoleDashboardPath } from '@/contexts/AuthContext'
import type { UserRole } from '@/types'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRole: UserRole
}

export default function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== allowedRole) {
    return <Navigate to={getRoleDashboardPath(user.role)} replace />
  }

  return <>{children}</>
}
