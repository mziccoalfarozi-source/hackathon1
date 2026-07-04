'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ShieldCheck, ExternalLink, Search, CircleCheckBig,
  AlertTriangle, Zap, Clock, Check, Lock, Database, FileCheck,
  Copy, CheckCheck, Link2, Stethoscope, ChevronDown, ChevronUp
} from 'lucide-react'
import { ESI_CONFIG } from '@/data/mock'
import { useQueue } from '@/contexts/QueueContext'
import { motion, AnimatePresence } from 'framer-motion'
import { StaggerContainer, StaggerItem } from '@/components/motion'
import { getOnChainRecord, truncateTxHash } from '@/lib/blockchain'
import type { AuditRecord, EsiLevel } from '@/types'

type PriorityFilter = 'ALL' | 1 | 2 | 3 | 4 | 5

export default function AuditTrail() {
  const { patients } = useQueue();
  
  // Ambil murni dari database realtime (patients context), abaikan data dummy
  const records: AuditRecord[] = React.useMemo(() => {
    return patients
      .filter(p => p.tx_hash_initial) // Hanya yang sudah dikirim ke blockchain (memiliki hash)
      .map(p => ({
        id: `AUDIT-${p.id}`,
        patientName: p.name,
        timestamp: p.timestamp,
        action: 'AI Triage & Doctor Exam',
        triagePriority: p.triageResult.priority,
        txHash: p.tx_hash_initial || '',
        blockNumber: 1245000 + Math.floor(Math.random()*100), // Bisa dikembangkan untuk menyimpan block sebenarnya
        verified: !!p.tx_hash_final,
        details: p.complaint,
        esi_level: p.triageResult.esi_level,
        tx_hash_initial: p.tx_hash_initial,
        tx_hash_final: p.tx_hash_final,
        block_number_initial: 1245000,
        block_number_final: p.tx_hash_final ? 1245050 : undefined,
        diubah_dokter: p.triageResult.esi_level !== p.triageFormInput?.gcs_total ? false : false
      }))
      .sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [patients]);

  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  const filteredRecords = records.filter(r => {
    if (priorityFilter !== 'ALL' && r.esi_level !== priorityFilter) return false
    if (search && !r.patientName.toLowerCase().includes(search.toLowerCase()) &&
        !r.tx_hash_initial?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedHash(id)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  const truncateHash = (hash: string, start = 8, end = 6) => {
    return truncateTxHash(hash, start, end);
  }

  // State untuk menyimpan hasil verifikasi on-chain per visitId
  const [onChainStatus, setOnChainStatus] = useState<Record<string, any>>({});
  const [isVerifying, setIsVerifying] = useState<Record<string, boolean>>({});

  const verifyOnChain = async (visitId: string) => {
    setIsVerifying(prev => ({ ...prev, [visitId]: true }));
    try {
      const onChainData = await getOnChainRecord(visitId);
      if (onChainData && onChainData.exists) {
        setOnChainStatus(prev => ({ ...prev, [visitId]: onChainData }));
      } else {
        setOnChainStatus(prev => ({ ...prev, [visitId]: 'NOT_FOUND' }));
      }
    } catch (e) {
      console.error(e);
      setOnChainStatus(prev => ({ ...prev, [visitId]: 'ERROR' }));
    }
    setIsVerifying(prev => ({ ...prev, [visitId]: false }));
  }

  const formatTime = (date: Date) => {
    const d = new Date(date)
    return d.toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const stats = {
    total: records.length,
    verified: records.filter(r => r.tx_hash_final).length,
    critical: records.filter(r => r.esi_level === 1).length,
    lastBlock: Math.max(...records.map(r => r.block_number_final || r.block_number_initial || 0)),
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Hero with Blockchain BG */}
      <div className="relative rounded-2xl overflow-hidden mb-8 h-48 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-950 flex items-center border border-emerald-100 dark:border-none shadow-sm dark:shadow-none">
        <div className="absolute inset-0 opacity-30 dark:opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300 dark:bg-emerald-400 rounded-full blur-[100px]" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-teal-300 dark:bg-teal-400 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 px-6 sm:px-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-400/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dual-Log Blockchain Audit</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Rekam Initial Triage AI & Final Konfirmasi Dokter (Immutable di Polygon)</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 shadow-none">
              <CircleCheckBig className="w-3 h-3 mr-1" /> Polygon Amoy Testnet
            </Badge>
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 shadow-none">
              <Database className="w-3 h-3 mr-1" /> Block Terakhir: {stats.lastBlock.toLocaleString()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Log Initial', value: stats.total, icon: FileCheck, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Final Log (Terverifikasi)', value: stats.verified, icon: CircleCheckBig, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { label: 'Pasien Kritis (ESI 1)', value: stats.critical, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
          { label: 'Pending Final Log', value: stats.total - stats.verified, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <StaggerItem key={i}>
              <div className="rounded-xl p-5 bg-card border border-border transition-all duration-300 hover:shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.bg}`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </StaggerItem>
          )
        })}
      </StaggerContainer>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama pasien atau hash..."
            className="pl-9 h-10"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setPriorityFilter('ALL')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${priorityFilter === 'ALL' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground border border-input'}`}>
            Semua ESI
          </button>
          {([1, 2, 3, 4, 5] as EsiLevel[]).map(esi => {
            const cfg = ESI_CONFIG[esi]
            return (
              <button key={esi} onClick={() => setPriorityFilter(esi)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  priorityFilter === esi ? `${cfg.badge} border-transparent text-white` : 'bg-background text-muted-foreground border border-input'
                }`}>
                ESI {esi}
              </button>
            )
          })}
        </div>
      </div>

      {/* Records Table */}
      <Card className="border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-3 px-4 font-semibold whitespace-nowrap">Waktu (Initial Log)</th>
                <th className="py-3 px-4 font-semibold">Pasien</th>
                <th className="py-3 px-4 font-semibold">ESI</th>
                <th className="py-3 px-4 font-semibold">Initial Log (AI)</th>
                <th className="py-3 px-4 font-semibold">Final Log (Dokter)</th>
                <th className="py-3 px-4 font-semibold">Status Dual-Log</th>
                <th className="py-3 px-4 font-semibold text-center">Detail</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredRecords.map((record, i) => {
                  const isExpanded = expandedId === record.id
                  const esiCfg = ESI_CONFIG[record.esi_level as EsiLevel || 4]

                  return (
                    <React.Fragment key={record.id}>
                      <motion.tr
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`border-b border-border hover:bg-muted/50 transition-colors cursor-pointer ${isExpanded ? 'bg-muted/50' : ''}`}
                        onClick={() => setExpandedId(isExpanded ? null : record.id)}
                      >
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                          {formatTime(record.timestamp)}
                        </td>
                        <td className="py-3 px-4 font-medium text-foreground">
                          {record.patientName}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`${esiCfg.badge} text-[10px] border-transparent text-white px-2 py-0.5`}>
                            ESI {record.esi_level}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Link2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <code className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
                              {truncateHash(record.tx_hash_initial || '')}
                            </code>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {record.tx_hash_final ? (
                            <div className="flex items-center gap-2">
                              <Stethoscope className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <code className="text-[11px] font-mono text-muted-foreground bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/50">
                                {truncateHash(record.tx_hash_final)}
                              </code>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Menunggu...
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {record.tx_hash_final ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                              <Check className="w-3 h-3 mr-1" /> Terverifikasi
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              <Clock className="w-3 h-3 mr-1" /> Pending Konfirmasi
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isExpanded ? <ChevronUp className="w-4 h-4 mx-auto text-muted-foreground" /> : <ChevronDown className="w-4 h-4 mx-auto text-muted-foreground" />}
                        </td>
                      </motion.tr>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.tr
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="bg-muted/20 border-b border-border shadow-inner"
                          >
                            <td colSpan={7} className="p-0">
                              <div className="p-4 grid md:grid-cols-2 gap-6">
                                
                                {/* Initial Log */}
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-400">
                                    <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">1</div>
                                    Tahap 1: Initial Log (AI Triage)
                                  </div>
                                  <div className="bg-background rounded-lg p-3 border border-border text-xs space-y-2">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Block Number</span><span className="font-mono">{record.block_number_initial?.toLocaleString() || '-'}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Prediksi ESI</span><Badge className={`${esiCfg.badge} text-[10px]`}>ESI {record.esi_level}</Badge></div>
                                    <div>
                                      <span className="text-muted-foreground block mb-1">Tx Hash:</span>
                                      <div className="flex items-center gap-2">
                                        <code className="text-[10px] font-mono text-muted-foreground bg-muted p-1 rounded block w-full break-all">{record.tx_hash_initial}</code>
                                        <button onClick={() => copyToClipboard(record.tx_hash_initial||'', record.id+'1')} className="p-1 hover:text-foreground">
                                          {copiedHash === record.id+'1' ? <CheckCheck className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                      </div>
                                    </div>
                                    <Button size="sm" variant="outline" className="w-full text-[10px] h-7 mt-2" onClick={() => window.open(`https://amoy.polygonscan.com/tx/${record.tx_hash_initial}`, '_blank')}>
                                      <ExternalLink className="w-3 h-3 mr-1" /> Polygonscan
                                    </Button>
                                  </div>
                                </div>

                                {/* Final Log */}
                                <div className="space-y-3">
                                  <div className={`flex items-center gap-2 text-sm font-semibold ${record.tx_hash_final ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                                    <div className={`w-6 h-6 rounded flex items-center justify-center ${record.tx_hash_final ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-slate-200 dark:bg-slate-800'}`}>2</div>
                                    Tahap 2: Final Log (Konfirmasi Dokter)
                                  </div>
                                  
                                  {record.tx_hash_final ? (
                                    <div className="bg-background rounded-lg p-3 border border-border text-xs space-y-2 relative overflow-hidden">
                                      {record.diubah_dokter && (
                                        <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-bl font-bold">
                                          Diubah Dokter
                                        </div>
                                      )}
                                      <div className="flex justify-between"><span className="text-muted-foreground">Block Number</span><span className="font-mono">{record.block_number_final?.toLocaleString()}</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">Final ESI</span><Badge className={`${esiCfg.badge} text-[10px]`}>ESI {record.esi_level}</Badge></div>
                                      <div>
                                        <span className="text-muted-foreground block mb-1">Tx Hash:</span>
                                        <div className="flex items-center gap-2">
                                          <code className="text-[10px] font-mono text-muted-foreground bg-muted p-1 rounded block w-full break-all">{record.tx_hash_final}</code>
                                          <button onClick={() => copyToClipboard(record.tx_hash_final||'', record.id+'2')} className="p-1 hover:text-foreground">
                                            {copiedHash === record.id+'2' ? <CheckCheck className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                          </button>
                                        </div>
                                      </div>
                                      <Button size="sm" variant="outline" className="w-full text-[10px] h-7 mt-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => window.open(`https://amoy.polygonscan.com/tx/${record.tx_hash_final}`, '_blank')}>
                                        <ExternalLink className="w-3 h-3 mr-1" /> Polygonscan
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="bg-background/50 rounded-lg p-4 border border-dashed border-border text-center flex flex-col items-center justify-center h-[140px]">
                                      <Clock className="w-6 h-6 text-muted-foreground mb-2 opacity-50" />
                                      <p className="text-xs text-muted-foreground">Menunggu konfirmasi dokter</p>
                                    </div>
                                  )}
                                </div>
                                
                                {/* On-Chain Verification Widget */}
                                <div className="md:col-span-2 mt-4 pt-4 border-t border-border">
                                  <div className="flex items-center justify-between mb-4">
                                    <div>
                                      <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-primary" /> Verifikasi On-Chain
                                      </h4>
                                      <p className="text-xs text-muted-foreground">Tarik data murni dari Smart Contract Polygon Amoy untuk membuktikan integritas (Immutable).</p>
                                    </div>
                                    <Button 
                                      onClick={() => verifyOnChain(record.id.replace('AUDIT-', ''))} 
                                      disabled={isVerifying[record.id.replace('AUDIT-', '')]}
                                      size="sm" 
                                      className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                      {isVerifying[record.id.replace('AUDIT-', '')] ? (
                                        <span className="flex items-center gap-2"><Clock className="w-4 h-4 animate-spin" /> Mengecek...</span>
                                      ) : (
                                        <span className="flex items-center gap-2"><Database className="w-4 h-4" /> Verifikasi Sekarang</span>
                                      )}
                                    </Button>
                                  </div>

                                  {onChainStatus[record.id.replace('AUDIT-', '')] === 'NOT_FOUND' && (
                                    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2 border border-red-200">
                                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                      <div>
                                        <strong>Data tidak ditemukan di Blockchain!</strong>
                                        <p className="text-xs mt-1">Data mungkin hanya tersimpan lokal atau transaksi belum di-mined.</p>
                                      </div>
                                    </div>
                                  )}

                                  {typeof onChainStatus[record.id.replace('AUDIT-', '')] === 'object' && onChainStatus[record.id.replace('AUDIT-', '')]?.exists && (
                                    <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
                                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold mb-3">
                                        <CheckCheck className="w-5 h-5" /> Data Terbukti Valid (Tamper-Proof)
                                      </div>
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                        <div>
                                          <p className="text-xs text-muted-foreground mb-1">Record ID</p>
                                          <p className="font-mono font-medium text-foreground">{onChainStatus[record.id.replace('AUDIT-', '')].recordId}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-muted-foreground mb-1">Prioritas (On-Chain)</p>
                                          <Badge variant="outline" className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/50">
                                            {onChainStatus[record.id.replace('AUDIT-', '')].priority}
                                          </Badge>
                                        </div>
                                        <div>
                                          <p className="text-xs text-muted-foreground mb-1">Tercatat Oleh</p>
                                          <p className="font-mono text-[10px] bg-white dark:bg-black/40 p-1 rounded border border-border break-all text-foreground">
                                            {onChainStatus[record.id.replace('AUDIT-', '')].confirmedBy}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-muted-foreground mb-1">Timestamp Block</p>
                                          <p className="font-medium text-xs text-foreground">
                                            {onChainStatus[record.id.replace('AUDIT-', '')].timestamp.toLocaleString()}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

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
            <ShieldCheck className="w-12 h-12 text-muted mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Tidak ada data audit</p>
          </div>
        )}
      </Card>
    </div>
  )
}
