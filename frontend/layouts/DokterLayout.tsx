import DashboardLayout from './DashboardLayout'
import { LayoutGrid, Stethoscope, ClockArrowUp } from 'lucide-react'

const dokterNavItems = [
  { path: '/dokter', label: 'Dashboard', icon: LayoutGrid },
  { path: '/dokter/antrian', label: 'Antrian Pasien', icon: Stethoscope },
  { path: '/dokter/riwayat', label: 'Riwayat Pasien', icon: ClockArrowUp },
]

export default function DokterLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout
      role="dokter"
      navItems={dokterNavItems}
      accentColor="text-emerald-700"
      accentBg="bg-emerald-50"
      accentGradient="from-emerald-500 to-teal-600"
    >
      {children}
    </DashboardLayout>
  )
}
