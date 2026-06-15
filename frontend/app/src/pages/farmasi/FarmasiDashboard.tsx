import { Link } from 'react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Toaster, toast } from 'sonner'
import {
  FlaskConical, Clock, CheckCircle, Package, ArrowRight,
  User, Stethoscope, Pill, AlertTriangle, Loader2
} from 'lucide-react'
import { useQueue } from '@/contexts/QueueContext'
import { useState } from 'react'

export default function FarmasiDashboard() {
  const { patients, updatePharmacyStatus } = useQueue()
  const [processingId, setProcessingId] = useState<string | null>(null)

  const pendingPatients = patients.filter(p => p.pharmacyStatus === 'PENDING')
  const processingPatients = patients.filter(p => p.pharmacyStatus === 'PROCESSING')
  const completedPatients = patients.filter(p => p.pharmacyStatus === 'COMPLETED')

  const handleProcess = (id: string) => {
    updatePharmacyStatus(id, 'PROCESSING')
    toast.success('Obat sedang disiapkan')
  }

  const handleComplete = (id: string) => {
    setProcessingId(id)
    toast.loading('Menyelesaikan...', { duration: 1000 })
    setTimeout(() => {
      updatePharmacyStatus(id, 'COMPLETED')
      setProcessingId(null)
      toast.success('Obat telah diserahkan ke pasien!')
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Farmasi</h1>
        <p className="text-sm text-slate-500 mt-1">Kelola rujukan obat dari dokter</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Menunggu</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{pendingPatients.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Disiapkan</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{processingPatients.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Diserahkan</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{completedPatients.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending */}
      {pendingPatients.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Menunggu Disiapkan ({pendingPatients.length})
          </h2>
          <div className="space-y-3">
            {pendingPatients.map(patient => (
              <Card key={patient.id} className="border-amber-200 bg-amber-50/30 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                      <FlaskConical className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{patient.name}</h3>
                        <span className="text-xs text-slate-500">{patient.age}th · {patient.queueNumber}</span>
                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">Menunggu</Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                        <Stethoscope className="w-3 h-3" />
                        <span>Dokter: {patient.doctorName || '-'}</span>
                        {patient.diagnosis && (
                          <><span>·</span><span>Diagnosis: {patient.diagnosis}</span></>
                        )}
                      </div>

                      {/* Prescriptions */}
                      {patient.prescriptions && patient.prescriptions.length > 0 && (
                        <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-2">
                          <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                            <Pill className="w-3 h-3 text-violet-500" />Resep Obat:
                          </p>
                          {patient.prescriptions.map((rx, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm bg-slate-50 rounded-lg p-2">
                              <span className="w-5 h-5 rounded bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold">{i+1}</span>
                              <div className="flex-1">
                                <span className="font-medium text-slate-900">{rx.medicationName}</span>
                                <span className="text-slate-500 ml-2">{rx.dosage}</span>
                              </div>
                              <span className="text-xs text-slate-500">{rx.frequency} · {rx.duration}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button onClick={() => handleProcess(patient.id)} className="bg-amber-600 hover:bg-amber-700 gap-2 flex-shrink-0">
                      <Package className="w-4 h-4" />Siapkan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Processing */}
      {processingPatients.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500" />
            Sedang Disiapkan ({processingPatients.length})
          </h2>
          <div className="space-y-3">
            {processingPatients.map(patient => (
              <Card key={patient.id} className="border-blue-200 bg-blue-50/30 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{patient.name}</h3>
                        <span className="text-xs text-slate-500">{patient.queueNumber}</span>
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Disiapkan</Badge>
                      </div>
                      {patient.prescriptions && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {patient.prescriptions.map((rx, i) => (
                            <Badge key={i} variant="outline" className="text-xs bg-white">{rx.medicationName} {rx.dosage}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button onClick={() => handleComplete(patient.id)} disabled={processingId === patient.id}
                      className="bg-green-600 hover:bg-green-700 gap-2 flex-shrink-0">
                      {processingId === patient.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Serahkan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completedPatients.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Sudah Diserahkan ({completedPatients.length})
          </h2>
          <div className="space-y-2">
            {completedPatients.slice(0, 5).map(patient => (
              <Card key={patient.id} className="border-slate-200 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{patient.name}</p>
                      <div className="flex gap-1 mt-0.5">
                        {patient.prescriptions?.map((rx, i) => (
                          <span key={i} className="text-xs text-slate-500">{rx.medicationName}{i < (patient.prescriptions?.length || 0) - 1 ? ',' : ''}</span>
                        ))}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Selesai</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {pendingPatients.length === 0 && processingPatients.length === 0 && completedPatients.length === 0 && (
        <div className="text-center py-20">
          <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Belum ada rujukan obat</p>
          <p className="text-sm text-slate-400 mt-1">Rujukan dari dokter akan muncul di sini</p>
        </div>
      )}
    </div>
  )
}
