'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, History, FlaskConical } from 'lucide-react'
import { useQueue } from '@/contexts/QueueContext'
import { useAuth } from '@/contexts/AuthContext'

export default function DokterRiwayat() {
  const { patients } = useQueue()
  const { user } = useAuth()

  const completedPatients = patients
    .filter(p => p.status === 'COMPLETED' && p.doctorId === user?.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Riwayat Pasien</h1>
        <p className="text-sm text-slate-500 mt-1">{completedPatients.length} pasien telah diperiksa</p>
      </div>

      <div className="space-y-3">
        {completedPatients.map(patient => (
          <Card key={patient.id} className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{patient.name}</h3>
                    <span className="text-xs text-slate-500">{patient.age}th · {patient.queueNumber}</span>
                  </div>
                  {patient.diagnosis && (
                    <p className="text-sm text-slate-700 mb-2">
                      <span className="font-medium">Diagnosis:</span> {patient.diagnosis}
                    </p>
                  )}
                  {patient.prescriptions && patient.prescriptions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <FlaskConical className="w-3.5 h-3.5 text-violet-500 mt-0.5" />
                      {patient.prescriptions.map((rx, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-violet-50 text-violet-700 border-violet-200">
                          {rx.medicationName} {rx.dosage}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <Badge variant="outline" className={`text-xs ${
                    patient.pharmacyStatus === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                    patient.pharmacyStatus === 'PROCESSING' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {patient.pharmacyStatus === 'COMPLETED' ? 'Obat Diserahkan' :
                     patient.pharmacyStatus === 'PROCESSING' ? 'Obat Disiapkan' : 'Menunggu Farmasi'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {completedPatients.length === 0 && (
          <div className="text-center py-20">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Belum ada riwayat pasien</p>
          </div>
        )}
      </div>
    </div>
  )
}
