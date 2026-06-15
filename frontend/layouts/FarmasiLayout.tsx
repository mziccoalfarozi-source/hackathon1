import DashboardLayout from './DashboardLayout'
import { LayoutGrid, ClockArrowUp } from 'lucide-react'

const farmasiNavItems = [
  { path: '/farmasi', label: 'Dashboard', icon: LayoutGrid },
  { path: '/farmasi/riwayat', label: 'Riwayat', icon: ClockArrowUp },
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
