'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth, getRoleLabel } from '@/contexts/AuthContext'
import type { UserRole } from '@/types'
import {
  HeartPulse, LogOut, Menu, X,
  type LucideIcon
} from 'lucide-react'
import Image from 'next/image'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const isActive = (path: string) => {
    if (path === `/${role}`) return pathname === path
    return pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-300">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/60 backdrop-blur-lg transition-colors duration-300 shadow-sm dark:shadow-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Left: Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href={`/${role}`} className="flex items-center gap-2.5 group">
                <motion.div
                  whileHover={{ scale: 1.08, rotate: 2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative w-9 h-9 rounded-xl overflow-hidden shadow-md flex-shrink-0`}
                >
                  <Image src="/Logo.png" alt="Logo Vitas" fill sizes="36px" className="object-cover" />
                </motion.div>
                <div className="flex flex-col hidden sm:flex">
                  <span className="text-sm font-bold text-foreground leading-tight">Vitas</span>
                  <span className={`text-[10px] font-semibold leading-tight ${accentColor}`}>{getRoleLabel(role)}</span>
                </div>
              </Link>
            </div>

            {/* Center: Desktop Navigation */}
            <nav className="hidden md:flex flex-1 justify-center items-center space-x-2 px-8 h-full">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 relative group ${active
                        ? `${accentBg} ${accentColor} shadow-sm dark:bg-white/10 dark:shadow-none`
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                  >
                    <Icon className={`w-4 h-4 transition-transform ${active ? '' : 'group-hover:scale-110'}`} />
                    <span>{item.label}</span>
                    {active && (
                      <motion.div
                        layoutId="topbar-indicator"
                        className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-1/2 h-1 rounded-t-full bg-gradient-to-r ${accentGradient}`}
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Right: User, Theme, Logout */}
            <div className="hidden md:flex items-center gap-4">
              <ThemeToggle />

              <div className="h-6 w-px bg-border" /> {/* Divider */}

              <div className="flex items-center gap-3">
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-medium text-foreground leading-tight">{user?.name}</p>
                  <p className="text-[10px] text-muted-foreground">{user?.email}</p>
                </div>
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarFallback className={`text-xs font-bold ${accentBg} ${accentColor} dark:bg-white/10`}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="p-2 rounded-xl text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                title="Keluar"
              >
                <LogOut className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Mobile Menu Button & ThemeToggle */}
            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border bg-card overflow-hidden"
            >
              <div className="px-4 py-3 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.path)
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${active
                          ? `${accentBg} ${accentColor} dark:bg-white/10`
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
              <div className="px-4 py-4 border-t border-border">
                <div className="flex items-center gap-3 px-3 mb-4">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarFallback className={`text-xs font-bold ${accentBg} ${accentColor} dark:bg-white/10`}>
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <PageTransition key={pathname}>
          {children}
        </PageTransition>
      </main>
    </div>
  )
}
