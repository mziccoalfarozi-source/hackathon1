'use client'

import Link from 'next/link'
import { Home, ArrowLeft, HeartPulse, Search, MapPinOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-[10%] w-72 h-72 bg-emerald-400/8 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-20 right-[10%] w-96 h-96 bg-teal-400/8 rounded-full blur-[120px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-400/5 rounded-full blur-[80px]"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Floating grid lines */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <div className="relative text-center max-w-lg">
        {/* Animated Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
          className="relative mx-auto mb-8 w-32 h-32"
        >
          {/* Outer ring */}
          <motion.div
            className="absolute inset-0 rounded-3xl border-2 border-emerald-400/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />
          {/* Inner ring */}
          <motion.div
            className="absolute inset-3 rounded-2xl border border-teal-400/15"
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          />
          {/* Icon center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 backdrop-blur-sm border border-white/10 flex items-center justify-center">
              <MapPinOff className="w-9 h-9 text-emerald-400/80" />
            </div>
          </div>
        </motion.div>

        {/* 404 Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1 className="text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white/90 to-white/20 mb-2 leading-none tracking-tighter">
            404
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
            Halaman Tidak Ditemukan
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-8 leading-relaxed max-w-sm mx-auto">
            Maaf, halaman yang Anda cari tidak ada atau mungkin telah dipindahkan.
            Pastikan URL yang Anda masukkan sudah benar.
          </p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link href="/">
            <Button className="gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 px-6 h-11 rounded-xl font-semibold">
              <Home className="w-4 h-4" />
              Kembali ke Beranda
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="gap-2 border-white/15 text-slate-300 hover:bg-white/10 hover:text-white px-6 h-11 rounded-xl bg-white/5 backdrop-blur-sm">
              <ArrowLeft className="w-4 h-4" />
              Halaman Login
            </Button>
          </Link>
        </motion.div>

        {/* Bottom brand */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-16 flex items-center justify-center gap-2"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
            <HeartPulse className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">Vitas Rumah Sakit Terpercaya</span>
        </motion.div>
      </div>
    </div>
  )
}
