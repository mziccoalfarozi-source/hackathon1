'use client'

import DashboardLayout from '@/layouts/DashboardLayout'
import { Home } from 'lucide-react'

export default function PasienLayout({ children }: { children: React.ReactNode }) {
  const navItems = [
    { path: '/pasien', label: 'Dashboard', icon: Home },
  ]

  return (
    <DashboardLayout
      role="pasien"
      navItems={navItems}
      accentColor="text-blue-500 dark:text-blue-400"
      accentBg="bg-blue-50"
      accentGradient="from-blue-500 to-cyan-500"
    >
      {children}
    </DashboardLayout>
  )
}
