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

  return (
    <motion.button
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative w-9 h-9 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden cursor-pointer"
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
