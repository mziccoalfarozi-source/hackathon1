'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SlideUp, StaggerContainer, StaggerItem } from '@/components/motion'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserCircle2, Activity, Clock, ShieldCheck,
  QrCode, Pill, History, AlertCircle, FileText, MapPin, Search, Lock, KeyRound
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function PasienDashboard() {
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue')
  const { user, changePassword } = useAuth()
  
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast.error('Password dan konfirmasi password tidak sama')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }
    if (!user?.id) {
      toast.error('User tidak ditemukan')
      return
    }

    const res = changePassword(user.id, newPassword)
    if (res.success) {
      toast.success('Password berhasil diubah!')
      setIsPasswordModalOpen(false)
      setNewPassword('')
      setConfirmPassword('')
    } else {
      toast.error(res.error || 'Gagal mengubah password')
    }
  }

  // Data Dummy Pasien (seolah-olah diambil dari context/API)
  const patientData = {
    name: 'Budi Santoso',
    age: 45,
    bloodType: 'O+',
    nik: '3201234567890001',
    bpjs: '0001234567890',
    faskes: 'Tingkat 1 - Klinik Sehat Bersama',
    address: 'Jl. Merdeka No. 45, RT 01/RW 02, Jakarta Selatan'
  }

  // Data Dummy Antrian Aktif
  const activeQueue = {
    queueNumber: 'B-012',
    priority: 'Sedang' as const,
    status: 'Menunggu Dokter', // Menunggu Dokter -> Sedang Diperiksa -> Menunggu Obat -> Selesai
    eta: '15 Menit',
    currentServing: 'B-010',
    aiReasoning: 'Berdasarkan keluhan (Demam 3 hari), sistem AI kami menempatkan Anda di antrian Reguler. Pasien gawat darurat mungkin akan diprioritaskan.'
  }

  // Data Dummy Riwayat Obat
  const pharmacyStatus = {
    status: 'PROCESSING' as 'PENDING' | 'PROCESSING' | 'COMPLETED',
    prescriptions: [
      { name: 'Paracetamol', dosage: '500mg', rules: '3x sehari' },
      { name: 'Amoxicillin', dosage: '500mg', rules: '3x sehari (Habiskan)' }
    ]
  }

  // Data Dummy Riwayat Kunjungan
  const history = [
    {
      id: 'RX-2026-05',
      date: '12 Mei 2026',
      doctor: 'dr. Ahmad Fauzi, Sp.PD',
      diagnosis: 'Tifus (Typhoid Fever)',
      txHash: '0xabc123...def456'
    },
    {
      id: 'RX-2025-11',
      date: '03 Nov 2025',
      doctor: 'dr. Siti Aminah, Sp.OG',
      diagnosis: 'Medical Checkup Rutin',
      txHash: '0x789xyz...012abc'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome & Profile Summary */}
      <SlideUp>
        <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white overflow-hidden relative border-none shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <CardContent className="p-6 md:p-8 relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner border border-white/30">
                  <UserCircle2 className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Halo, {user?.name || patientData.name}!</h1>
                  <p className="text-blue-100 font-medium mt-1 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    {patientData.age} Tahun · Gol. Darah {patientData.bloodType}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 md:mt-0">
                <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                  <DialogTrigger asChild>
                    <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 flex items-center gap-3 shadow-sm hover:bg-white/20 transition-colors cursor-pointer group">
                      <div className="bg-white/20 p-1.5 rounded-lg group-hover:bg-white/30 transition-colors">
                        <KeyRound className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-sm text-left">
                        <p className="font-semibold text-white group-hover:text-cyan-100 transition-colors">Ganti Password</p>
                        <p className="text-blue-200 text-xs">Akun Anda</p>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-blue-600" />
                        Ganti Password
                      </DialogTitle>
                      <DialogDescription>
                        Masukkan password baru untuk akun Anda.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">Password Baru</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimal 6 karakter"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Konfirmasi Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Ketik ulang password baru"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)}>Batal</Button>
                      <Button onClick={handlePasswordChange} className="bg-blue-600 hover:bg-blue-700">Simpan Password</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 flex items-center gap-3 shadow-sm hover:bg-white/20 transition-colors cursor-pointer group">
                  <div className="bg-white p-1.5 rounded-lg">
                    <QrCode className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                  </div>
                  <div className="text-sm text-left">
                    <p className="font-semibold text-white group-hover:text-cyan-100 transition-colors">Tunjukkan QR</p>
                    <p className="text-blue-200 text-xs">Untuk Check-in</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </SlideUp>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Live Queue Tracker */}
          <SlideUp delay={0.1}>
            <Card className="border-blue-100 dark:border-blue-900/50 shadow-md">
              <CardHeader className="pb-3 border-b border-border bg-blue-50/50 dark:bg-blue-950/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 text-blue-900 dark:text-blue-100">
                    <Clock className="w-5 h-5 text-blue-500" />
                    Status Layanan Hari Ini
                  </CardTitle>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300">Live</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-8 items-center justify-between mb-8">
                  <div className="text-center md:text-left">
                    <p className="text-sm text-muted-foreground font-medium mb-1">Nomor Antrian Anda</p>
                    <div className="text-5xl font-bold text-foreground tracking-tight">{activeQueue.queueNumber}</div>
                    <div className="mt-3 flex items-center justify-center md:justify-start gap-2">
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        Prioritas: {activeQueue.priority}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex-1 w-full bg-blue-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50 text-center relative overflow-hidden">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"
                    />
                    <p className="text-sm text-muted-foreground mb-1">Sedang Dilayani</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">{activeQueue.currentServing}</p>
                    <p className="text-sm font-medium text-foreground">
                      Estimasi Giliran: <span className="text-emerald-600 dark:text-emerald-400">{activeQueue.eta}</span>
                    </p>
                  </div>
                </div>

                {/* AI Transparency Alert */}
                <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-3 text-sm text-muted-foreground">
                  <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p>{activeQueue.aiReasoning}</p>
                </div>
              </CardContent>
            </Card>
          </SlideUp>

          {/* Pharmacy Status */}
          <SlideUp delay={0.2}>
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Pill className="w-5 h-5 text-violet-500" />
                  Status E-Resep & Obat
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin" /> {/* We'll use local animation or icon */}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">Sedang Disiapkan Farmasi</h3>
                    <p className="text-sm text-muted-foreground">Obat Anda sedang diracik. Kami akan memberi tahu jika sudah siap.</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {pharmacyStatus.prescriptions.map((rx, i) => (
                    <div key={i} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-md flex items-center justify-center text-xs font-bold">
                          {i+1}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{rx.name}</p>
                          <p className="text-xs text-muted-foreground">{rx.dosage}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-background">{rx.rules}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </SlideUp>
        </div>

        <div className="space-y-6">
          {/* Data Pribadi (Side Panel) */}
          <SlideUp delay={0.3}>
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-500" />
                  Data Administrasi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1 text-xs font-medium">Nomor Induk Kependudukan (NIK)</p>
                  <p className="font-semibold text-foreground">{patientData.nik}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs font-medium">Nomor Kartu BPJS</p>
                  <p className="font-semibold text-foreground">{patientData.bpjs}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs font-medium">Asal Faskes</p>
                  <p className="font-medium text-foreground">{patientData.faskes}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Alamat Domisili
                  </p>
                  <p className="text-foreground leading-relaxed">{patientData.address}</p>
                </div>
              </CardContent>
            </Card>
          </SlideUp>

          {/* Blockchain History */}
          <SlideUp delay={0.4}>
            <Card className="shadow-sm border-border bg-gradient-to-b from-card to-slate-50 dark:to-slate-900/20">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  Riwayat Medis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {history.map((record, i) => (
                  <div key={i} className="group relative border border-border bg-card p-4 rounded-xl hover:border-emerald-200 dark:hover:border-emerald-900/50 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-muted-foreground">
                        {record.date}
                      </Badge>
                      <ShieldCheck className="w-4 h-4 text-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h4 className="font-semibold text-sm text-foreground mb-1">{record.diagnosis}</h4>
                    <p className="text-xs text-muted-foreground mb-3">{record.doctor}</p>
                    <a href="#" className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded transition-colors">
                      <Search className="w-3 h-3" />
                      Tx: {record.txHash}
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>
          </SlideUp>
        </div>
      </div>
    </div>
  )
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
