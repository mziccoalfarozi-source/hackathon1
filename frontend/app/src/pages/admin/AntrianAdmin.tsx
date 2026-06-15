import { useState } from 'react'
import { Link } from 'react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ClipboardList, AlertTriangle, Zap, Clock, CheckCircle, Clock3,
  User, Activity, RefreshCw, Filter, Stethoscope, UserPlus
} from 'lucide-react'
import { useQueue } from '@/contexts/QueueContext'

type StatusFilter = 'ALL' | 'WAITING' | 'IN_PROGRESS' | 'COMPLETED'
type PriorityFilter = 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export default function AntrianAdmin() {
  const { patients } = useQueue()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL')

  const filtered = patients.filter(p => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false
    if (priorityFilter !== 'ALL' && p.triageResult.priority !== priorityFilter) return false
    return true
  }).sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    return order[a.triageResult.priority] - order[b.triageResult.priority]
  })

  const stats = {
    total: patients.length,
    waiting: patients.filter(p => p.status === 'WAITING').length,
    inProgress: patients.filter(p => p.status === 'IN_PROGRESS').length,
    completed: patients.filter(p => p.status === 'COMPLETED').length,
  }

  const getStatusLabel = (s: string) => {
    if (s === 'WAITING') return { label: 'Menunggu', icon: Clock3, cls: 'bg-amber-50 text-amber-700 border-amber-200' }
    if (s === 'IN_PROGRESS') return { label: 'Diperiksa', icon: Activity, cls: 'bg-blue-50 text-blue-700 border-blue-200' }
    return { label: 'Selesai', icon: CheckCircle, cls: 'bg-green-50 text-green-700 border-green-200' }
  }

  const getPriorityBadge = (p: string) => {
    if (p === 'CRITICAL') return 'bg-red-600 text-white'
    if (p === 'HIGH') return 'bg-orange-500 text-white'
    if (p === 'MEDIUM') return 'bg-yellow-500 text-white'
    return 'bg-green-500 text-white'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Antrian Pasien</h1>
          <p className="text-sm text-slate-500">{stats.waiting} menunggu · {stats.inProgress} diperiksa · {stats.completed} selesai</p>
        </div>
        <Link to="/admin/input-pasien">
          <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
            <UserPlus className="w-4 h-4" />Pasien Baru
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, cls: 'bg-slate-100 text-slate-700' },
          { label: 'Menunggu', value: stats.waiting, cls: 'bg-amber-100 text-amber-700' },
          { label: 'Diperiksa', value: stats.inProgress, cls: 'bg-blue-100 text-blue-700' },
          { label: 'Selesai', value: stats.completed, cls: 'bg-green-100 text-green-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-3 ${s.cls}`}>
            <p className="text-xs font-medium opacity-75">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Filter className="w-4 h-4" /><span>Filter:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', 'WAITING', 'IN_PROGRESS', 'COMPLETED'] as StatusFilter[]).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}>
              {s === 'ALL' ? 'Semua' : s === 'WAITING' ? 'Menunggu' : s === 'IN_PROGRESS' ? 'Diperiksa' : 'Selesai'}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as PriorityFilter[]).map(p => (
            <button key={p} onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                priorityFilter === p
                  ? p === 'ALL' ? 'bg-slate-800 text-white' :
                    p === 'CRITICAL' ? 'bg-red-600 text-white' :
                    p === 'HIGH' ? 'bg-orange-500 text-white' :
                    p === 'MEDIUM' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}>
              {p === 'ALL' ? 'Semua' : p === 'CRITICAL' ? 'Kritis' : p === 'HIGH' ? 'Tinggi' : p === 'MEDIUM' ? 'Sedang' : 'Rendah'}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Cards */}
      <div className="space-y-3">
        {filtered.map((patient, index) => {
          const statusCfg = getStatusLabel(patient.status)
          const StatusIcon = statusCfg.icon
          return (
            <Card key={patient.id} className={`border shadow-sm hover:shadow-md transition-shadow ${
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
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{patient.name}</h3>
                      <span className="text-xs text-slate-500">{patient.age}th · {patient.gender === 'L' ? 'L' : 'P'}</span>
                      <Badge className={`${getPriorityBadge(patient.triageResult.priority)} text-xs`}>
                        {patient.triageResult.priorityLabel}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${statusCfg.cls}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />{statusCfg.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 truncate">{patient.complaint}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>BP: {patient.vitalSigns.bloodPressure}</span>
                      <span>HR: {patient.vitalSigns.heartRate}</span>
                      <span>SpO2: {patient.vitalSigns.oxygenSaturation}%</span>
                      <span>Suhu: {patient.vitalSigns.temperature}°C</span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500 hidden sm:block">
                    <p>AI: {(patient.triageResult.confidence * 100).toFixed(0)}%</p>
                    {patient.doctorName && <p className="mt-1 text-blue-600">{patient.doctorName}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Tidak ada pasien dalam antrian</p>
          </div>
        )}
      </div>
    </div>
  )
}
