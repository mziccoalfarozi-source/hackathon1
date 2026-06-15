'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  AlertTriangle, Clock, CircleCheckBig,
  ArrowRight, Stethoscope, FlaskConical
} from 'lucide-react'
import { useQueue } from '@/contexts/QueueContext'
import { useAuth } from '@/contexts/AuthContext'
import { StaggerContainer, StaggerItem, SlideUp } from '@/components/motion'
import { motion } from 'framer-motion'

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
      <SlideUp>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Dokter</h1>
        <p className="text-sm text-muted-foreground mt-1">Selamat datang, {user?.name}</p>
      </SlideUp>

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4" staggerDelay={0.08}>
        {[
          { icon: Clock, label: 'Menunggu', value: waitingPatients.length, iconBg: 'bg-amber-100 dark:bg-amber-950/50', iconColor: 'text-amber-600 dark:text-amber-400', valueColor: 'text-amber-600 dark:text-amber-400' },
          { icon: Stethoscope, label: 'Sedang Diperiksa', value: inProgressPatients.length, iconBg: 'bg-blue-100 dark:bg-blue-950/50', iconColor: 'text-blue-600 dark:text-blue-400', valueColor: 'text-blue-600 dark:text-blue-400' },
          { icon: CircleCheckBig, label: 'Selesai', value: completedToday.length, iconBg: 'bg-green-100 dark:bg-green-950/50', iconColor: 'text-green-600 dark:text-green-400', valueColor: 'text-green-600 dark:text-green-400' },
          { icon: FlaskConical, label: 'Dirujuk Farmasi', value: referredToPharmacy.length, iconBg: 'bg-violet-100 dark:bg-violet-950/50', iconColor: 'text-violet-600 dark:text-violet-400', valueColor: 'text-violet-600 dark:text-violet-400' },
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
                      <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                    </div>
                    <p className={`text-2xl font-bold ${stat.valueColor}`}>{stat.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            </StaggerItem>
          )
        })}
      </StaggerContainer>

      {/* Quick Action */}
      <SlideUp delay={0.2}>
      <Link href="/dokter/antrian">
        <motion.div whileHover={{ y: -4 }}>
          <Card className="border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 hover:shadow-lg transition-all group cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg"
              >
                <Stethoscope className="w-6 h-6 text-white" />
              </motion.div>
              <div className="flex-1">
                <h3 className="font-semibold text-card-foreground">Lihat Antrian Pasien</h3>
                <p className="text-xs text-muted-foreground">{waitingPatients.length} pasien menunggu pemeriksaan</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </CardContent>
          </Card>
        </motion.div>
      </Link>
      </SlideUp>

      {/* Urgent Patients */}
      {waitingPatients.filter(p => p.triageResult.priority === 'CRITICAL' || p.triageResult.priority === 'HIGH').length > 0 && (
        <Card className="border-red-200 dark:border-red-900/50 shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Pasien Urgen Perlu Penanganan Segera
            </h3>
            <div className="space-y-3">
              {waitingPatients
                .filter(p => p.triageResult.priority === 'CRITICAL' || p.triageResult.priority === 'HIGH')
                .map(patient => (
                  <Link key={patient.id} href={`/dokter/periksa/${patient.id}`}>
                    <div className={`flex items-center gap-4 p-3 rounded-xl hover:shadow-sm transition-all cursor-pointer ${
                      patient.triageResult.priority === 'CRITICAL' ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50' : 'bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50'
                    }`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                        patient.triageResult.priority === 'CRITICAL' ? 'bg-red-600' : 'bg-orange-500'
                      }`}>
                        {patient.queueNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-card-foreground">{patient.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{patient.complaint}</p>
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
      <SlideUp delay={0.4}>
      <Card className="shadow-sm">
        <CardContent className="p-5">
          <h3 className="font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            Semua Pasien Menunggu
          </h3>
          <div className="space-y-2">
            {waitingPatients.map((patient, i) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + i * 0.07 }}
              >
              <Link href={`/dokter/periksa/${patient.id}`}>
                <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                    patient.triageResult.priority === 'CRITICAL' ? 'bg-red-600' :
                    patient.triageResult.priority === 'HIGH' ? 'bg-orange-500' :
                    patient.triageResult.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}>
                    {patient.queueNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-foreground">{patient.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{patient.complaint}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{patient.age}th · {patient.gender === 'L' ? 'L' : 'P'}</p>
                    <p>SpO2: {patient.vitalSigns.oxygenSaturation}%</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </Link>
              </motion.div>
            ))}
            {waitingPatients.length === 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-muted-foreground text-center py-8"
              >
                Tidak ada pasien menunggu
              </motion.p>
            )}
          </div>
        </CardContent>
      </Card>
      </SlideUp>
    </div>
  )
}
