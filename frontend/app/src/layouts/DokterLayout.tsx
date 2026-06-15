import DashboardLayout from './DashboardLayout'
import { LayoutDashboard, ClipboardList, History } from 'lucide-react'

const dokterNavItems = [
  { path: '/dokter', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/dokter/antrian', label: 'Antrian Pasien', icon: ClipboardList },
  { path: '/dokter/riwayat', label: 'Riwayat Pasien', icon: History },
]

export default function DokterLayout() {
  return (
    <DashboardLayout
      role="dokter"
      navItems={dokterNavItems}
      accentColor="text-emerald-700"
      accentBg="bg-emerald-50"
      accentGradient="from-emerald-500 to-teal-600"
    />
  )
}
