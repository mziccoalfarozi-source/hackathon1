'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { Menu, X, LogOut, LayoutDashboard } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useAuth, getRoleDashboardPath } from '@/contexts/AuthContext'

export default function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { user, logout } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Don't render on dashboard pages
  const dashboardRoutes = ['/admin', '/dokter', '/farmasi', '/pasien']
  if (dashboardRoutes.some(route => pathname.startsWith(route))) {
    return null
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-transparent border-transparent backdrop-blur-sm shadow-sm' 
        : 'bg-background/95 backdrop-blur-md border-b border-border shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" onClick={(e) => {
            if (pathname === '/') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }} className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-emerald-500/20 flex-shrink-0"
            >
              <Image src="/Logo.png" alt="Logo Vitas" fill sizes="40px" className="object-cover" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-foreground leading-tight tracking-tight">Vitas</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight font-medium">Rumah Sakit Terpercaya</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href={getRoleDashboardPath(user.role)}
                    className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl transition-all"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => logout()}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 rounded-xl transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </motion.button>
              </>
            ) : (
              <>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/login"
                    className="px-5 py-2 text-sm font-medium text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl transition-all"
                  >
                    Masuk
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/register"
                    className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl transition-all shadow-md shadow-emerald-500/25"
                  >
                    Daftar Akun
                  </Link>
                </motion.div>
              </>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-accent"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden overflow-hidden"
            >
              <div className="pb-4 pt-2 border-t border-border flex flex-col gap-2">
                <div className="px-4 py-2"><ThemeToggle /></div>
                {user ? (
                  <>
                    <Link href={getRoleDashboardPath(user.role)} onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent rounded-lg">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <button onClick={() => { logout(); setMobileMenuOpen(false); }}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg w-full">
                      <LogOut className="w-4 h-4" />
                      Keluar
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent rounded-lg">
                      Masuk
                    </Link>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg text-center font-semibold">
                      Daftar Akun
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}
