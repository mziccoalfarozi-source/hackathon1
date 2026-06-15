import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Toaster, toast } from 'sonner'
import {
  Brain, ShieldCheck, AlertTriangle, Clock, Activity, ChevronRight,
  User, Heart, Thermometer, Wind, RotateCcw, CheckCircle, XCircle,
  FileText, Zap, ArrowRight, ExternalLink, Loader2
} from 'lucide-react'
import type { PatientData, TriageResult } from '@/types'
import { getMockTriageResult, hashData } from '@/data/mock'

export default function HasilTriage() {
  const navigate = useNavigate()
  const [patient, setPatient] = useState<PatientData | null>(null)
  const [result, setResult] = useState<TriageResult | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [activeReasonIndex, setActiveReasonIndex] = useState<number | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('currentPatient')
    const triageId = localStorage.getItem('currentTriageId')
    if (stored && triageId) {
      const p = JSON.parse(stored) as PatientData
      setPatient(p)
      setResult(getMockTriageResult(triageId))
    } else {
      navigate('/form')
    }
  }, [navigate])

  const handleConfirm = async () => {
    setIsConfirming(true)
    toast.loading('Mengirim data ke blockchain Polygon...', { duration: 3000 })

    setTimeout(() => {
      const mockTxHash = '0x' + Array.from({ length: 64 }, () =>
        '0123456789abcdef'[Math.floor(Math.random() * 16)]
      ).join('')
      setTxHash(mockTxHash)
      setIsConfirmed(true)
      setIsConfirming(false)
      toast.success('Data berhasil tercatat di blockchain!')
    }, 3000)
  }

  const handleNewPatient = () => {
    localStorage.removeItem('currentPatient')
    localStorage.removeItem('currentTriageId')
    navigate('/form')
  }

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-700',
          badge: 'bg-red-600 text-white',
          icon: AlertTriangle,
          iconColor: 'text-red-600',
          progressColor: 'bg-red-600',
        }
      case 'HIGH':
        return {
          bg: 'bg-orange-50 border-orange-200',
          text: 'text-orange-700',
          badge: 'bg-orange-500 text-white',
          icon: Zap,
          iconColor: 'text-orange-500',
          progressColor: 'bg-orange-500',
        }
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-700',
          badge: 'bg-yellow-500 text-white',
          icon: Clock,
          iconColor: 'text-yellow-600',
          progressColor: 'bg-yellow-500',
        }
      default:
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-700',
          badge: 'bg-green-500 text-white',
          icon: CheckCircle,
          iconColor: 'text-green-600',
          progressColor: 'bg-green-500',
        }
    }
  }

  if (!patient || !result) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-slate-600">Memuat hasil analisis...</p>
        </div>
      </div>
    )
  }

  const cfg = getPriorityConfig(result.priority)
  const PriorityIcon = cfg.icon

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Hasil Analisis AI Triage</h1>
            <p className="text-sm text-slate-500">Analisis prioritas berbasis AI dengan penjelasan reasoning</p>
          </div>
        </div>
      </div>

      {/* Priority Card */}
      <Card className={`mb-6 border-2 ${cfg.bg}`}>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${cfg.badge}`}>
              <PriorityIcon className="w-10 h-10" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h2 className={`text-3xl font-bold ${cfg.text}`}>
                  PRIORITAS {result.priorityLabel}
                </h2>
                <Badge className={cfg.badge}>
                  Confidence: {(result.confidence * 100).toFixed(0)}%
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Estimasi Waktu Tunggu: {result.estimatedWaitTime}</span>
              </div>
              <Progress value={result.confidence * 100} className="h-2.5 mt-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Patient Summary */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                Ringkasan Pasien
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama</span>
                <span className="font-medium text-slate-900">{patient.name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Usia</span>
                <span className="font-medium text-slate-900">{patient.age || '—'} tahun ({patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">NIK</span>
                <span className="font-medium text-slate-900">{patient.nik || '—'}</span>
              </div>
              <Separator />
              <div>
                <span className="text-slate-500 block mb-1">Keluhan Utama</span>
                <p className="font-medium text-slate-900 bg-slate-50 p-2.5 rounded-lg text-xs leading-relaxed">
                  {patient.complaint || '—'}
                </p>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Gejala</span>
                <div className="flex flex-wrap gap-1">
                  {patient.symptoms.length > 0 ? patient.symptoms.map((s, i) => (
                    <Badge key={i} variant="outline" className="text-xs bg-white">{s}</Badge>
                  )) : <span className="text-slate-400">—</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-500" />
                Tanda Vital
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Tekanan Darah', value: patient.vitalSigns.bloodPressure || '—', unit: 'mmHg', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
                { label: 'Denyut Jantung', value: patient.vitalSigns.heartRate || '—', unit: 'bpm', icon: Activity, color: 'text-red-500', bg: 'bg-red-50' },
                { label: 'Suhu', value: patient.vitalSigns.temperature || '—', unit: '°C', icon: Thermometer, color: 'text-orange-500', bg: 'bg-orange-50' },
                { label: 'SpO2', value: patient.vitalSigns.oxygenSaturation || '—', unit: '%', icon: Wind, color: 'text-blue-500', bg: 'bg-blue-50' },
                { label: 'Frek. Napas', value: patient.vitalSigns.respiratoryRate || '—', unit: '/menit', icon: Clock, color: 'text-cyan-500', bg: 'bg-cyan-50' },
              ].map((vital, i) => {
                const Icon = vital.icon
                return (
                  <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg ${vital.bg}`}>
                    <Icon className={`w-4 h-4 ${vital.color}`} />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">{vital.label}</p>
                      <p className="font-semibold text-slate-900">{vital.value} <span className="text-xs font-normal text-slate-500">{vital.unit}</span></p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right: AI Reasoning & Action */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Reasoning */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="w-5 h-5 text-violet-600" />
                AI Reasoning & Analisis
              </CardTitle>
              <CardDescription>Penjelasan sistem AI dalam menentukan prioritas triase</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.reasoning.map((reason, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveReasonIndex(activeReasonIndex === i ? null : i)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      activeReasonIndex === i
                        ? 'bg-violet-50 border-violet-300 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        activeReasonIndex === i
                          ? 'bg-violet-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {i + 1}
                      </div>
                      <p className={`text-sm leading-relaxed ${
                        activeReasonIndex === i ? 'text-violet-900' : 'text-slate-700'
                      }`}>
                        {reason}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommended Action */}
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <FileText className="w-5 h-5 text-amber-600" />
                Rekomendasi Tindakan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-900 leading-relaxed">
                {result.recommendedAction}
              </p>
            </CardContent>
          </Card>

          {/* Confirmation / Blockchain */}
          {!isConfirmed ? (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Konfirmasi Petugas
                </CardTitle>
                <CardDescription>
                  Tinjau hasil AI dan konfirmasi untuk menyimpan ke blockchain audit trail
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleConfirm}
                    disabled={isConfirming}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                    size="lg"
                  >
                    {isConfirming ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Mengirim ke Blockchain...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5" />
                        Konfirmasi & Simpan ke Blockchain
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNewPatient}
                    className="gap-2"
                    size="lg"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Input Pasien Baru
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Data akan di-hash dan disimpan di Polygon Amoy Testnet sebagai audit trail immutable
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  Berhasil Tercatat di Blockchain
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-emerald-200">
                  <p className="text-xs text-slate-500 mb-1.5">Transaction Hash</p>
                  <code className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded block break-all">
                    {txHash}
                  </code>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    className="gap-2 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                    onClick={() => window.open(`https://amoy.polygonscan.com/tx/${txHash}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Lihat di Polygon Explorer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNewPatient}
                    className="gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Pasien Baru
                  </Button>
                  <Button
                    onClick={() => navigate('/antrian')}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    Ke Dashboard Antrian
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
