"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SlideUp } from "@/components/motion";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCircle2,
  Activity,
  Clock,
  ShieldCheck,
  QrCode,
  Pill,
  History,
  AlertCircle,
  FileText,
  MapPin,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  X,
  Stethoscope,
  Heart,
  Thermometer,
  Wind,
  HeartPulse,
  ClipboardList,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface VisitRecord {
  id: string;
  rawId: string;
  date: string;
  doctor: string;
  diagnosis: string;
  txHash: string;
  prescriptions: { name: string; dosage: string; frequency: string; duration?: string; notes?: string }[];
  vitalSigns: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
    respiratoryRate?: number;
  } | null;
  complaint: string;
}

export default function PasienDashboard() {
  const { user, changePassword } = useAuth();

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Detail visit modal state
  const [selectedVisit, setSelectedVisit] = useState<VisitRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Real data states
  const [patientData, setPatientData] = useState<{
    name: string;
    age: number;
    nik?: string;
    bpjs?: string;
    faskes?: string;
    address: string;
  } | null>(null);

  const [activeQueue, setActiveQueue] = useState<{
    queueNumber: string;
    status: string;
    priorityLabel: string;
    estimatedWait: string;
    recommendedAction: string;
    pharmacyStatus?: string;
  } | null>(null);

  const [pharmacyPrescriptions, setPharmacyPrescriptions] = useState<
    { name: string; dosage: string; frequency: string }[]
  >([]);

  const [visitHistory, setVisitHistory] = useState<VisitRecord[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Password dan konfirmasi password tidak sama");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    if (!user?.id) {
      toast.error("User tidak ditemukan");
      return;
    }
    const res = await changePassword(user.id, newPassword);
    if (res.success) {
      toast.success("Password berhasil diubah!");
      setIsPasswordModalOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      setShowPassword(false);
    } else {
      toast.error(res.error || "Gagal mengubah password");
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const fetchAll = async () => {
      setIsLoadingData(true);

      let { data: patient } = await supabase
        .from("patients")
        .select("id, name, age, nik, bpjs_number, faskes, address")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!patient && user.name) {
        const { data: patientByName } = await supabase
          .from("patients")
          .select("id, name, age, nik, bpjs_number, faskes, address")
          .ilike("name", user.name.trim())
          .is("user_id", null)
          .maybeSingle();

        if (patientByName) {
          patient = patientByName;
          await supabase
            .from("patients")
            .update({ user_id: user.id })
            .eq("id", patientByName.id);
        }
      }

      if (patient) {
        setPatientData({
          name: patient.name,
          age: patient.age || 0,
          nik: patient.nik || undefined,
          bpjs: patient.bpjs_number || undefined,
          faskes: patient.faskes || undefined,
          address: patient.address,
        });

        // Active queue
        const { data: activeVisit } = await supabase
          .from("visits")
          .select(
            `id, queue_number, status, pharmacy_status,
            triage_results!visit_id (priority_label, estimated_wait_time, recommended_action),
            prescriptions!visit_id (medication_name, dosage, frequency)`
          )
          .eq("patient_id", patient.id)
          .in("status", ["WAITING", "IN_PROGRESS"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activeVisit) {
          const triage = Array.isArray(activeVisit.triage_results)
            ? activeVisit.triage_results[0]
            : activeVisit.triage_results;

          setActiveQueue({
            queueNumber: activeVisit.queue_number,
            status: activeVisit.status === "WAITING" ? "Menunggu Dokter" : "Sedang Diperiksa",
            priorityLabel: triage?.priority_label || "-",
            estimatedWait: triage?.estimated_wait_time || "-",
            recommendedAction: triage?.recommended_action || "-",
            pharmacyStatus: activeVisit.pharmacy_status || undefined,
          });

          if (activeVisit.pharmacy_status) {
            const prescriptions = Array.isArray(activeVisit.prescriptions) ? activeVisit.prescriptions : [];
            setPharmacyPrescriptions(
              prescriptions.map((rx: { medication_name: string; dosage: string; frequency: string }) => ({
                name: rx.medication_name,
                dosage: rx.dosage,
                frequency: rx.frequency,
              }))
            );
          }
        }

        // Visit history — with prescriptions & vital signs
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
          setVisitHistory(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            visits.map((v: any) => {
              const doctor = Array.isArray(v.users) ? v.users[0] : v.users;
              const vitalsRaw = Array.isArray(v.vital_signs) ? v.vital_signs[0] : v.vital_signs;
              const prescriptionsRaw = Array.isArray(v.prescriptions) ? v.prescriptions : [];

              return {
                id: v.id.slice(0, 8).toUpperCase(),
                rawId: v.id,
                date: new Date(v.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }),
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
            })
          );
        }
      }

      setIsLoadingData(false);
    };

    fetchAll();
  }, [user?.id]);

  const pharmacyStatusLabel = (status?: string) => {
    if (status === "COMPLETED") return "Obat Siap Diambil";
    if (status === "PROCESSING") return "Sedang Disiapkan Farmasi";
    return "Menunggu Konfirmasi Farmasi";
  };

  const pharmacyStatusDesc = (status?: string) => {
    if (status === "COMPLETED") return "Obat Anda telah siap. Silakan ambil di loket farmasi.";
    if (status === "PROCESSING") return "Obat Anda sedang diracik. Kami akan memberi tahu jika sudah siap.";
    return "Resep Anda sedang menunggu konfirmasi dari pihak farmasi.";
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Profile Summary */}
      <SlideUp>
        <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white overflow-hidden relative border-none shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <CardContent className="p-6 md:p-8 relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner border border-white/30">
                  <UserCircle2 className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    Halo, {isLoadingData ? "..." : user?.name || patientData?.name || "Pasien"}!
                  </h1>
                  <p className="text-blue-100 font-medium mt-1 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    {patientData?.age ? `${patientData.age} Tahun` : ""}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 md:mt-0">
                {/* Change Password Dialog */}
                <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                  <DialogTrigger asChild>
                    <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 flex items-center gap-3 shadow-sm hover:bg-white/20 transition-colors cursor-pointer group">
                      <div className="bg-white/20 p-1.5 rounded-lg group-hover:bg-white/30 transition-colors">
                        <KeyRound className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-sm text-left">
                        <p className="font-semibold text-white group-hover:text-cyan-100 transition-colors">Ganti Password</p>
                        <p className="text-blue-200 text-xs">Akun Anda</p>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-blue-600" /> Ganti Password
                      </DialogTitle>
                      <DialogDescription>Masukkan password baru untuk akun Anda.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">Password Baru</Label>
                        <div className="relative">
                          <Input
                            id="new-password"
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Minimal 6 karakter"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Konfirmasi Password</Label>
                        <div className="relative">
                          <Input
                            id="confirm-password"
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Ketik ulang password baru"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)}>Batal</Button>
                      <Button onClick={handlePasswordChange} className="bg-blue-600 hover:bg-blue-700">Simpan Password</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </SlideUp>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Live Queue Tracker */}
          <SlideUp delay={0.1}>
            <Card className="border-blue-100 dark:border-blue-900/50 shadow-md">
              <CardHeader className="pb-3 border-b border-border bg-blue-50/50 dark:bg-blue-950/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 text-blue-900 dark:text-blue-100">
                    <Clock className="w-5 h-5 text-blue-500" /> Status Layanan Hari Ini
                  </CardTitle>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300">Live</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {isLoadingData ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Memuat data antrian...</span>
                  </div>
                ) : activeQueue === null ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                    <History className="w-10 h-10 opacity-30" />
                    <p className="text-sm font-medium">Tidak ada antrian aktif saat ini</p>
                    <p className="text-xs text-center max-w-xs">
                      Lakukan check-in di loket atau tunjukkan QR Code untuk mendapatkan nomor antrian.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col md:flex-row gap-8 items-center justify-between mb-8">
                      <div className="text-center md:text-left">
                        <p className="text-sm text-muted-foreground font-medium mb-1">Nomor Antrian Anda</p>
                        <div className="text-5xl font-bold text-foreground tracking-tight">{activeQueue.queueNumber}</div>
                        <div className="mt-3 flex items-center justify-center md:justify-start gap-2">
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            Prioritas: {activeQueue.priorityLabel}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex-1 w-full bg-blue-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50 text-center relative overflow-hidden">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"
                        />
                        <p className="text-sm text-muted-foreground mb-1">Status</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">{activeQueue.status}</p>
                        <p className="text-sm font-medium text-foreground">
                          Estimasi Giliran:{" "}
                          <span className="text-emerald-600 dark:text-emerald-400">{activeQueue.estimatedWait}</span>
                        </p>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-3 text-sm text-muted-foreground">
                      <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p>{activeQueue.recommendedAction}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </SlideUp>

          {/* Pharmacy Status */}
          <SlideUp delay={0.2}>
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Pill className="w-5 h-5 text-violet-500" /> Status E-Resep & Obat
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isLoadingData ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Memuat resep...</span>
                  </div>
                ) : !activeQueue?.pharmacyStatus ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-3">
                    <Pill className="w-10 h-10 opacity-30" />
                    <p className="text-sm font-medium">Belum ada resep aktif saat ini</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-foreground">{pharmacyStatusLabel(activeQueue.pharmacyStatus)}</h3>
                        <p className="text-sm text-muted-foreground">{pharmacyStatusDesc(activeQueue.pharmacyStatus)}</p>
                      </div>
                    </div>
                    {pharmacyPrescriptions.length > 0 && (
                      <div className="space-y-3">
                        {pharmacyPrescriptions.map((rx, i) => (
                          <div key={i} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border border-border">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-md flex items-center justify-center text-xs font-bold">
                                {i + 1}
                              </div>
                              <div>
                                <p className="font-medium text-foreground text-sm">{rx.name}</p>
                                <p className="text-xs text-muted-foreground">{rx.dosage}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-background">{rx.frequency}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </SlideUp>
        </div>

        <div className="space-y-6">
          {/* Data Pribadi */}
          <SlideUp delay={0.3}>
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-500" /> Data Administrasi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1 text-xs font-medium">Nomor Induk Kependudukan (NIK)</p>
                  <p className="font-semibold text-foreground">{isLoadingData ? "..." : patientData?.nik || "Tidak terdaftar"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs font-medium">Nomor Kartu BPJS</p>
                  <p className="font-semibold text-foreground">{isLoadingData ? "..." : patientData?.bpjs || "Tidak terdaftar"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs font-medium">Asal Faskes</p>
                  <p className="font-medium text-foreground">{isLoadingData ? "..." : patientData?.faskes || "Tidak terdaftar"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Alamat Domisili
                  </p>
                  <p className="text-foreground leading-relaxed">{isLoadingData ? "..." : patientData?.address || "-"}</p>
                </div>
              </CardContent>
            </Card>
          </SlideUp>

          {/* Riwayat Medis — clickable, dibatasi 3 */}
          <SlideUp delay={0.4}>
            <Card className="shadow-sm border-border bg-gradient-to-b from-card to-slate-50 dark:to-slate-900/20">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" /> Riwayat Medis
                  </CardTitle>
                  {visitHistory.length > 0 && (
                    <Link
                      href="/pasien/riwayat"
                      className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                    >
                      Lihat Semua
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {isLoadingData ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Memuat riwayat...</span>
                  </div>
                ) : visitHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-3">
                    <History className="w-10 h-10 opacity-30" />
                    <p className="text-sm font-medium">Belum ada riwayat kunjungan</p>
                  </div>
                ) : (
                  <>
                    {visitHistory.slice(0, 3).map((record, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedVisit(record);
                          setIsDetailOpen(true);
                        }}
                        className="group border border-border bg-card p-4 rounded-xl hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-muted-foreground">
                            {record.date}
                          </Badge>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <h4 className="font-semibold text-sm text-foreground mb-1">{record.diagnosis}</h4>
                        <p className="text-xs text-muted-foreground mb-2">dr. {record.doctor}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {record.prescriptions.length > 0 && (
                            <Badge variant="outline" className="text-[10px] bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-900">
                              <Pill className="w-2.5 h-2.5 mr-1" />
                              {record.prescriptions.length} Obat
                            </Badge>
                          )}
                          {record.txHash !== "-" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/50">
                              <ShieldCheck className="w-2.5 h-2.5" /> Terverifikasi
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground ml-auto">Ketuk untuk detail →</span>
                        </div>
                      </motion.div>
                    ))}
                    {visitHistory.length > 3 && (
                      <Link href="/pasien/riwayat">
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer text-sm font-medium"
                        >
                          <History className="w-4 h-4" />
                          Lihat {visitHistory.length - 3} kunjungan lainnya
                          <ArrowRight className="w-4 h-4" />
                        </motion.div>
                      </Link>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </SlideUp>
        </div>
      </div>

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
                        <div
                          key={idx}
                          className="border border-border rounded-xl p-3.5 bg-violet-50/50 dark:bg-violet-950/20"
                        >
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
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
