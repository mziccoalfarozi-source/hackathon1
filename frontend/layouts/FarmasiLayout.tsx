import DashboardLayout from './DashboardLayout'
import { LayoutDashboard, History } from 'lucide-react'

const farmasiNavItems = [
  { path: '/farmasi', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/farmasi/riwayat', label: 'Riwayat', icon: History },
]

export default function FarmasiLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout
      role="farmasi"
      navItems={farmasiNavItems}
      accentColor="text-violet-700"
      accentBg="bg-violet-50"
      accentGradient="from-violet-500 to-purple-600"
    >
      {children}
    </DashboardLayout>
  )
}
