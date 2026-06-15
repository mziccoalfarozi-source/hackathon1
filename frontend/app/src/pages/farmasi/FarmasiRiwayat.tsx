import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, History, FlaskConical, Pill } from 'lucide-react'
import { useQueue } from '@/contexts/QueueContext'

export default function FarmasiRiwayat() {
  const { patients } = useQueue()

  const completedPatients = patients
    .filter(p => p.pharmacyStatus === 'COMPLETED')
    .sort((a, b) => {
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0
      return bTime - aTime
    })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Riwayat Farmasi</h1>
        <p className="text-sm text-slate-500 mt-1">{completedPatients.length} resep telah diserahkan</p>
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
                    <span className="text-xs text-slate-500">{patient.queueNumber}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">
                    Dokter: {patient.doctorName || '-'} · Diagnosis: {patient.diagnosis || '-'}
                  </p>
                  {patient.prescriptions && (
                    <div className="flex flex-wrap gap-1">
                      {patient.prescriptions.map((rx, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-violet-50 text-violet-700 border-violet-200">
                          <Pill className="w-3 h-3 mr-1" />
                          {rx.medicationName} {rx.dosage} · {rx.frequency}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Selesai</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {completedPatients.length === 0 && (
          <div className="text-center py-20">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Belum ada riwayat</p>
          </div>
        )}
      </div>
    </div>
  )
}
