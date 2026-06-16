import DashboardLayout from './DashboardLayout'
import { LayoutGrid, UserRoundPlus, ListOrdered, FileSearch, UserCheck } from 'lucide-react'

const adminNavItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutGrid },
  { path: '/admin/input-pasien', label: 'Input Pasien', icon: UserRoundPlus },
  { path: '/admin/verifikasi-registrasi', label: 'Verifikasi Akun', icon: UserCheck },
  { path: '/admin/antrian', label: 'Antrian', icon: ListOrdered },
  { path: '/admin/audit', label: 'Audit Trail', icon: FileSearch },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout
      role="admin"
      navItems={adminNavItems}
      accentColor="text-blue-700"
      accentBg="bg-blue-50"
      accentGradient="from-blue-500 to-indigo-600"
    >
      {children}
    </DashboardLayout>
  )
}
