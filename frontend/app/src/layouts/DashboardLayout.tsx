import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth, getRoleLabel } from '@/contexts/AuthContext'
import type { UserRole } from '@/types'
import {
  Activity, LogOut, Menu, X, ChevronLeft,
  type LucideIcon
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface NavItem {
  path: string
  label: string
  icon: LucideIcon
}

interface DashboardLayoutProps {
  role: UserRole
  navItems: NavItem[]
  accentColor: string
  accentBg: string
  accentGradient: string
}

export default function DashboardLayout({ role, navItems, accentColor, accentBg, accentGradient }: DashboardLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path: string) => {
    if (path === `/${role}`) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <Link to={`/${role}`} className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${accentGradient} flex items-center justify-center shadow-md`}>
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 leading-tight">RS Misal</span>
              <span className={`text-[10px] font-semibold leading-tight ${accentColor}`}>{getRoleLabel(role)}</span>
            </div>
          </Link>
          <button
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? `${accentBg} ${accentColor}`
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 mb-3">
            <Avatar className="h-9 w-9 border border-slate-200">
              <AvatarFallback className={`text-xs font-bold ${accentBg} ${accentColor}`}>
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="sticky top-0 z-30 h-14 bg-white/90 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${accentGradient} flex items-center justify-center`}>
              <Activity className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">RS Misal</span>
          </div>
          <div className="w-9" /> {/* Spacer */}
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
