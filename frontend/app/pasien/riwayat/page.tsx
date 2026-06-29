"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Pill,
  History,
  ArrowLeft,
  X,
  Stethoscope,
  Heart,
  Thermometer,
  Wind,
  HeartPulse,
  ClipboardList,
  Activity,
  AlertCircle,
  Search,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

interface VisitRecord {
  id: string;
  rawId: string;
  date: string;
  month: string;
  year: string;
  doctor: string;
  diagnosis: string;
  txHash: string;
  prescriptions: {
    name: string;
    dosage: string;
    frequency: string;
    duration?: string;
    notes?: string;
  }[];
  vitalSigns: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
    respiratoryRate?: number;
  } | null;
  complaint: string;
}

export default function RiwayatPage() {
  const { user } = useAuth();
  const [visitHistory, setVisitHistory] = useState<VisitRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState<VisitRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user?.id) return;

    const fetchHistory = async () => {
      setIsLoading(true);

      // Find patient
      let { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!patient && user.name) {
        const { data: patientByName } = await supabase
          .from("patients")
          .select("id")
          .ilike("name", user.name.trim())
          .is("user_id", null)
          .maybeSingle();
        if (patientByName) patient = patientByName;
      }

      if (!patient) {
        setIsLoading(false);
        return;
      }

      const { data: visits } = await supabase
        .from("visits")
        .select(
          `id, created_at, diagnosis, blockchain_hash, complaint,
          users!doctor_id (name),
          prescriptions!visit_id (medication_name, dosage, frequency, duration, notes),
          vital_signs!visit_id (blood_pressure, heart_rate, temperature, oxygen_saturation, respiratory_rate)`
        )
        .eq("patient_id", patient.id)
        .eq("status", "COMPLETED")
        .order("created_at", { ascending: false });

      if (visits) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setVisitHistory(visits.map((v: any) => {
          const doctor = Array.isArray(v.users) ? v.users[0] : v.users;
          const vitalsRaw = Array.isArray(v.vital_signs) ? v.vital_signs[0] : v.vital_signs;
          const prescriptionsRaw = Array.isArray(v.prescriptions) ? v.prescriptions : [];
          const dateObj = new Date(v.created_at);

          return {
            id: v.id.slice(0, 8).toUpperCase(),
            rawId: v.id,
            date: dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
            month: dateObj.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
            year: dateObj.getFullYear().toString(),
            doctor: doctor?.name || "-",
            diagnosis: v.diagnosis || "-",
            complaint: v.complaint || "-",
            txHash: v.blockchain_hash
              ? v.blockchain_hash.slice(0, 10) + "..." + v.blockchain_hash.slice(-6)
              : "-",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            prescriptions: prescriptionsRaw.map((rx: any) => ({
              name: rx.medication_name,
              dosage: rx.dosage,
              frequency: rx.frequency,
              duration: rx.duration || undefined,
              notes: rx.notes || undefined,
            })),
            vitalSigns: vitalsRaw
              ? {
                  bloodPressure: vitalsRaw.blood_pressure || undefined,
                  heartRate: vitalsRaw.heart_rate || undefined,
                  temperature: vitalsRaw.temperature || undefined,
                  oxygenSaturation: vitalsRaw.oxygen_saturation || undefined,
                  respiratoryRate: vitalsRaw.respiratory_rate || undefined,
                }
              : null,
          };
        }));
      }

      setIsLoading(false);
    };

    fetchHistory();
  }, [user?.id]);

  // Filter by search
  const filtered = visitHistory.filter((v) =>
    v.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.complaint.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by month-year
  const grouped = filtered.reduce<Record<string, VisitRecord[]>>((acc, visit) => {
    const key = visit.month;
    if (!acc[key]) acc[key] = [];
    acc[key].push(visit);
    return acc;
  }, {});

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Link href="/pasien">
          <Button variant="outline" size="icon" className="rounded-xl shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-500" />
            Riwayat Medis Lengkap
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Memuat..." : `${visitHistory.length} total kunjungan`}
          </p>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cari diagnosis, dokter, atau keluhan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 rounded-xl"
        />
      </motion.div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-sm">Memuat riwayat kunjungan...</p>
        </div>
      ) : visitHistory.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
            <History className="w-8 h-8 text-emerald-400 opacity-60" />
          </div>
          <p className="text-base font-medium">Belum ada riwayat kunjungan</p>
          <p className="text-sm text-center max-w-xs">Riwayat kunjungan yang sudah selesai akan muncul di sini.</p>
          <Link href="/pasien">
            <Button variant="outline" className="mt-2">Kembali ke Dashboard</Button>
          </Link>
        </motion.div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3"
        >
          <Search className="w-10 h-10 opacity-30" />
          <p className="text-sm font-medium">Tidak ada hasil untuk &ldquo;{searchQuery}&rdquo;</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="space-y-8"
        >
          {Object.entries(grouped).map(([month, records], groupIdx) => (
            <div key={month}>
              {/* Month header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <CalendarDays className="w-4 h-4" />
                  {month}
                </div>
                <div className="flex-1 h-px bg-border" />
                <Badge variant="outline" className="text-[10px] font-medium">
                  {records.length} kunjungan
                </Badge>
              </div>

              {/* Timeline */}
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

                <div className="space-y-3 pl-10">
                  {records.map((record, idx) => (
                    <motion.div
                      key={record.rawId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: groupIdx * 0.05 + idx * 0.04 }}
                      className="relative"
                    >
                      {/* Timeline dot */}
                      <div className="absolute -left-[calc(1.5rem+1px)] top-4 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background shadow-sm" />

                      <Card
                        className="border-border hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => {
                          setSelectedVisit(record);
                          setIsDetailOpen(true);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-[11px] text-muted-foreground">{record.date}</p>
                                {record.txHash !== "-" && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                                    <ShieldCheck className="w-2.5 h-2.5" /> Terverifikasi
                                  </span>
                                )}
                              </div>
                              <h3 className="font-semibold text-sm text-foreground mb-0.5 truncate">
                                {record.diagnosis}
                              </h3>
                              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                <Stethoscope className="w-3 h-3" />
                                dr. {record.doctor}
                              </p>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {record.prescriptions.length > 0 && (
                                  <Badge variant="outline" className="text-[10px] bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-900">
                                    <Pill className="w-2.5 h-2.5 mr-1" />
                                    {record.prescriptions.length} Obat
                                  </Badge>
                                )}
                                {record.vitalSigns && (
                                  <Badge variant="outline" className="text-[10px] bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200">
                                    <Activity className="w-2.5 h-2.5 mr-1" />
                                    Ada Vital Signs
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── Visit Detail Bottom Sheet Modal ── */}
      <AnimatePresence>
        {isDetailOpen && selectedVisit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
            onClick={() => setIsDetailOpen(false)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="bg-card border border-border rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle (mobile) */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 bg-border rounded-full" />
              </div>

              {/* Header */}
              <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-5 py-4 flex items-start justify-between z-10">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">{selectedVisit.date}</p>
                  <h2 className="text-base font-bold text-foreground leading-tight">{selectedVisit.diagnosis}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5" />
                    dr. {selectedVisit.doctor}
                  </p>
                </div>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Keluhan */}
                {selectedVisit.complaint && selectedVisit.complaint !== "-" && (
                  <div>
                    <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5" /> Keluhan Utama
                    </h3>
                    <p className="text-sm text-foreground bg-muted/50 rounded-xl p-3 border border-border leading-relaxed">
                      {selectedVisit.complaint}
                    </p>
                  </div>
                )}

                {/* Vital Signs */}
                {selectedVisit.vitalSigns && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5" /> Tanda-Tanda Vital
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedVisit.vitalSigns.bloodPressure && (
                          <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-xl p-3 flex items-center gap-2.5">
                            <Heart className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <div>
                              <p className="text-[10px] text-muted-foreground">Tekanan Darah</p>
                              <p className="text-sm font-bold text-foreground">{selectedVisit.vitalSigns.bloodPressure} mmHg</p>
                            </div>
                          </div>
                        )}
                        {selectedVisit.vitalSigns.heartRate != null && selectedVisit.vitalSigns.heartRate > 0 && (
                          <div className="bg-pink-50 dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900/50 rounded-xl p-3 flex items-center gap-2.5">
                            <HeartPulse className="w-4 h-4 text-pink-500 flex-shrink-0" />
                            <div>
                              <p className="text-[10px] text-muted-foreground">Denyut Jantung</p>
                              <p className="text-sm font-bold text-foreground">{selectedVisit.vitalSigns.heartRate} bpm</p>
                            </div>
                          </div>
                        )}
                        {selectedVisit.vitalSigns.temperature != null && selectedVisit.vitalSigns.temperature > 0 && (
                          <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 rounded-xl p-3 flex items-center gap-2.5">
                            <Thermometer className="w-4 h-4 text-orange-500 flex-shrink-0" />
                            <div>
                              <p className="text-[10px] text-muted-foreground">Suhu Tubuh</p>
                              <p className="text-sm font-bold text-foreground">{selectedVisit.vitalSigns.temperature} °C</p>
                            </div>
                          </div>
                        )}
                        {selectedVisit.vitalSigns.oxygenSaturation != null && selectedVisit.vitalSigns.oxygenSaturation > 0 && (
                          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl p-3 flex items-center gap-2.5">
                            <Wind className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <div>
                              <p className="text-[10px] text-muted-foreground">SpO2</p>
                              <p className="text-sm font-bold text-foreground">{selectedVisit.vitalSigns.oxygenSaturation}%</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Resep Dokter */}
                <Separator />
                <div>
                  <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5" /> Resep Dokter
                  </h3>
                  {selectedVisit.prescriptions.length === 0 ? (
                    <div className="flex items-center justify-center py-6 text-muted-foreground gap-2 border border-dashed border-border rounded-xl">
                      <Pill className="w-5 h-5 opacity-40" />
                      <p className="text-sm">Tidak ada resep pada kunjungan ini</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedVisit.prescriptions.map((rx, idx) => (
                        <div key={idx} className="border border-border rounded-xl p-3.5 bg-violet-50/50 dark:bg-violet-950/20">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                {idx + 1}
                              </span>
                              <p className="font-semibold text-sm text-foreground">{rx.name}</p>
                            </div>
                            <Badge variant="outline" className="text-[10px] bg-white dark:bg-background shrink-0">
                              {rx.frequency}
                            </Badge>
                          </div>
                          <div className="ml-7 space-y-0.5">
                            <p className="text-xs text-muted-foreground">
                              Dosis: <span className="text-foreground font-medium">{rx.dosage}</span>
                            </p>
                            {rx.duration && (
                              <p className="text-xs text-muted-foreground">
                                Durasi: <span className="text-foreground font-medium">{rx.duration}</span>
                              </p>
                            )}
                            {rx.notes && (
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-start gap-1">
                                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                {rx.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Blockchain Verification */}
                {selectedVisit.txHash !== "-" && (
                  <>
                    <Separator />
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-3 flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Terverifikasi Blockchain</p>
                        <p className="text-[11px] text-muted-foreground font-mono truncate">Tx: {selectedVisit.txHash}</p>
                      </div>
                    </div>
                  </>
                )}

                <div className="pb-2">
                  <Button onClick={() => setIsDetailOpen(false)} className="w-full" variant="outline">
                    Tutup
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
