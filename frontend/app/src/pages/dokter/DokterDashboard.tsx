import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router'
import {
  Users, AlertTriangle, Zap, Clock, CheckCircle,
  Stethoscope, ArrowRight, Activity, ClipboardList, FlaskConical
} from 'lucide-react'
import { useQueue } from '@/contexts/QueueContext'
import { useAuth } from '@/contexts/AuthContext'

export default function DokterDashboard() {
  const { patients } = useQueue()
  const { user } = useAuth()

  const waitingPatients = patients
    .filter(p => p.status === 'WAITING')
    .sort((a, b) => {
      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
      return order[a.triageResult.priority] - order[b.triageResult.priority]
    })

  const inProgressPatients = patients.filter(p => p.status === 'IN_PROGRESS' && p.doctorId === user?.id)
  const completedToday = patients.filter(p => p.status === 'COMPLETED' && p.doctorId === user?.id)
  const referredToPharmacy = patients.filter(p => p.pharmacyStatus && p.doctorId === user?.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Dokter</h1>
        <p className="text-sm text-slate-500 mt-1">Selamat datang, {user?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Menunggu</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{waitingPatients.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Sedang Diperiksa</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{inProgressPatients.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Selesai</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{completedToday.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
                <FlaskConical className="w-4 h-4 text-violet-600" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Dirujuk Farmasi</span>
            </div>
            <p className="text-2xl font-bold text-violet-600">{referredToPharmacy.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action */}
      <Link to="/dokter/antrian">
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 hover:shadow-lg transition-all group cursor-pointer">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">Lihat Antrian Pasien</h3>
              <p className="text-xs text-slate-500">{waitingPatients.length} pasien menunggu pemeriksaan</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </CardContent>
        </Card>
      </Link>

      {/* Urgent Patients */}
      {waitingPatients.filter(p => p.triageResult.priority === 'CRITICAL' || p.triageResult.priority === 'HIGH').length > 0 && (
        <Card className="border-red-200 shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Pasien Urgen — Perlu Penanganan Segera
            </h3>
            <div className="space-y-3">
              {waitingPatients
                .filter(p => p.triageResult.priority === 'CRITICAL' || p.triageResult.priority === 'HIGH')
                .map(patient => (
                  <Link key={patient.id} to={`/dokter/periksa/${patient.id}`}>
                    <div className={`flex items-center gap-4 p-3 rounded-xl hover:shadow-sm transition-all cursor-pointer ${
                      patient.triageResult.priority === 'CRITICAL' ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'
                    }`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                        patient.triageResult.priority === 'CRITICAL' ? 'bg-red-600' : 'bg-orange-500'
                      }`}>
                        {patient.queueNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{patient.name}</p>
                        <p className="text-xs text-slate-500 truncate">{patient.complaint}</p>
                      </div>
                      <Badge className={`text-xs ${
                        patient.triageResult.priority === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'
                      }`}>
                        {patient.triageResult.priorityLabel}
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </Link>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All waiting */}
      <Card className="shadow-sm">
        <CardContent className="p-5">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            Semua Pasien Menunggu
          </h3>
          <div className="space-y-2">
            {waitingPatients.map(patient => (
              <Link key={patient.id} to={`/dokter/periksa/${patient.id}`}>
                <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                    patient.triageResult.priority === 'CRITICAL' ? 'bg-red-600' :
                    patient.triageResult.priority === 'HIGH' ? 'bg-orange-500' :
                    patient.triageResult.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}>
                    {patient.queueNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{patient.name}</p>
                    <p className="text-xs text-slate-500 truncate">{patient.complaint}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>{patient.age}th · {patient.gender === 'L' ? 'L' : 'P'}</p>
                    <p>SpO2: {patient.vitalSigns.oxygenSaturation}%</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </Link>
            ))}
            {waitingPatients.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">Tidak ada pasien menunggu</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
