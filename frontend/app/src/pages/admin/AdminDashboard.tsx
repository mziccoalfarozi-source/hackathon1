import { Link } from 'react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users, UserPlus, ClipboardList, ShieldCheck, AlertTriangle,
  Zap, Clock, CheckCircle, ArrowRight, Activity, TrendingUp
} from 'lucide-react'
import { useQueue } from '@/contexts/QueueContext'

export default function AdminDashboard() {
  const { patients } = useQueue()

  const stats = {
    total: patients.length,
    critical: patients.filter(p => p.triageResult.priority === 'CRITICAL').length,
    high: patients.filter(p => p.triageResult.priority === 'HIGH').length,
    medium: patients.filter(p => p.triageResult.priority === 'MEDIUM').length,
    low: patients.filter(p => p.triageResult.priority === 'LOW').length,
    waiting: patients.filter(p => p.status === 'WAITING').length,
    inProgress: patients.filter(p => p.status === 'IN_PROGRESS').length,
    completed: patients.filter(p => p.status === 'COMPLETED').length,
  }

  const recentPatients = [...patients]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Admin</h1>
        <p className="text-sm text-slate-500 mt-1">Kelola pendaftaran dan antrian pasien RS Misal</p>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link to="/admin/input-pasien">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-lg transition-all group cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Input Pasien Baru</h3>
                <p className="text-xs text-slate-500">Daftarkan pasien dan analisis triage AI</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/admin/antrian">
          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 hover:shadow-lg transition-all group cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Lihat Antrian</h3>
                <p className="text-xs text-slate-500">{stats.waiting} pasien menunggu</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-slate-600" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Total Pasien</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Kritis</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Menunggu</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.waiting}</p>
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
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Priority Breakdown */}
      <Card className="shadow-sm">
        <CardContent className="p-5">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-500" />
            Distribusi Prioritas
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Kritis', count: stats.critical, color: 'bg-red-500', lightColor: 'bg-red-100 text-red-700' },
              { label: 'Tinggi', count: stats.high, color: 'bg-orange-500', lightColor: 'bg-orange-100 text-orange-700' },
              { label: 'Sedang', count: stats.medium, color: 'bg-yellow-500', lightColor: 'bg-yellow-100 text-yellow-700' },
              { label: 'Rendah', count: stats.low, color: 'bg-green-500', lightColor: 'bg-green-100 text-green-700' },
            ].map(item => (
              <div key={item.label} className="text-center">
                <div className="h-2 rounded-full bg-slate-100 mb-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all`}
                    style={{ width: `${stats.total > 0 ? (item.count / stats.total) * 100 : 0}%` }}
                  />
                </div>
                <Badge className={`${item.lightColor} text-xs`}>{item.label}: {item.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Patients */}
      <Card className="shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500" />
              Pasien Terbaru
            </h3>
            <Link to="/admin/antrian">
              <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700">
                Lihat Semua <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {recentPatients.map(patient => (
              <div key={patient.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                  patient.triageResult.priority === 'CRITICAL' ? 'bg-red-500' :
                  patient.triageResult.priority === 'HIGH' ? 'bg-orange-500' :
                  patient.triageResult.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                }`}>
                  {patient.queueNumber}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{patient.name}</p>
                  <p className="text-xs text-slate-500 truncate">{patient.complaint}</p>
                </div>
                <Badge variant="outline" className={`text-xs ${
                  patient.status === 'WAITING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  patient.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  'bg-green-50 text-green-700 border-green-200'
                }`}>
                  {patient.status === 'WAITING' ? 'Menunggu' : patient.status === 'IN_PROGRESS' ? 'Diperiksa' : 'Selesai'}
                </Badge>
              </div>
            ))}
            {recentPatients.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">Belum ada pasien</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
