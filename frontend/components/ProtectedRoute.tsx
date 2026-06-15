'use client'

import { useAuth, getRoleDashboardPath } from '@/contexts/AuthContext'
import type { UserRole } from '@/types'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { FullPageLoader } from '@/components/skeletons'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRole: UserRole
}

export default function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login')
      } else if (user.role !== allowedRole) {
        router.replace(getRoleDashboardPath(user.role))
      }
    }
  }, [user, isLoading, allowedRole, router])

  if (isLoading) {
    return <FullPageLoader />
  }

  if (!user || user.role !== allowedRole) {
    return <FullPageLoader />
  }

  return <>{children}</>
}
