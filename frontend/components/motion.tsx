'use client'

import { motion, type HTMLMotionProps, AnimatePresence } from 'framer-motion'
import { type ReactNode } from 'react'

// ─── Fade In ───────────────────────────────────────────────
export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  className,
  ...props
}: {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
} & Omit<HTMLMotionProps<'div'>, 'children'>) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ─── Slide Up ──────────────────────────────────────────────
export function SlideUp({
  children,
  delay = 0,
  duration = 0.5,
  y = 24,
  className,
  ...props
}: {
  children: ReactNode
  delay?: number
  duration?: number
  y?: number
  className?: string
} & Omit<HTMLMotionProps<'div'>, 'children'>) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y }}
      transition={{ duration, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ─── Scale In ──────────────────────────────────────────────
export function ScaleIn({
  children,
  delay = 0,
  duration = 0.4,
  className,
}: {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Stagger Container ────────────────────────────────────
export function StaggerContainer({
  children,
  staggerDelay = 0.08,
  initialDelay = 0.1,
  className,
}: {
  children: ReactNode
  staggerDelay?: number
  initialDelay?: number
  className?: string
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: initialDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Stagger Item ──────────────────────────────────────────
export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: [0.25, 0.4, 0.25, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Page Transition ───────────────────────────────────────
export function PageTransition({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Animated Card (hover lift) ────────────────────────────
export function AnimatedCard({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.25, 0.4, 0.25, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Pulse Dot ─────────────────────────────────────────────
export function PulseDot({ className }: { className?: string }) {
  return (
    <motion.div
      className={className}
      animate={{
        scale: [1, 1.5, 1],
        opacity: [1, 0.5, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

// Re-export for convenience
export { motion, AnimatePresence }
