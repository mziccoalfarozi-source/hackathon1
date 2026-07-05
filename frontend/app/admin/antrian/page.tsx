'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ClipboardList, CircleCheckBig, Clock3,
  Stethoscope, Filter, UserPlus, Link2, ChevronRight, Activity, Brain, Check,
  AlertTriangle, Save
} from 'lucide-react'
import { useQueue } from '@/contexts/QueueContext'
import { useAuth } from '@/contexts/AuthContext'
import { ESI_CONFIG } from '@/data/mock'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { QueuePatient, EsiLevel } from '@/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

type StatusFilter = 'ALL' | 'WAITING' | 'IN_PROGRESS' | 'COMPLETED'
type PriorityFilter = 'ALL' | 1 | 2 | 3 | 4 | 5

const calculateAge = (dob: string) => {
  if (!dob) return '';
  const diff = Date.now() - new Date(dob).getTime();
  const age = new Date(diff);
  return Math.abs(age.getUTCFullYear() - 1970) + ' Tahun';
};

export default function AntrianAdmin() {
  const { patients, updatePatientIdentity } = useQueue()
  const { register } = useAuth()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL')
  const [selectedPatient, setSelectedPatient] = useState<QueuePatient | null>(null)
  
  // Draft edit state
  const [isEditingDraft, setIsEditingDraft] = useState(false)
  const [draftData, setDraftData] = useState({
    name: '',
    gender: 'L' as 'L'|'P',
    dob: '',
    phone: '',
    address: '',
    nik: '',
    bpjs_number: '',
    email: '',
    password: ''
  })
  const [isSubmittingDraft, setIsSubmittingDraft] = useState(false)

  const handleSaveDraft = async () => {
    if (!selectedPatient || !selectedPatient.patientId) return
    setIsSubmittingDraft(true)
    try {
      let userId: string | undefined = undefined;
      if (draftData.email && draftData.password) {
        const res = await register(draftData.name, draftData.email, draftData.password, 'pasien');
        if (!res.success) {
          alert(res.error || 'Gagal membuat akun');
          setIsSubmittingDraft(false);
          return;
        }
        userId = res.userId;
      }
      
      await updatePatientIdentity(selectedPatient.id, selectedPatient.patientId, {
        name: draftData.name,
        gender: draftData.gender,
        date_of_birth: draftData.dob || undefined,
        nik: draftData.nik || undefined,
        bpjs_number: draftData.bpjs_number || undefined,
        phone: draftData.phone,
        address: draftData.address,
        user_id: userId
      })
      // Update local selected state to remove banner
      setSelectedPatient({...selectedPatient, isDraft: false, name: draftData.name})
      setIsEditingDraft(false)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmittingDraft(false)
    }
  }

  const filtered = patients.filter(p => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false
    
    const pEsi = p.triageResult.esi_level || 
      (p.triageResult.priority === 'CRITICAL' ? 1 : 
       p.triageResult.priority === 'HIGH' ? 2 : 
       p.triageResult.priority === 'MEDIUM' ? 3 : 4)

    if (priorityFilter !== 'ALL' && pEsi !== priorityFilter) return false
    return true
  }).sort((a, b) => {
    const aEsi = a.triageResult.esi_level || 
      (a.triageResult.priority === 'CRITICAL' ? 1 : a.triageResult.priority === 'HIGH' ? 2 : a.triageResult.priority === 'MEDIUM' ? 3 : 4)
    const bEsi = b.triageResult.esi_level || 
      (b.triageResult.priority === 'CRITICAL' ? 1 : b.triageResult.priority === 'HIGH' ? 2 : b.triageResult.priority === 'MEDIUM' ? 3 : 4)
    return aEsi - bEsi
  })

  const stats = {
    total: patients.length,
    waiting: patients.filter(p => p.status === 'WAITING').length,
    inProgress: patients.filter(p => p.status === 'IN_PROGRESS').length,
    completed: patients.filter(p => p.status === 'COMPLETED').length,
  }

  const getStatusLabel = (s: string) => {
    if (s === 'WAITING') return { label: 'Menunggu', icon: Clock3, cls: 'bg-amber-50 text-amber-700 border-amber-200' }
    if (s === 'IN_PROGRESS') return { label: 'Diperiksa', icon: Stethoscope, cls: 'bg-blue-50 text-blue-700 border-blue-200' }
    return { label: 'Selesai', icon: CircleCheckBig, cls: 'bg-green-50 text-green-700 border-green-200' }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Antrian Pasien (Triase ESI)</h1>
          <p className="text-sm text-muted-foreground">{stats.waiting} menunggu · {stats.inProgress} diperiksa · {stats.completed} selesai</p>
        </div>
        <Link href="/admin/input-pasien">
          <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
            <UserPlus className="w-4 h-4" />Pasien Baru
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, cls: 'bg-muted text-muted-foreground' },
          { label: 'Menunggu', value: stats.waiting, cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
          { label: 'Diperiksa', value: stats.inProgress, cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
          { label: 'Selesai', value: stats.completed, cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-3 ${s.cls}`}>
            <p className="text-xs font-medium opacity-75">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1.5">
          <Filter className="w-4 h-4" /><span>Filter:</span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            {(['ALL', 'WAITING', 'IN_PROGRESS', 'COMPLETED'] as StatusFilter[]).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground border border-input hover:border-accent'
                }`}>
                {s === 'ALL' ? 'Semua' : s === 'WAITING' ? 'Menunggu' : s === 'IN_PROGRESS' ? 'Diperiksa' : 'Selesai'}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setPriorityFilter('ALL')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${priorityFilter === 'ALL' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground border border-input'}`}>
              Semua ESI
            </button>
            {([1, 2, 3, 4, 5] as EsiLevel[]).map(esi => {
              const cfg = ESI_CONFIG[esi]
              return (
                <button key={esi} onClick={() => setPriorityFilter(esi)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    priorityFilter === esi
                      ? `${cfg.badge} border-transparent text-white`
                      : 'bg-background text-muted-foreground border border-input hover:border-accent'
                  }`}>
                  ESI {esi}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Patient Cards */}
      <div className="space-y-3">
        {filtered.map((patient) => {
          const statusCfg = getStatusLabel(patient.status)
          const StatusIcon = statusCfg.icon
          const pEsi = patient.triageResult.esi_level || 
            (patient.triageResult.priority === 'CRITICAL' ? 1 : patient.triageResult.priority === 'HIGH' ? 2 : patient.triageResult.priority === 'MEDIUM' ? 3 : 4)
          const cfg = ESI_CONFIG[pEsi as EsiLevel]

          return (
            <Card key={patient.id} 
                  onClick={() => {
                    setSelectedPatient(patient)
                    setIsEditingDraft(false)
                  }}
                  className={`border shadow-sm hover:shadow-md transition-shadow cursor-pointer ${cfg.bgLight} border-${cfg.color.replace('bg-', '')}/30`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white ${cfg.badge}`}>
                    {patient.queueNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-card-foreground">{patient.name}</h3>
                      <span className="text-xs text-muted-foreground">{patient.age}th · {patient.gender === 'L' ? 'L' : 'P'}</span>
                      <Badge className={`${cfg.badge} text-xs border-transparent`}>
                        ESI {pEsi}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${statusCfg.cls}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />{statusCfg.label}
                      </Badge>
                      {patient.tx_hash_initial && (
                        <Badge variant="outline" className="text-xs bg-slate-100 text-slate-600 border-slate-200 gap-1">
                          <Link2 className="w-3 h-3" /> Initial Log
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{patient.complaint}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-medium">
                      <span>BP: {patient.vitalSigns.bloodPressure || '-'}</span>
                      <span>HR: {patient.vitalSigns.heartRate || '-'}</span>
                      <span>SpO2: {patient.vitalSigns.oxygenSaturation || '-'}%</span>
                      {patient.vitalSigns.news2Score !== undefined && (
                        <span className="text-blue-600 dark:text-blue-400">NEWS2: {patient.vitalSigns.news2Score}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground hidden sm:flex flex-col items-end justify-center">
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 text-muted mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Tidak ada pasien dalam antrian</p>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <Drawer open={!!selectedPatient} onOpenChange={(open) => !open && setSelectedPatient(null)}>
        <DrawerContent className="h-[85vh]">
          {selectedPatient && (() => {
            const esi = selectedPatient.triageResult.esi_level || 4
            const cfg = ESI_CONFIG[esi as EsiLevel]
            return (
              <div className="mx-auto w-full max-w-4xl h-full flex flex-col">
                <DrawerHeader className="border-b border-border pb-4 flex-shrink-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <DrawerTitle className="text-2xl font-bold flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg text-white ${cfg.badge} flex items-center justify-center text-sm font-bold`}>
                          {selectedPatient.queueNumber}
                        </div>
                        {selectedPatient.name}
                      </DrawerTitle>
                      <DrawerDescription className="mt-1 flex items-center gap-2">
                        {selectedPatient.age} Tahun · {selectedPatient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </DrawerDescription>
                    </div>
                    <Badge className={`${cfg.badge} text-lg px-4 py-1`}>
                      ESI {esi} - {cfg.label}
                    </Badge>
                  </div>
                </DrawerHeader>

                <div className="p-4 overflow-y-auto flex-1 bg-muted/30">
                  {selectedPatient.isDraft && !isEditingDraft && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="font-semibold text-red-800">Data Identitas Belum Lengkap</p>
                          <p className="text-sm text-red-600">Pasien ini menggunakan jalur bypass. Mohon lengkapi identitasnya.</p>
                        </div>
                      </div>
                      <Button onClick={() => {
                        setDraftData({
                          name: (selectedPatient.name.startsWith('Pasien Kode') || selectedPatient.name.startsWith('Pasien Draft')) ? '' : selectedPatient.name,
                          gender: selectedPatient.gender,
                          dob: '',
                          phone: selectedPatient.phone === '-' ? '' : selectedPatient.phone,
                          address: selectedPatient.address.includes('belum diisi') ? '' : selectedPatient.address,
                          nik: selectedPatient.nik || '',
                          bpjs_number: (selectedPatient as any).bpjs_number || '',
                          email: '',
                          password: ''
                        })
                        setIsEditingDraft(true)
                      }} className="bg-red-600 hover:bg-red-700 w-full sm:w-auto">
                        Lengkapi Data Identitas
                      </Button>
                    </div>
                  )}

                  {isEditingDraft ? (
                    <Card className="max-w-2xl mx-auto border-red-200">
                      <CardHeader className="bg-red-50/50 border-b border-red-100 pb-4">
                        <CardTitle className="text-red-700 text-lg flex items-center gap-2">
                          <UserPlus className="w-5 h-5" /> Registrasi Pasien Baru
                        </CardTitle>
                        <CardDescription className="text-red-600/80">
                          Daftarkan pasien ke database Vitas dan buatkan akun login
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6 space-y-4" onPointerDown={(e) => e.stopPropagation()}>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2 col-span-2 sm:col-span-1">
                            <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
                            <Input value={draftData.name} onChange={e => setDraftData({...draftData, name: e.target.value})} placeholder="Nama pasien" />
                          </div>
                          <div className="space-y-2 col-span-2 sm:col-span-1">
                            <Label>Tanggal Lahir <span className="text-red-500">*</span></Label>
                            <Input type="date" value={draftData.dob} onChange={e => setDraftData({...draftData, dob: e.target.value})} />
                          </div>
                          <div className="space-y-2 col-span-2 sm:col-span-1">
                            <Label>Usia (Otomatis)</Label>
                            <Input value={draftData.dob ? calculateAge(draftData.dob) : ''} disabled placeholder="Dihitung otomatis" className="bg-muted/50" />
                          </div>
                          <div className="space-y-2 col-span-2 sm:col-span-1">
                            <Label>Jenis Kelamin <span className="text-red-500">*</span></Label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={draftData.gender} onChange={e => setDraftData({...draftData, gender: e.target.value as 'L'|'P'})}>
                              <option value="L">Laki-laki</option>
                              <option value="P">Perempuan</option>
                            </select>
                          </div>
                          <div className="space-y-2 col-span-2 sm:col-span-1">
                            <Label>NIK <span className="text-muted-foreground font-normal text-xs">(Tidak Wajib)</span></Label>
                            <Input value={draftData.nik || ''} onChange={e => setDraftData({...draftData, nik: e.target.value})} placeholder="Tidak Wajib Diisi" />
                          </div>
                          <div className="space-y-2 col-span-2 sm:col-span-1">
                            <Label>No. BPJS <span className="text-muted-foreground font-normal text-xs">(Tidak Wajib)</span></Label>
                            <Input value={draftData.bpjs_number || ''} onChange={e => setDraftData({...draftData, bpjs_number: e.target.value})} placeholder="Tidak Wajib Diisi" />
                          </div>
                          <div className="space-y-2 col-span-2 sm:col-span-1">
                            <Label>No. Telepon <span className="text-red-500">*</span></Label>
                            <Input value={draftData.phone} onChange={e => setDraftData({...draftData, phone: e.target.value})} placeholder="08xxx" />
                          </div>
                          <div className="hidden sm:block col-span-1"></div>
                          <div className="space-y-2 col-span-2">
                            <Label>Alamat Lengkap <span className="text-red-500">*</span></Label>
                            <Textarea value={draftData.address} onChange={e => setDraftData({...draftData, address: e.target.value})} placeholder="Alamat lengkap" rows={3} />
                          </div>
                        </div>

                        <div className="my-6 border-t"></div>

                        <div className="space-y-4">
                          <h3 className="font-semibold text-sm">Informasi Akun Pasien (Untuk Login)</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2 sm:col-span-1">
                              <Label>Email <span className="text-red-500">*</span></Label>
                              <Input type="email" value={draftData.email} onChange={e => setDraftData({...draftData, email: e.target.value})} placeholder="email@pasien.com" />
                            </div>
                            <div className="space-y-2 col-span-2 sm:col-span-1">
                              <Label>Password Default <span className="text-red-500">*</span></Label>
                              <Input type="password" value={draftData.password} onChange={e => setDraftData({...draftData, password: e.target.value})} placeholder="password123" />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                          <Button variant="outline" onClick={() => setIsEditingDraft(false)}>Batal</Button>
                          <Button onClick={handleSaveDraft} disabled={isSubmittingDraft || !draftData.name || !draftData.dob || !draftData.phone || !draftData.address || !draftData.email || !draftData.password} className="bg-red-600 hover:bg-red-700">
                            {isSubmittingDraft ? 'Menyimpan...' : 'Simpan Data Pasien'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="flex flex-col gap-6">
                      {/* Clinical Data */}
                      <Card>
                        <CardHeader className="pb-3 border-b">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Activity className="w-4 h-4 text-rose-500" /> Data Klinis Awal
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Keluhan Utama</p>
                            <p className="text-sm font-medium">{selectedPatient.complaint}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                            <div><p className="text-xs text-muted-foreground">Tekanan Darah</p><p className="font-semibold">{selectedPatient.vitalSigns.bloodPressure || '-'}</p></div>
                            <div><p className="text-xs text-muted-foreground">Denyut Jantung</p><p className="font-semibold">{selectedPatient.vitalSigns.heartRate || '-'} bpm</p></div>
                            <div><p className="text-xs text-muted-foreground">SpO2</p><p className="font-semibold">{selectedPatient.vitalSigns.oxygenSaturation || '-'}%</p></div>
                            <div><p className="text-xs text-muted-foreground">Frek. Napas</p><p className="font-semibold">{selectedPatient.vitalSigns.respiratoryRate || '-'} x/m</p></div>
                            <div><p className="text-xs text-muted-foreground">Suhu</p><p className="font-semibold">{selectedPatient.vitalSigns.temperature || '-'}</p></div>
                            <div><p className="text-xs text-muted-foreground">GCS</p><p className="font-semibold">{selectedPatient.vitalSigns.gcstotal || '-'}</p></div>
                          </div>
                          
                          <div className="bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900 grid grid-cols-3 text-center">
                            <div><p className="text-xs text-blue-600/70">MAP</p><p className="font-bold text-blue-700 dark:text-blue-400">{selectedPatient.vitalSigns.map || '-'}</p></div>
                            <div><p className="text-xs text-blue-600/70">Shock Index</p><p className="font-bold text-blue-700 dark:text-blue-400">{selectedPatient.vitalSigns.shockIndex || '-'}</p></div>
                            <div><p className="text-xs text-blue-600/70">NEWS2</p><p className="font-bold text-blue-700 dark:text-blue-400">{selectedPatient.vitalSigns.news2Score ?? '-'}</p></div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Blockchain Logs */}
                      <Card className="flex-1 flex flex-col">
                        <CardHeader className="pb-3 border-b">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Link2 className="w-4 h-4 text-slate-500" /> Dual-Log Blockchain
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 flex-1 flex flex-col justify-center space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                              <Check className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold">Initial Log (AI Triage)</p>
                              <p className="text-xs text-muted-foreground font-mono truncate bg-muted p-1 mt-1 rounded">
                                {selectedPatient.tx_hash_initial || 'Menunggu pencatatan...'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${selectedPatient.tx_hash_final ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                              {selectedPatient.tx_hash_final ? 
                                <Check className="w-4 h-4 text-emerald-600" /> : 
                                <Clock3 className="w-4 h-4 text-slate-400" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground/80">Final Log (Doctor Confirmed)</p>
                              <p className="text-xs text-muted-foreground font-mono truncate bg-muted p-1 mt-1 rounded">
                                {selectedPatient.tx_hash_final || 'Belum dikonfirmasi dokter'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      {/* AI Reasoning */}
                      <Card className="h-full flex flex-col">
                        <CardHeader className="pb-3 border-b">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Brain className="w-4 h-4 text-violet-500" /> AI Interpretability
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 flex-1 flex flex-col">
                          <p className="text-sm leading-relaxed mb-4">
                            {selectedPatient.triageResult.reasoning_text || 
                              selectedPatient.triageResult.reasoning.join('. ')}
                          </p>
                          
                          {selectedPatient.triageResult.shap_features && selectedPatient.triageResult.shap_features.length > 0 && (
                            <div className="flex-1 mt-4 border border-border rounded-xl p-3 bg-card min-h-[300px] flex flex-col">
                              <p className="text-xs font-semibold text-center mb-2 text-muted-foreground shrink-0">Fitur Penentu ESI</p>
                              <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={selectedPatient.triageResult.shap_features.map(f => ({ name: f.label, value: Math.abs(f.shap_value), isNeg: f.shap_value < 0 }))}
                                  margin={{ left: 0, right: 0, top: 10, bottom: 90 }}
                                >
                                  <XAxis type="category" dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={100} />
                                  <YAxis type="number" hide />
                                  <Tooltip formatter={(v: number) => [v.toFixed(2), 'Impact']} />
                                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {selectedPatient.triageResult.shap_features.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.shap_value < 0 ? '#ef4444' : '#f59e0b'} />
                                    ))}
                                  </Bar>
                                </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  )}
                </div>
              </div>
            )
          })()}
        </DrawerContent>
      </Drawer>
    </div>
  )
}
