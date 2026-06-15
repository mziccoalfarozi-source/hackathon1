'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth, getRoleLabel } from '@/contexts/AuthContext'
import type { UserRole } from '@/types'
import {
  HeartPulse, LogOut, Menu, X, ChevronRight,
  type LucideIcon
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { motion, AnimatePresence } from 'framer-motion'
import { PageTransition } from '@/components/motion'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

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
  children: React.ReactNode
}

export default function DashboardLayout({ role, navItems, accentColor, accentBg, accentGradient, children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const isActive = (path: string) => {
    if (path === `/${role}`) return pathname === path
    return pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen w-64
        bg-white dark:bg-slate-900
        border-r border-slate-200 dark:border-slate-800
        flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>

        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800">
          <Link href={`/${role}`} className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${accentGradient} flex items-center justify-center shadow-md`}
            >
              <HeartPulse className="w-5 h-5 text-white" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">RS Misal</span>
              <span className={`text-[10px] font-semibold leading-tight ${accentColor}`}>{getRoleLabel(role)}</span>
            </div>
          </Link>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item, index) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link
                  href={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                    active
                      ? `${accentBg} ${accentColor} shadow-sm dark:bg-white/10 dark:shadow-none`
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-gradient-to-b ${accentGradient}`}
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-[18px] h-[18px] transition-transform ${active ? '' : 'group-hover:scale-110'}`} />
                  <span className="flex-1">{item.label}</span>
                  {active && (
                    <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                  )}
                </Link>
              </motion.div>
            )
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 px-2 mb-3">
            <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-700">
              <AvatarFallback className={`text-xs font-bold ${accentBg} ${accentColor} dark:bg-white/10`}>
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </motion.button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14
          bg-white/90 dark:bg-slate-900/90
          backdrop-blur-sm
          border-b border-slate-200 dark:border-slate-800
          flex items-center justify-between px-4 transition-colors duration-300">

          {/* Left: hamburger (mobile) */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </motion.button>

          {/* Center: logo (mobile only) */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${accentGradient} flex items-center justify-center`}>
              <HeartPulse className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">RS Misal</span>
          </div>

          {/* Right: ThemeToggle always visible */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        {/* Page content with transition */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <PageTransition key={pathname}>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  )
}
