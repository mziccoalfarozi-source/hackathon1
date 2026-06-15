'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Toaster, toast } from 'sonner'
import {
  User, Heart, Thermometer, Wind, HeartPulse, Clock, Pill, AlertTriangle,
  ChevronRight, ChevronLeft, Send, RotateCcw, Check, Brain, CircleCheckBig, Search
} from 'lucide-react'
import type { PatientData, QueuePatient } from '@/types'
import { INITIAL_PATIENT_DATA, SYMPTOM_OPTIONS, MOCK_TRIAGE_RESULTS } from '@/data/mock'
import { useQueue } from '@/contexts/QueueContext'
import { usePatients } from '@/contexts/PatientContext'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { SlideUp } from '@/components/motion'

export default function InputPasien() {
  const router = useRouter()
  const { addPatient, patients } = useQueue()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [patient, setPatient] = useState<PatientData>({ ...INITIAL_PATIENT_DATA })
  const [showResult, setShowResult] = useState(false)
  const [lastAdded, setLastAdded] = useState<QueuePatient | null>(null)

  const totalSteps = 3

  const { searchPatients, addRegisteredPatient } = usePatients()
  const { register } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [mode, setMode] = useState<'search'|'add'>('search')
  const [newPatient, setNewPatient] = useState({
    name: '', dob: '', gender: 'L' as 'L'|'P', nik: '', bpjs: '', phone: '', address: '', email: '', password: ''
  })

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  const handleSelectPatient = (pt: any) => {
    setPatient(prev => ({
      ...prev,
      name: pt.name, age: pt.age, gender: pt.gender, nik: pt.nik || '', phone: pt.phone, address: pt.address
    }))
    setStep(2)
  }

  const handleSubmitNewPatient = () => {
    register(newPatient.name, newPatient.email, newPatient.password, 'pasien')
    const added = addRegisteredPatient({
      name: newPatient.name,
      dob: newPatient.dob,
      age: calculateAge(newPatient.dob),
      gender: newPatient.gender,
      nik: newPatient.nik,
      bpjs: newPatient.bpjs,
      phone: newPatient.phone,
      address: newPatient.address,
    })
    toast.success('Pasien baru berhasil didaftarkan dan akun dibuat!')
    setMode('search')
    setSearchQuery(added.name)
    setNewPatient({ name: '', dob: '', gender: 'L', nik: '', bpjs: '', phone: '', address: '', email: '', password: '' })
  }

  const updatePatient = (field: keyof PatientData, value: unknown) => {
    setPatient(prev => ({ ...prev, [field]: value }))
  }

  const updateVitalSign = (field: keyof PatientData['vitalSigns'], value: string | number) => {
    setPatient(prev => ({
      ...prev,
      vitalSigns: { ...prev.vitalSigns, [field]: value }
    }))
  }

  const toggleSymptom = (symptom: string) => {
    setPatient(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }))
  }

  const determinePriority = () => {
    const criticalSymptoms = ['nyeri_dada', 'kejang', 'sesak_napas']
    const highSymptoms = ['demam_tinggi', 'muntah', 'luka']
    
    const hasCritical = patient.symptoms.some(s => criticalSymptoms.includes(s))
    const hasHigh = patient.symptoms.some(s => highSymptoms.includes(s))
    const lowO2 = patient.vitalSigns.oxygenSaturation < 92
    const highTemp = patient.vitalSigns.temperature > 39
    const abnormalHR = patient.vitalSigns.heartRate > 120 || patient.vitalSigns.heartRate < 50

    if (hasCritical || lowO2 || abnormalHR) return '1' // CRITICAL
    if (hasHigh || highTemp) return '2' // HIGH
    if (patient.symptoms.length > 3) return '3' // MEDIUM
    return '4' // LOW
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    toast.loading('Menganalisis data pasien dengan AI...', { duration: 2000 })

    setTimeout(() => {
      const priorityId = determinePriority()
      const triageResult = MOCK_TRIAGE_RESULTS[priorityId]
      const queuePrefix = priorityId === '1' || priorityId === '2' ? 'A' : 'B'
      const queueNum = patients.filter(p => p.queueNumber.startsWith(queuePrefix)).length + 1

      const newPatient: QueuePatient = {
        ...patient,
        id: Date.now().toString(36),
        queueNumber: `${queuePrefix}-${String(queueNum).padStart(3, '0')}`,
        triageResult,
        timestamp: new Date(),
        status: 'WAITING',
      }

      addPatient(newPatient)
      setLastAdded(newPatient)
      setShowResult(true)
      setIsSubmitting(false)
      toast.success('Pasien berhasil didaftarkan dan masuk antrian!')
    }, 2000)
  }

  const handleNewPatient = () => {
    setPatient({ ...INITIAL_PATIENT_DATA })
    setStep(1)
    setMode('search')
    setSearchQuery('')
    setShowResult(false)
    setLastAdded(null)
  }

  const isStepValid = () => {
    switch (step) {
      case 1:
        if (mode === 'add') {
          return newPatient.name && newPatient.dob && newPatient.phone && newPatient.address && newPatient.email && newPatient.password
        }
        return false // Di mode pencarian, kita harus klik tombol pilih
      case 2:
        return patient.complaint && patient.symptoms.length > 0 && patient.duration
      case 3:
        return patient.vitalSigns.bloodPressure &&
          patient.vitalSigns.heartRate > 0 &&
          patient.vitalSigns.temperature > 0 &&
          patient.vitalSigns.oxygenSaturation > 0 &&
          patient.vitalSigns.respiratoryRate > 0
      default:
        return false
    }
  }

  const stepLabels = ['Data Pribadi', 'Keluhan & Gejala', 'Tanda Vital']

  if (showResult && lastAdded) {
    const cfg = lastAdded.triageResult.priority === 'CRITICAL'
      ? { bg: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50', text: 'text-red-700 dark:text-red-400', badge: 'bg-red-600' }
      : lastAdded.triageResult.priority === 'HIGH'
      ? { bg: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50', text: 'text-orange-700 dark:text-orange-400', badge: 'bg-orange-500' }
      : lastAdded.triageResult.priority === 'MEDIUM'
      ? { bg: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/50', text: 'text-yellow-700 dark:text-yellow-400', badge: 'bg-yellow-500' }
      : { bg: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50', text: 'text-green-700 dark:text-green-400', badge: 'bg-green-500' }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
        className="max-w-2xl mx-auto space-y-6"
      >
        <Toaster position="top-right" richColors />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-4"
          >
            <CircleCheckBig className="w-8 h-8 text-emerald-600" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground">Pasien Berhasil Didaftarkan</h1>
          <p className="text-sm text-muted-foreground mt-1">Data telah dianalisis oleh AI dan masuk ke antrian</p>
        </motion.div>

        <Card className={`border-2 ${cfg.bg}`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-16 h-16 rounded-2xl ${cfg.badge} flex items-center justify-center text-white text-lg font-bold`}>
                {lastAdded.queueNumber}
              </div>
              <div>
                <h2 className="text-lg font-bold text-card-foreground">{lastAdded.name}</h2>
                <p className="text-sm text-muted-foreground">{lastAdded.age} tahun · {lastAdded.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className={`p-3 rounded-xl ${cfg.bg}`}>
                <p className="text-xs text-muted-foreground mb-1">Prioritas</p>
                <p className={`font-bold ${cfg.text}`}>{lastAdded.triageResult.priorityLabel}</p>
              </div>
              <div className={`p-3 rounded-xl ${cfg.bg}`}>
                <p className="text-xs text-muted-foreground mb-1">Estimasi Tunggu</p>
                <p className="font-bold text-card-foreground">{lastAdded.triageResult.estimatedWaitTime}</p>
              </div>
            </div>

            <div className="bg-background rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-violet-600 dark:text-violet-500" />
                <span className="text-sm font-semibold text-foreground">AI Reasoning</span>
                <Badge className="bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 text-xs">
                  {(lastAdded.triageResult.confidence * 100).toFixed(0)}% confidence
                </Badge>
              </div>
              <ul className="space-y-1">
                {lastAdded.triageResult.reasoning.slice(0, 3).map((r, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={handleNewPatient} className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700">
            <User className="w-4 h-4" />
            Input Pasien Baru
          </Button>
          <Button variant="outline" onClick={() => router.push('/admin/antrian')} className="flex-1 gap-2">
            Lihat Antrian
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <SlideUp className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Input Pasien Baru</h1>
        <p className="text-sm text-muted-foreground">Masukkan data lengkap pasien untuk analisis AI triage</p>
      </SlideUp>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step > i + 1 ? 'bg-blue-600 text-white' :
                step === i + 1 ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-500' :
                'bg-muted text-muted-foreground'
              }`}>
                {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`hidden sm:inline text-sm font-medium ${
                step === i + 1 ? 'text-blue-700 dark:text-blue-400' : 'text-muted-foreground'
              }`}>{label}</span>
            </div>
          ))}
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-600 rounded-full"
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Step 1: Search or Add Patient */}
      <AnimatePresence mode="wait">
      {step === 1 && mode === 'search' && (
        <motion.div
          key="step-1-search"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-end mb-4">
            <Button onClick={() => setMode('add')} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <User className="w-4 h-4" /> Tambahkan Pasien Baru
            </Button>
          </div>
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-600" />
                Cari Pasien Terdaftar
              </CardTitle>
              <CardDescription>Cari pasien berdasarkan nama atau NIK</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Input 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                placeholder="Ketik nama atau NIK pasien..." 
                className="h-12 text-lg" 
              />
              <div className="space-y-3 mt-4">
                {searchQuery.trim() === '' ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">Masukkan kata kunci pencarian</p>
                ) : searchPatients(searchQuery).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">Tidak ada pasien yang cocok.</p>
                ) : (
                  searchPatients(searchQuery).map(pt => (
                    <div key={pt.id} className="flex items-center justify-between p-4 border border-border rounded-xl hover:border-blue-300 dark:hover:border-blue-800 transition-colors bg-card">
                      <div>
                        <h3 className="font-bold text-foreground">{pt.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {pt.age} thn · {pt.address}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {pt.nik && <Badge variant="outline" className="text-[10px]">NIK: {pt.nik}</Badge>}
                          {pt.bpjs && <Badge variant="outline" className="text-[10px]">BPJS: {pt.bpjs}</Badge>}
                          {pt.faskes && <Badge variant="secondary" className="text-[10px]">{pt.faskes}</Badge>}
                        </div>
                      </div>
                      <Button onClick={() => handleSelectPatient(pt)} variant="outline" className="gap-2 shrink-0 border-blue-200 hover:bg-blue-50 text-blue-600 dark:border-blue-900 dark:hover:bg-blue-900/30">
                        <Check className="w-4 h-4" /> Pilih
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {step === 1 && mode === 'add' && (
        <motion.div
          key="step-1-add"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-4">
            <Button onClick={() => setMode('search')} variant="ghost" className="gap-2">
              <ChevronLeft className="w-4 h-4" /> Kembali ke Pencarian
            </Button>
          </div>
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Registrasi Pasien Baru
              </CardTitle>
              <CardDescription>Daftarkan pasien ke database RS Misal dan buatkan akun login</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
                  <Input value={newPatient.name} onChange={e => setNewPatient({...newPatient, name: e.target.value})} placeholder="Nama pasien" />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Lahir <span className="text-red-500">*</span></Label>
                  <Input type="date" value={newPatient.dob} onChange={e => setNewPatient({...newPatient, dob: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Usia (Otomatis)</Label>
                  <Input disabled value={calculateAge(newPatient.dob) || ''} placeholder="Dihitung otomatis" className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Jenis Kelamin <span className="text-red-500">*</span></Label>
                  <Select value={newPatient.gender} onValueChange={v => setNewPatient({...newPatient, gender: v as 'L'|'P'})}>
                    <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Laki-laki</SelectItem>
                      <SelectItem value="P">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>NIK <span className="text-xs text-muted-foreground">(Opsional)</span></Label>
                  <Input value={newPatient.nik} onChange={e => setNewPatient({...newPatient, nik: e.target.value})} placeholder="KTP" />
                </div>
                <div className="space-y-2">
                  <Label>No. BPJS <span className="text-xs text-muted-foreground">(Opsional)</span></Label>
                  <Input value={newPatient.bpjs} onChange={e => setNewPatient({...newPatient, bpjs: e.target.value})} placeholder="BPJS" />
                </div>
                <div className="space-y-2">
                  <Label>No. Telepon <span className="text-red-500">*</span></Label>
                  <Input value={newPatient.phone} onChange={e => setNewPatient({...newPatient, phone: e.target.value})} placeholder="08xxx" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Alamat Lengkap <span className="text-red-500">*</span></Label>
                  <Textarea value={newPatient.address} onChange={e => setNewPatient({...newPatient, address: e.target.value})} placeholder="Alamat lengkap" rows={2} />
                </div>
              </div>
              
              <Separator className="my-6" />
              <h3 className="font-semibold text-sm mb-4">Informasi Akun Pasien (Untuk Login)</h3>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>Email <span className="text-red-500">*</span></Label>
                  <Input type="email" value={newPatient.email} onChange={e => setNewPatient({...newPatient, email: e.target.value})} placeholder="email@pasien.com" />
                </div>
                <div className="space-y-2">
                  <Label>Password Default <span className="text-red-500">*</span></Label>
                  <Input value={newPatient.password} onChange={e => setNewPatient({...newPatient, password: e.target.value})} placeholder="password123" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Step 2: Symptoms */}
      {step === 2 && (
        <motion.div
          key="step-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-blue-600" />
              Keluhan & Gejala
            </CardTitle>
            <CardDescription>Pilih gejala dan jelaskan keluhan utama pasien</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="complaint">Keluhan Utama <span className="text-red-500">*</span></Label>
              <Textarea id="complaint" value={patient.complaint} onChange={e => updatePatient('complaint', e.target.value)} placeholder="Jelaskan keluhan utama pasien secara detail..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Gejala <span className="text-red-500">*</span> <span className="text-xs text-slate-400 font-normal">(Pilih semua yang sesuai)</span></Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SYMPTOM_OPTIONS.map(sym => (
                  <button key={sym.value} type="button" onClick={() => toggleSymptom(sym.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm border transition-all text-left ${
                      patient.symptoms.includes(sym.value) ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-400' : 'bg-background border-input text-muted-foreground hover:border-accent'
                    }`}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      patient.symptoms.includes(sym.value) ? 'bg-blue-500 border-blue-500' : 'border-input'
                    }`}>
                      {patient.symptoms.includes(sym.value) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    {sym.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Durasi Keluhan <span className="text-red-500">*</span></Label>
              <Select value={patient.duration} onValueChange={v => updatePatient('duration', v)}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Pilih durasi" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="< 1 jam">Kurang dari 1 jam</SelectItem>
                  <SelectItem value="1-6 jam">1 - 6 jam</SelectItem>
                  <SelectItem value="6-24 jam">6 - 24 jam</SelectItem>
                  <SelectItem value="1-3 hari">1 - 3 hari</SelectItem>
                  <SelectItem value="3-7 hari">3 - 7 hari</SelectItem>
                  <SelectItem value="> 2 minggu">Lebih dari 2 minggu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="allergies" className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" />Riwayat Alergi</Label>
                <Textarea id="allergies" value={patient.allergies} onChange={e => updatePatient('allergies', e.target.value)} placeholder="Alergi obat, makanan, dll" rows={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medications" className="flex items-center gap-1.5"><Pill className="w-3.5 h-3.5 text-blue-500" />Riwayat Pengobatan</Label>
                <Textarea id="medications" value={patient.medications} onChange={e => updatePatient('medications', e.target.value)} placeholder="Obat yang dikonsumsi" rows={2} />
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>
      )}

      {/* Step 3: Vital Signs */}
      {step === 3 && (
        <motion.div
          key="step-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              Tanda Vital
            </CardTitle>
            <CardDescription>Masukkan pengukuran tanda vital pasien</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label htmlFor="bp" className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-rose-500" />Tekanan Darah <span className="text-red-500">*</span></Label>
                <Input id="bp" value={patient.vitalSigns.bloodPressure} onChange={e => updateVitalSign('bloodPressure', e.target.value)} placeholder="120/80" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hr" className="flex items-center gap-1.5"><HeartPulse className="w-3.5 h-3.5 text-red-500" />Denyut Jantung (bpm) <span className="text-red-500">*</span></Label>
                <Input id="hr" type="number" value={patient.vitalSigns.heartRate || ''} onChange={e => updateVitalSign('heartRate', parseInt(e.target.value) || 0)} placeholder="72" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temp" className="flex items-center gap-1.5"><Thermometer className="w-3.5 h-3.5 text-orange-500" />Suhu (°C) <span className="text-red-500">*</span></Label>
                <Input id="temp" type="number" step="0.1" value={patient.vitalSigns.temperature || ''} onChange={e => updateVitalSign('temperature', parseFloat(e.target.value) || 0)} placeholder="36.5" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spo2" className="flex items-center gap-1.5"><Wind className="w-3.5 h-3.5 text-blue-500" />SpO2 (%) <span className="text-red-500">*</span></Label>
                <Input id="spo2" type="number" value={patient.vitalSigns.oxygenSaturation || ''} onChange={e => updateVitalSign('oxygenSaturation', parseInt(e.target.value) || 0)} placeholder="98" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rr" className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-cyan-500" />Frek. Napas (/menit) <span className="text-red-500">*</span></Label>
                <Input id="rr" type="number" value={patient.vitalSigns.respiratoryRate || ''} onChange={e => updateVitalSign('respiratoryRate', parseInt(e.target.value) || 0)} placeholder="18" className="h-11" />
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : router.push('/admin')} className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          {step > 1 ? 'Sebelumnya' : 'Kembali'}
        </Button>
        <div className="flex items-center gap-3">
          {step === 3 && (
            <Button variant="outline" onClick={() => setPatient({ ...INITIAL_PATIENT_DATA })} className="gap-2">
              <RotateCcw className="w-4 h-4" />Reset
            </Button>
          )}
          {step < totalSteps && step !== 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!isStepValid()} className="gap-2 bg-blue-600 hover:bg-blue-700">
              Lanjutkan<ChevronRight className="w-4 h-4" />
            </Button>
          ) : step === 1 ? (
            mode === 'add' && (
              <Button onClick={handleSubmitNewPatient} disabled={!isStepValid()} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                Simpan Pasien Baru<Check className="w-4 h-4" />
              </Button>
            )
          ) : (
            <Button onClick={handleSubmit} disabled={!isStepValid() || isSubmitting} className="gap-2 bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menganalisis...</>
              ) : (
                <><Send className="w-4 h-4" />Analisis & Daftarkan</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
