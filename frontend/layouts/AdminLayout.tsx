import DashboardLayout from './DashboardLayout'
import { LayoutDashboard, UserPlus, ClipboardList, ShieldCheck } from 'lucide-react'

const adminNavItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/input-pasien', label: 'Input Pasien', icon: UserPlus },
  { path: '/admin/antrian', label: 'Antrian', icon: ClipboardList },
  { path: '/admin/audit', label: 'Audit Trail', icon: ShieldCheck },
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
