import { Link } from 'react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ClipboardList, AlertTriangle, Clock, ArrowRight, Activity, CheckCircle, Clock3
} from 'lucide-react'
import { useQueue } from '@/contexts/QueueContext'

export default function DokterAntrian() {
  const { patients } = useQueue()

  const waitingPatients = patients
    .filter(p => p.status === 'WAITING')
    .sort((a, b) => {
      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
      return order[a.triageResult.priority] - order[b.triageResult.priority]
    })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Antrian Pasien</h1>
        <p className="text-sm text-slate-500 mt-1">{waitingPatients.length} pasien menunggu pemeriksaan</p>
      </div>

      <div className="space-y-3">
        {waitingPatients.map(patient => (
          <Link key={patient.id} to={`/dokter/periksa/${patient.id}`}>
            <Card className={`border shadow-sm hover:shadow-md transition-all cursor-pointer ${
              patient.triageResult.priority === 'CRITICAL' ? 'border-red-200 bg-red-50/30' :
              patient.triageResult.priority === 'HIGH' ? 'border-orange-200 bg-orange-50/30' :
              'border-slate-200 bg-white'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white ${
                    patient.triageResult.priority === 'CRITICAL' ? 'bg-red-600' :
                    patient.triageResult.priority === 'HIGH' ? 'bg-orange-500' :
                    patient.triageResult.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}>
                    {patient.queueNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{patient.name}</h3>
                      <span className="text-xs text-slate-500">{patient.age}th · {patient.gender === 'L' ? 'L' : 'P'}</span>
                      <Badge className={`text-xs ${
                        patient.triageResult.priority === 'CRITICAL' ? 'bg-red-600 text-white' :
                        patient.triageResult.priority === 'HIGH' ? 'bg-orange-500 text-white' :
                        patient.triageResult.priority === 'MEDIUM' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
                      }`}>{patient.triageResult.priorityLabel}</Badge>
                    </div>
                    <p className="text-sm text-slate-600 truncate">{patient.complaint}</p>
                    <div className="flex gap-3 mt-1 text-xs text-slate-500">
                      <span>BP: {patient.vitalSigns.bloodPressure}</span>
                      <span>HR: {patient.vitalSigns.heartRate}</span>
                      <span>SpO2: {patient.vitalSigns.oxygenSaturation}%</span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {waitingPatients.length === 0 && (
          <div className="text-center py-20">
            <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Semua pasien sudah ditangani</p>
            <p className="text-sm text-slate-400 mt-1">Tidak ada pasien dalam antrian</p>
          </div>
        )}
      </div>
    </div>
  )
}
