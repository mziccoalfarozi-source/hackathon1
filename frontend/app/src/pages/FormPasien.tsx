import { useState, useRef } from 'react'
import { useNavigate } from 'react-router'
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
  User, Heart, Thermometer, Wind, Activity, Clock, Pill, AlertTriangle,
  ChevronRight, ChevronLeft, Stethoscope, Send, RotateCcw, Check
} from 'lucide-react'
import type { PatientData } from '@/types'
import { INITIAL_PATIENT_DATA, SYMPTOM_OPTIONS } from '@/data/mock'

export default function FormPasien() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [patient, setPatient] = useState<PatientData>({ ...INITIAL_PATIENT_DATA })
  const formRef = useRef<HTMLFormElement>(null)

  const totalSteps = 3

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

  const handleSubmit = async () => {
    setIsSubmitting(true)
    toast.loading('Menganalisis data pasien dengan AI...', { duration: 2000 })

    setTimeout(() => {
      const patientId = (Math.floor(Math.random() * 4) + 1).toString()
      const id = Date.now().toString(36)
      const data = { ...patient, id }
      localStorage.setItem('currentPatient', JSON.stringify(data))
      localStorage.setItem('currentTriageId', patientId)

      toast.success('Analisis AI selesai!')
      setIsSubmitting(false)
      navigate('/hasil')
    }, 2500)
  }

  const isStepValid = () => {
    switch (step) {
      case 1:
        return patient.name && patient.age > 0 && patient.nik && patient.phone && patient.address
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" ref={formRef}>
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Form Input Pasien</h1>
            <p className="text-sm text-slate-500">Masukkan data lengkap pasien untuk analisis AI triase</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step > i + 1 ? 'bg-emerald-600 text-white' :
                step === i + 1 ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-600' :
                'bg-slate-100 text-slate-400'
              }`}>
                {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`hidden sm:inline text-sm font-medium ${
                step === i + 1 ? 'text-emerald-700' : 'text-slate-500'
              }`}>{label}</span>
            </div>
          ))}
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Personal Data */}
      {step === 1 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              Data Pribadi Pasien
            </CardTitle>
            <CardDescription>Informasi identitas dan kontak pasien</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={patient.name}
                  onChange={e => updatePatient('name', e.target.value)}
                  placeholder="Nama lengkap pasien"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nik">NIK <span className="text-red-500">*</span></Label>
                <Input
                  id="nik"
                  value={patient.nik}
                  onChange={e => updatePatient('nik', e.target.value)}
                  placeholder="Nomor Induk Kependudukan"
                  maxLength={16}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Usia (tahun) <span className="text-red-500">*</span></Label>
                <Input
                  id="age"
                  type="number"
                  value={patient.age || ''}
                  onChange={e => updatePatient('age', parseInt(e.target.value) || 0)}
                  placeholder="Usia dalam tahun"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Jenis Kelamin <span className="text-red-500">*</span></Label>
                <Select value={patient.gender} onValueChange={v => updatePatient('gender', v)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon <span className="text-red-500">*</span></Label>
                <Input
                  id="phone"
                  value={patient.phone}
                  onChange={e => updatePatient('phone', e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="h-11"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Alamat Lengkap <span className="text-red-500">*</span></Label>
                <Textarea
                  id="address"
                  value={patient.address}
                  onChange={e => updatePatient('address', e.target.value)}
                  placeholder="Alamat lengkap pasien"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Symptoms & Complaint */}
      {step === 2 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              Keluhan Utama & Gejala
            </CardTitle>
            <CardDescription>Pilih gejala yang dialami pasien dan jelaskan keluhan utama</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="complaint">
                Keluhan Utama <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="complaint"
                value={patient.complaint}
                onChange={e => updatePatient('complaint', e.target.value)}
                placeholder="Jelaskan keluhan utama pasien secara detail. Contoh: Nyeri dada hebat seperti ditindih batu, menjalar ke lengan kiri..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Gejala yang Dialami <span className="text-red-500">*</span>
                <span className="ml-2 text-xs text-slate-400 font-normal">(Pilih semua yang sesuai)</span>
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SYMPTOM_OPTIONS.map(sym => (
                  <button
                    key={sym.value}
                    type="button"
                    onClick={() => toggleSymptom(sym.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm border transition-all text-left ${
                      patient.symptoms.includes(sym.value)
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      patient.symptoms.includes(sym.value)
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-slate-300'
                    }`}>
                      {patient.symptoms.includes(sym.value) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    {sym.label}
                  </button>
                ))}
              </div>
              {patient.symptoms.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {patient.symptoms.map(s => {
                    const label = SYMPTOM_OPTIONS.find(o => o.value === s)?.label || s
                    return (
                      <Badge key={s} variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        {label}
                        <button onClick={() => toggleSymptom(s)} className="ml-1 hover:text-red-500">×</button>
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Durasi Keluhan <span className="text-red-500">*</span></Label>
              <Select value={patient.duration} onValueChange={v => updatePatient('duration', v)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Pilih durasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="< 1 jam">Kurang dari 1 jam</SelectItem>
                  <SelectItem value="1-6 jam">1 - 6 jam</SelectItem>
                  <SelectItem value="6-24 jam">6 - 24 jam</SelectItem>
                  <SelectItem value="1-3 hari">1 - 3 hari</SelectItem>
                  <SelectItem value="3-7 hari">3 - 7 hari</SelectItem>
                  <SelectItem value="1-2 minggu">1 - 2 minggu</SelectItem>
                  <SelectItem value="> 2 minggu">Lebih dari 2 minggu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="allergies" className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Riwayat Alergi
                </Label>
                <Textarea
                  id="allergies"
                  value={patient.allergies}
                  onChange={e => updatePatient('allergies', e.target.value)}
                  placeholder="Alergi obat, makanan, atau lainnya"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medications" className="flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-blue-500" />
                  Riwayat Pengobatan
                </Label>
                <Textarea
                  id="medications"
                  value={patient.medications}
                  onChange={e => updatePatient('medications', e.target.value)}
                  placeholder="Obat yang sedang dikonsumsi"
                  rows={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Vital Signs */}
      {step === 3 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              Tanda Vital
            </CardTitle>
            <CardDescription>Masukkan semua pengukuran tanda vital pasien</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label htmlFor="bp" className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  Tekanan Darah (mmHg) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="bp"
                  value={patient.vitalSigns.bloodPressure}
                  onChange={e => updateVitalSign('bloodPressure', e.target.value)}
                  placeholder="120/80"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hr" className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-red-500" />
                  Denyut Jantung (bpm) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hr"
                  type="number"
                  value={patient.vitalSigns.heartRate || ''}
                  onChange={e => updateVitalSign('heartRate', parseInt(e.target.value) || 0)}
                  placeholder="72"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temp" className="flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                  Suhu Tubuh (°C) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="temp"
                  type="number"
                  step="0.1"
                  value={patient.vitalSigns.temperature || ''}
                  onChange={e => updateVitalSign('temperature', parseFloat(e.target.value) || 0)}
                  placeholder="36.5"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spo2" className="flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-blue-500" />
                  SpO2 (%) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="spo2"
                  type="number"
                  value={patient.vitalSigns.oxygenSaturation || ''}
                  onChange={e => updateVitalSign('oxygenSaturation', parseInt(e.target.value) || 0)}
                  placeholder="98"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rr" className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-500" />
                  Frekuensi Napas (/menit) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="rr"
                  type="number"
                  value={patient.vitalSigns.respiratoryRate || ''}
                  onChange={e => updateVitalSign('respiratoryRate', parseInt(e.target.value) || 0)}
                  placeholder="18"
                  className="h-11"
                />
              </div>
            </div>

            {/* Normal Ranges Reference */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Rentang Normal Dewasa:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="bg-white rounded-lg p-3 text-center border border-slate-100">
                  <p className="text-slate-500 mb-1">Tekanan Darah</p>
                  <p className="font-semibold text-slate-700">90/60 - 120/80</p>
                  <p className="text-slate-400">mmHg</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-slate-100">
                  <p className="text-slate-500 mb-1">Denyut Jantung</p>
                  <p className="font-semibold text-slate-700">60 - 100</p>
                  <p className="text-slate-400">bpm</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-slate-100">
                  <p className="text-slate-500 mb-1">Suhu</p>
                  <p className="font-semibold text-slate-700">36.1 - 37.2</p>
                  <p className="text-slate-400">°C</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-slate-100">
                  <p className="text-slate-500 mb-1">SpO2</p>
                  <p className="font-semibold text-slate-700">95 - 100</p>
                  <p className="text-slate-400">%</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-slate-100">
                  <p className="text-slate-500 mb-1">Frek. Napas</p>
                  <p className="font-semibold text-slate-700">12 - 20</p>
                  <p className="text-slate-400">/menit</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => step > 1 ? setStep(step - 1) : navigate('/')}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          {step > 1 ? 'Sebelumnya' : 'Kembali'}
        </Button>

        <div className="flex items-center gap-3">
          {step === 3 && (
            <Button
              variant="outline"
              onClick={() => setPatient({ ...INITIAL_PATIENT_DATA })}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          )}
          {step < totalSteps ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!isStepValid()}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              Lanjutkan
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isStepValid() || isSubmitting}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menganalisis...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Analisis dengan AI
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
