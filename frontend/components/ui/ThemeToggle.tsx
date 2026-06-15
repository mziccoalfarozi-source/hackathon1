'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100/50" />
    )
  }

  const isDark = theme === 'dark'

  const toggleTheme = (e: React.MouseEvent) => {
    const newTheme = isDark ? 'light' : 'dark'
    
    // Fallback jika browser tidak mendukung View Transitions API
    if (!document.startViewTransition) {
      setTheme(newTheme)
      return
    }

    // Hitung posisi kursor saat di-klik untuk titik mula animasi
    const x = e.clientX
    const y = e.clientY
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    const transition = document.startViewTransition(() => {
      setTheme(newTheme)
    })

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ]
      
      document.documentElement.animate(
        {
          clipPath: isDark ? [...clipPath].reverse() : clipPath,
        },
        {
          duration: 600,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: isDark
            ? '::view-transition-old(root)'
            : '::view-transition-new(root)',
        }
      )
    })
  }

  return (
    <motion.button
      aria-label="Toggle theme"
      onClick={toggleTheme}
      className="relative w-9 h-9 rounded-full flex items-center justify-center bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 shadow-sm overflow-hidden cursor-pointer"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92, rotate: 15 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Glow layer */}
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="glow-dark"
            className="absolute inset-0 rounded-full bg-cyan-400/10"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.25 }}
          />
        ) : (
          <motion.span
            key="glow-light"
            className="absolute inset-0 rounded-full bg-amber-300/10"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.25 }}
          />
        )}
      </AnimatePresence>

      {/* Icon */}
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="flex items-center justify-center text-cyan-400"
          >
            <Moon className="h-4 w-4" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="flex items-center justify-center text-amber-500"
          >
            <Sun className="h-4 w-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
