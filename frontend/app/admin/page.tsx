'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users, UserRoundPlus, ListOrdered, FileSearch, AlertTriangle,
  Clock, CircleCheckBig, ArrowRight, HeartPulse, TrendingUp
} from 'lucide-react'
import { useQueue } from '@/contexts/QueueContext'
import { StaggerContainer, StaggerItem, SlideUp } from '@/components/motion'
import { motion } from 'framer-motion'

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
      <SlideUp>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">Kelola pendaftaran dan antrian pasien Vitas</p>
      </SlideUp>

      {/* Quick Actions */}
      <StaggerContainer className="grid sm:grid-cols-2 gap-4" staggerDelay={0.1}>
        <StaggerItem>
          <Link href="/admin/input-pasien">
            <motion.div whileHover={{ y: -4 }}>
              <Card className="border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 hover:shadow-lg transition-all group cursor-pointer">
                <CardContent className="p-5 flex items-center gap-4">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg"
                  >
                    <UserRoundPlus className="w-6 h-6 text-white" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-card-foreground">Input Pasien Baru</h3>
                    <p className="text-xs text-muted-foreground">Daftarkan pasien dan analisis triage AI</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </motion.div>
          </Link>
        </StaggerItem>
        <StaggerItem>
          <Link href="/admin/antrian">
            <motion.div whileHover={{ y: -4 }}>
              <Card className="border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 hover:shadow-lg transition-all group cursor-pointer">
                <CardContent className="p-5 flex items-center gap-4">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg"
                  >
                    <ListOrdered className="w-6 h-6 text-white" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-card-foreground">Lihat Antrian</h3>
                    <p className="text-xs text-muted-foreground">{stats.waiting} pasien menunggu</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </motion.div>
          </Link>
        </StaggerItem>
      </StaggerContainer>

      {/* Stats Grid */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4" staggerDelay={0.08}>
        {[
          { icon: Users, label: 'Total Pasien', value: stats.total, iconBg: 'bg-muted', iconColor: 'text-muted-foreground', valueColor: 'text-card-foreground' },
          { icon: AlertTriangle, label: 'Kritis', value: stats.critical, iconBg: 'bg-red-100 dark:bg-red-950/50', iconColor: 'text-red-600 dark:text-red-400', valueColor: 'text-red-600 dark:text-red-400' },
          { icon: Clock, label: 'Menunggu', value: stats.waiting, iconBg: 'bg-amber-100 dark:bg-amber-950/50', iconColor: 'text-amber-600 dark:text-amber-400', valueColor: 'text-amber-600 dark:text-amber-400' },
          { icon: CircleCheckBig, label: 'Selesai', value: stats.completed, iconBg: 'bg-green-100 dark:bg-green-950/50', iconColor: 'text-green-600 dark:text-green-400', valueColor: 'text-green-600 dark:text-green-400' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <StaggerItem key={stat.label}>
              <motion.div whileHover={{ y: -3 }}>
                <Card className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-9 h-9 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${stat.iconColor}`} />
                      </div>
                      <span className="text-xs text-slate-500 font-medium">{stat.label}</span>
                    </div>
                    <p className={`text-2xl font-bold ${stat.valueColor}`}>{stat.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            </StaggerItem>
          )
        })}
      </StaggerContainer>

      {/* Priority Breakdown */}
      <SlideUp delay={0.3}>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
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
                  <div className="h-2 rounded-full bg-muted mb-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.total > 0 ? (item.count / stats.total) * 100 : 0}%` }}
                      transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
                      className={`h-full rounded-full ${item.color}`}
                    />
                  </div>
                  <Badge className={`${item.lightColor} text-xs`}>{item.label}: {item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </SlideUp>

      {/* Recent Patients */}
      <SlideUp delay={0.4}>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-muted-foreground" />
                Pasien Terbaru
              </h3>
              <Link href="/admin/antrian">
                <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700">
                  Lihat Semua <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {recentPatients.map((patient, i) => (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + i * 0.08 }}
                  className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white ${patient.triageResult.priority === 'CRITICAL' ? 'bg-red-500' :
                      patient.triageResult.priority === 'HIGH' ? 'bg-orange-500' :
                        patient.triageResult.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}>
                    {patient.queueNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-foreground truncate">{patient.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{patient.complaint}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${patient.status === 'WAITING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      patient.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-green-50 text-green-700 border-green-200'
                    }`}>
                    {patient.status === 'WAITING' ? 'Menunggu' : patient.status === 'IN_PROGRESS' ? 'Diperiksa' : 'Selesai'}
                  </Badge>
                </motion.div>
              ))}
              {recentPatients.length === 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-slate-400 text-center py-8"
                >
                  Belum ada pasien
                </motion.p>
              )}
            </div>
          </CardContent>
        </Card>
      </SlideUp>
    </div>
  )
}
