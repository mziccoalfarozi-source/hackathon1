'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ShieldCheck, ExternalLink, Search, CircleCheckBig,
  AlertTriangle, Zap, Clock, Check, Lock, Database, FileCheck,
  Copy, CheckCheck
} from 'lucide-react'
import { AUDIT_RECORDS } from '@/data/mock'
import { motion, AnimatePresence } from 'framer-motion'
import { StaggerContainer, StaggerItem, SlideUp } from '@/components/motion'

type PriorityFilter = 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export default function AuditTrail() {
  const [records] = useState(AUDIT_RECORDS)
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  const filteredRecords = records.filter(r => {
    if (priorityFilter !== 'ALL' && r.triagePriority !== priorityFilter) return false
    if (search && !r.patientName.toLowerCase().includes(search.toLowerCase()) &&
        !r.txHash.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedHash(id)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-600 text-white'
      case 'HIGH': return 'bg-orange-500 text-white'
      case 'MEDIUM': return 'bg-yellow-500 text-white'
      default: return 'bg-green-500 text-white'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'KRITIS'
      case 'HIGH': return 'TINGGI'
      case 'MEDIUM': return 'SEDANG'
      default: return 'RENDAH'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return AlertTriangle
      case 'HIGH': return Zap
      case 'MEDIUM': return Clock
      default: return Check
    }
  }

  const truncateHash = (hash: string, start = 10, end = 8) => {
    return `${hash.slice(0, start)}...${hash.slice(-end)}`
  }

  const formatTime = (date: Date) => {
    const d = new Date(date)
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const stats = {
    total: records.length,
    verified: records.filter(r => r.verified).length,
    critical: records.filter(r => r.triagePriority === 'CRITICAL').length,
    lastBlock: Math.max(...records.map(r => r.blockNumber)),
  }

  return (
    <div className="space-y-6">
      {/* Hero with Blockchain BG */}
      <div className="relative rounded-2xl overflow-hidden mb-8 h-48 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 flex items-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-400 rounded-full blur-[100px]" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-teal-400 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 px-6 sm:px-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Audit Trail Blockchain</h1>
              <p className="text-sm text-slate-400">Rekam medis tercatat immutable di Polygon</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 gap-1.5">
              <CircleCheckBig className="w-3 h-3" />
              Jaringan: Polygon Amoy Testnet
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 gap-1.5">
              <Database className="w-3 h-3" />
              Block Terakhir: {stats.lastBlock.toLocaleString()}
            </Badge>
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-400/30 gap-1.5">
              <Lock className="w-3 h-3" />
              {stats.verified}/{stats.total} Terverifikasi
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Transaksi', value: stats.total, icon: FileCheck, color: 'bg-slate-700 dark:bg-slate-700 text-white' },
          { label: 'Terverifikasi', value: stats.verified, icon: CircleCheckBig, color: 'bg-emerald-600 text-white' },
          { label: 'Kritis', value: stats.critical, icon: AlertTriangle, color: 'bg-red-600 text-white' },
          { label: 'Block Height', value: stats.lastBlock.toLocaleString(), icon: Database, color: 'bg-blue-600 text-white' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <StaggerItem key={i}>
              <div className={`rounded-xl p-4 ${stat.color} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}>
                <div className="flex items-center gap-2 mb-2 opacity-75">
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </StaggerItem>
          )
        })}
      </StaggerContainer>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama pasien atau tx hash..."
            className="pl-9 h-10"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as PriorityFilter[]).map(p => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                priorityFilter === p
                  ? p === 'ALL' ? 'bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900' :
                    p === 'CRITICAL' ? 'bg-red-600 text-white' :
                    p === 'HIGH' ? 'bg-orange-500 text-white' :
                    p === 'MEDIUM' ? 'bg-yellow-500 text-white' :
                    'bg-green-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {p === 'ALL' ? 'Semua' : getPriorityLabel(p)}
            </button>
          ))}
        </div>
      </div>

      {/* Records Table */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Waktu</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Pasien</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Aksi</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Prioritas</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Transaction Hash</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Block</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredRecords.map((record, i) => {
                  const PriorityIcon = getPriorityIcon(record.triagePriority)
                  const isExpanded = expandedId === record.id

                  return (
                    <React.Fragment key={record.id}>
                      <motion.tr
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-slate-50/50 dark:bg-slate-800/50' : ''
                        }`}
                        onClick={() => setExpandedId(isExpanded ? null : record.id)}
                      >
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {formatTime(record.timestamp)}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {record.patientName}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50">
                            {record.action}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`${getPriorityBadge(record.triagePriority)} text-xs gap-1`}>
                            <PriorityIcon className="w-3 h-3" />
                            {getPriorityLabel(record.triagePriority)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {truncateHash(record.txHash)}
                            </code>
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                copyToClipboard(record.txHash, record.id)
                              }}
                              className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {copiedHash === record.id ?
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> :
                                <Copy className="w-3.5 h-3.5" />
                              }
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                          {record.blockNumber.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          {record.verified ? (
                            <div className="flex items-center gap-1.5 text-emerald-600">
                              <CircleCheckBig className="w-4 h-4" />
                              <span className="text-xs font-medium">Terverifikasi</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-amber-600">
                              <Clock className="w-4 h-4" />
                              <span className="text-xs font-medium">Pending</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            onClick={e => {
                              e.stopPropagation()
                              window.open(`https://amoy.polygonscan.com/tx/${record.txHash}`, '_blank')
                            }}
                          >
                            <ExternalLink className="w-3 h-3" />
                            Explorer
                          </Button>
                        </td>
                      </motion.tr>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.tr
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700"
                          >
                            <td colSpan={8} className="py-4 px-4">
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Detail Transaksi</h4>
                                  <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">ID Audit</span>
                                      <span className="font-mono text-slate-700">{record.id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Waktu Blockchain</span>
                                      <span className="text-slate-700">{formatTime(record.timestamp)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Block Number</span>
                                      <span className="font-mono text-slate-700">{record.blockNumber.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Konfirmasi</span>
                                      <span className="text-emerald-600 font-medium">12 block confirmations</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Detail Triage</h4>
                                  <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Pasien</span>
                                      <span className="font-medium text-slate-700">{record.patientName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Prioritas AI</span>
                                      <Badge className={`${getPriorityBadge(record.triagePriority)} text-[10px]`}>
                                        {getPriorityLabel(record.triagePriority)}
                                      </Badge>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 block mb-1">Catatan:</span>
                                      <p className="text-slate-700 leading-relaxed">{record.details}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Full Hash */}
                              <div className="mt-3">
                                <h4 className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Transaction Hash Lengkap</h4>
                                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg p-2.5 border border-slate-200 dark:border-slate-700">
                                  <code className="text-xs font-mono text-slate-600 dark:text-slate-400 flex-1 break-all">{record.txHash}</code>
                                  <button
                                    onClick={() => copyToClipboard(record.txHash, record.id + '_full')}
                                    className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                                  >
                                    {copiedHash === record.id + '_full' ?
                                      <CheckCheck className="w-4 h-4 text-emerald-500" /> :
                                      <Copy className="w-4 h-4" />
                                    }
                                  </button>
                                </div>
                              </div>

                              {/* Polygon Explorer Link */}
                              <div className="mt-3 flex items-center gap-2">
                                <Button
                                  size="sm"
                                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => window.open(`https://amoy.polygonscan.com/tx/${record.txHash}`, '_blank')}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  Lihat di Polygon Explorer
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2"
                                  onClick={() => window.open(`https://amoy.polygonscan.com/block/${record.blockNumber}`, '_blank')}
                                >
                                  <Database className="w-4 h-4" />
                                  Lihat Block
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        )}

                    </AnimatePresence>
                  </React.Fragment>
                )
              })}
            </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Tidak ada data audit</p>
            <p className="text-sm text-slate-400 mt-1">Ubah filter atau lakukan pencarian lain</p>
          </div>
        )}
      </Card>

      {/* How Blockchain Audit Works */}
      <Card className="mt-6 border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="w-5 h-5 text-emerald-600" />
            Bagaimana Audit Trail Blockchain Bekerja
          </CardTitle>
          <CardDescription>
            Setiap keputusan triase dicatat secara immutable di blockchain Polygon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: FileCheck,
                title: 'Hash Data',
                desc: 'Data pasien di-hash menggunakan SHA-256 untuk menghasilkan fingerprint unik.',
                color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50',
              },
              {
                icon: Database,
                title: 'Simpan On-Chain',
                desc: 'Hash disimpan di smart contract di jaringan Polygon untuk biaya gas yang minimal.',
                color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/50',
              },
              {
                icon: ShieldCheck,
                title: 'Verifikasi',
                desc: 'Setiap transaksi diverifikasi oleh validator jaringan Polygon dalam hitungan detik.',
                color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/50',
              },
              {
                icon: Lock,
                title: 'Immutable',
                desc: 'Data tidak dapat diubah atau dihapus, audit trail permanen dan transparan.',
                color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/50',
              },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mx-auto mb-3`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
