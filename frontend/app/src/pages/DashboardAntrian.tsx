import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  ClipboardList, AlertTriangle, Zap, Clock, CheckCircle, Clock3,
  User, Activity, RefreshCw, Filter, ArrowUpDown, Stethoscope,
  ExternalLink, Loader2
} from 'lucide-react'
import type { QueuePatient } from '@/types'
import { QUEUE_PATIENTS } from '@/data/mock'

type StatusFilter = 'ALL' | 'WAITING' | 'IN_PROGRESS' | 'COMPLETED'
type PriorityFilter = 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export default function DashboardAntrian() {
  const [patients, setPatients] = useState<QueuePatient[]>(QUEUE_PATIENTS)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }

  const filteredPatients = patients.filter(p => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false
    if (priorityFilter !== 'ALL' && p.triageResult.priority !== priorityFilter) return false
    return true
  }).sort((a, b) => {
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    return priorityOrder[a.triageResult.priority] - priorityOrder[b.triageResult.priority]
  })

  const stats = {
    total: patients.length,
    critical: patients.filter(p => p.triageResult.priority === 'CRITICAL').length,
    high: patients.filter(p => p.triageResult.priority === 'HIGH').length,
    waiting: patients.filter(p => p.status === 'WAITING').length,
    inProgress: patients.filter(p => p.status === 'IN_PROGRESS').length,
    completed: patients.filter(p => p.status === 'COMPLETED').length,
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'WAITING':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock3, label: 'Menunggu' }
      case 'IN_PROGRESS':
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: Activity, label: 'Dalam Pelayanan' }
      case 'COMPLETED':
        return { bg: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle, label: 'Selesai' }
      default:
        return { bg: 'bg-slate-50 text-slate-600', icon: Clock, label: status }
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-600 text-white hover:bg-red-700'
      case 'HIGH':
        return 'bg-orange-500 text-white hover:bg-orange-600'
      case 'MEDIUM':
        return 'bg-yellow-500 text-white hover:bg-yellow-600'
      default:
        return 'bg-green-500 text-white hover:bg-green-600'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return AlertTriangle
      case 'HIGH': return Zap
      case 'MEDIUM': return Clock
      default: return CheckCircle
    }
  }

  const formatTime = (date: Date) => {
    const d = new Date(date)
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  const getWaitTime = (timestamp: Date) => {
    const diff = Math.floor((currentTime.getTime() - new Date(timestamp).getTime()) / 60000)
    if (diff < 1) return 'Baru'
    if (diff < 60) return `${diff} menit`
    const hours = Math.floor(diff / 60)
    return `${hours}j ${diff % 60}m`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard Antrian</h1>
            <p className="text-sm text-slate-500">
              {formatTime(currentTime)} · {stats.waiting} menunggu · {stats.inProgress} dalam pelayanan
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link to="/form">
            <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Stethoscope className="w-4 h-4" />
              Pasien Baru
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Total Pasien', value: stats.total, color: 'bg-slate-100 text-slate-700' },
          { label: 'Kritis', value: stats.critical, color: 'bg-red-100 text-red-700' },
          { label: 'Tinggi', value: stats.high, color: 'bg-orange-100 text-orange-700' },
          { label: 'Menunggu', value: stats.waiting, color: 'bg-amber-100 text-amber-700' },
          { label: 'Dilayani', value: stats.inProgress, color: 'bg-blue-100 text-blue-700' },
          { label: 'Selesai', value: stats.completed, color: 'bg-green-100 text-green-700' },
        ].map((stat, i) => (
          <div key={i} className={`rounded-xl p-3 ${stat.color}`}>
            <p className="text-xs font-medium opacity-75">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Filter className="w-4 h-4" />
          <span>Filter:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', 'WAITING', 'IN_PROGRESS', 'COMPLETED'] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {s === 'ALL' ? 'Semua Status' : s === 'WAITING' ? 'Menunggu' : s === 'IN_PROGRESS' ? 'Dilayani' : 'Selesai'}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 ml-0 sm:ml-4">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as PriorityFilter[]).map(p => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                priorityFilter === p
                  ? p === 'ALL' ? 'bg-slate-800 text-white' :
                    p === 'CRITICAL' ? 'bg-red-600 text-white' :
                    p === 'HIGH' ? 'bg-orange-500 text-white' :
                    p === 'MEDIUM' ? 'bg-yellow-500 text-white' :
                    'bg-green-500 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {p === 'ALL' ? 'Semua Prioritas' : p === 'CRITICAL' ? 'Kritis' : p === 'HIGH' ? 'Tinggi' : p === 'MEDIUM' ? 'Sedang' : 'Rendah'}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Cards */}
      <div className="space-y-3">
        {filteredPatients.map((patient, index) => {
          const statusCfg = getStatusConfig(patient.status)
          const StatusIcon = statusCfg.icon
          const PriorityIcon = getPriorityIcon(patient.triageResult.priority)

          return (
            <Card key={patient.id} className={`border shadow-sm hover:shadow-md transition-shadow ${
              patient.triageResult.priority === 'CRITICAL' ? 'border-red-200 bg-red-50/30' :
              patient.triageResult.priority === 'HIGH' ? 'border-orange-200 bg-orange-50/30' :
              patient.triageResult.priority === 'MEDIUM' ? 'border-yellow-200 bg-yellow-50/30' :
              'border-slate-200 bg-white'
            }`}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Queue Number & Priority */}
                  <div className="flex items-center gap-3 min-w-fit">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold ${
                      patient.triageResult.priority === 'CRITICAL' ? 'bg-red-600 text-white' :
                      patient.triageResult.priority === 'HIGH' ? 'bg-orange-500 text-white' :
                      patient.triageResult.priority === 'MEDIUM' ? 'bg-yellow-500 text-white' :
                      'bg-green-500 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <Badge className={`${getPriorityBadge(patient.triageResult.priority)} text-xs`}>
                        <PriorityIcon className="w-3 h-3 mr-1" />
                        {patient.triageResult.priority === 'CRITICAL' ? 'KRITIS' :
                         patient.triageResult.priority === 'HIGH' ? 'TINGGI' :
                         patient.triageResult.priority === 'MEDIUM' ? 'SEDANG' : 'RENDAH'}
                      </Badge>
                      <p className="text-xs text-slate-500 mt-1">{patient.queueNumber}</p>
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{patient.name}</h3>
                      <span className="text-xs text-slate-500">
                        {patient.age}th · {patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                      <Badge variant="outline" className={`text-xs ${statusCfg.bg}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusCfg.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 truncate">{patient.complaint}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                      <span>BP: {patient.vitalSigns.bloodPressure}</span>
                      <span>HR: {patient.vitalSigns.heartRate} bpm</span>
                      <span>SpO2: {patient.vitalSigns.oxygenSaturation}%</span>
                      <span>Temp: {patient.vitalSigns.temperature}°C</span>
                    </div>
                  </div>

                  {/* Wait Time & Confidence */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2 lg:gap-1 min-w-fit">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Waktu Tunggu</p>
                      <p className="font-semibold text-slate-900">{getWaitTime(patient.timestamp)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">AI Confidence</p>
                      <p className="font-semibold text-emerald-600">{(patient.triageResult.confidence * 100).toFixed(0)}%</p>
                    </div>
                  </div>

                  {/* Blockchain Link */}
                  {patient.blockchainHash && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => window.open(patient.blockExplorerUrl, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Blockchain
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {filteredPatients.length === 0 && (
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Tidak ada pasien dalam antrian</p>
            <p className="text-sm text-slate-400 mt-1">Ubah filter atau tambahkan pasien baru</p>
          </div>
        )}
      </div>
    </div>
  )
}
