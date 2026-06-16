"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SlideUp } from "@/components/motion";
import { motion } from "framer-motion";
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
  Search,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
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
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function PasienDashboard() {
  const [activeTab, setActiveTab] = useState<"queue" | "history">("queue");
  const { user, changePassword } = useAuth();

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

  const [visitHistory, setVisitHistory] = useState<
    {
      id: string;
      date: string;
      doctor: string;
      diagnosis: string;
      txHash: string;
    }[]
  >([]);

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

      // 1. Fetch patient master data — cari dulu by user_id
      let { data: patient } = await supabase
        .from("patients")
        .select("id, name, age, nik, bpjs_number, faskes, address")
        .eq("user_id", user.id)
        .maybeSingle();

      // Fallback: jika user_id belum terhubung (data lama), cari berdasarkan nama
      if (!patient && user.name) {
        const { data: patientByName } = await supabase
          .from("patients")
          .select("id, name, age, nik, bpjs_number, faskes, address")
          .ilike("name", user.name.trim())
          .is("user_id", null)
          .maybeSingle();

        if (patientByName) {
          patient = patientByName;
          // Otomatis tautkan user_id agar next login langsung ketemu
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

        // 2. Fetch active queue (WAITING or IN_PROGRESS)
        const { data: activeVisit } = await supabase
          .from("visits")
          .select(
            `
            id, queue_number, status, pharmacy_status,
            triage_results!visit_id (priority_label, estimated_wait_time, recommended_action),
            prescriptions!visit_id (medication_name, dosage, frequency)
          `,
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
            status:
              activeVisit.status === "WAITING"
                ? "Menunggu Dokter"
                : "Sedang Diperiksa",
            priorityLabel: triage?.priority_label || "-",
            estimatedWait: triage?.estimated_wait_time || "-",
            recommendedAction: triage?.recommended_action || "-",
            pharmacyStatus: activeVisit.pharmacy_status || undefined,
          });

          if (activeVisit.pharmacy_status) {
            const prescriptions = Array.isArray(activeVisit.prescriptions)
              ? activeVisit.prescriptions
              : [];
            setPharmacyPrescriptions(
              prescriptions.map(
                (rx: {
                  medication_name: string;
                  dosage: string;
                  frequency: string;
                }) => ({
                  name: rx.medication_name,
                  dosage: rx.dosage,
                  frequency: rx.frequency,
                }),
              ),
            );
          }
        }

        // 3. Fetch visit history (COMPLETED)
        const { data: visits } = await supabase
          .from("visits")
          .select(
            `
            id, created_at, diagnosis, blockchain_hash,
            users!doctor_id (name)
          `,
          )
          .eq("patient_id", patient.id)
          .eq("status", "COMPLETED")
          .order("created_at", { ascending: false });

        if (visits) {
          setVisitHistory(
            visits.map(
              (v: {
                id: string;
                created_at: string;
                diagnosis: string;
                blockchain_hash?: string;
                users?: { name: string } | { name: string }[];
              }) => {
                const doctor = Array.isArray(v.users) ? v.users[0] : v.users;
                return {
                  id: v.id.slice(0, 8).toUpperCase(),
                  date: new Date(v.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }),
                  doctor: doctor?.name || "-",
                  diagnosis: v.diagnosis || "-",
                  txHash: v.blockchain_hash
                    ? v.blockchain_hash.slice(0, 10) +
                      "..." +
                      v.blockchain_hash.slice(-6)
                    : "-",
                };
              },
            ),
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
    if (status === "COMPLETED")
      return "Obat Anda telah siap. Silakan ambil di loket farmasi.";
    if (status === "PROCESSING")
      return "Obat Anda sedang diracik. Kami akan memberi tahu jika sudah siap.";
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
                    Halo,{" "}
                    {isLoadingData
                      ? "..."
                      : user?.name || patientData?.name || "Pasien"}
                    !
                  </h1>
                  <p className="text-blue-100 font-medium mt-1 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    {patientData?.age ? `${patientData.age} Tahun` : ""}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 md:mt-0">
                <Dialog
                  open={isPasswordModalOpen}
                  onOpenChange={setIsPasswordModalOpen}
                >
                  <DialogTrigger asChild>
                    <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 flex items-center gap-3 shadow-sm hover:bg-white/20 transition-colors cursor-pointer group">
                      <div className="bg-white/20 p-1.5 rounded-lg group-hover:bg-white/30 transition-colors">
                        <KeyRound className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-sm text-left">
                        <p className="font-semibold text-white group-hover:text-cyan-100 transition-colors">
                          Ganti Password
                        </p>
                        <p className="text-blue-200 text-xs">Akun Anda</p>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-blue-600" />
                        Ganti Password
                      </DialogTitle>
                      <DialogDescription>
                        Masukkan password baru untuk akun Anda.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2 relative">
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
                      <div className="space-y-2 relative">
                        <Label htmlFor="confirm-password">
                          Konfirmasi Password
                        </Label>
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
                      <Button
                        variant="outline"
                        onClick={() => setIsPasswordModalOpen(false)}
                      >
                        Batal
                      </Button>
                      <Button
                        onClick={handlePasswordChange}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Simpan Password
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 flex items-center gap-3 shadow-sm hover:bg-white/20 transition-colors cursor-pointer group">
                  <div className="bg-white p-1.5 rounded-lg">
                    <QrCode className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                  </div>
                  <div className="text-sm text-left">
                    <p className="font-semibold text-white group-hover:text-cyan-100 transition-colors">
                      Tunjukkan QR
                    </p>
                    <p className="text-blue-200 text-xs">Untuk Check-in</p>
                  </div>
                </div>
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
                    <Clock className="w-5 h-5 text-blue-500" />
                    Status Layanan Hari Ini
                  </CardTitle>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300">
                    Live
                  </Badge>
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
                    <p className="text-sm font-medium">
                      Tidak ada antrian aktif saat ini
                    </p>
                    <p className="text-xs text-center max-w-xs">
                      Lakukan check-in di loket atau tunjukkan QR Code untuk
                      mendapatkan nomor antrian.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col md:flex-row gap-8 items-center justify-between mb-8">
                      <div className="text-center md:text-left">
                        <p className="text-sm text-muted-foreground font-medium mb-1">
                          Nomor Antrian Anda
                        </p>
                        <div className="text-5xl font-bold text-foreground tracking-tight">
                          {activeQueue.queueNumber}
                        </div>
                        <div className="mt-3 flex items-center justify-center md:justify-start gap-2">
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-700 border-amber-200"
                          >
                            Prioritas: {activeQueue.priorityLabel}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex-1 w-full bg-blue-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50 text-center relative overflow-hidden">
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"
                        />
                        <p className="text-sm text-muted-foreground mb-1">
                          Status
                        </p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                          {activeQueue.status}
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          Estimasi Giliran:{" "}
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {activeQueue.estimatedWait}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* AI Transparency Alert */}
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
                  <Pill className="w-5 h-5 text-violet-500" />
                  Status E-Resep & Obat
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
                    <p className="text-sm font-medium">
                      Belum ada resep aktif saat ini
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-foreground">
                          {pharmacyStatusLabel(activeQueue.pharmacyStatus)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {pharmacyStatusDesc(activeQueue.pharmacyStatus)}
                        </p>
                      </div>
                    </div>

                    {pharmacyPrescriptions.length > 0 && (
                      <div className="space-y-3">
                        {pharmacyPrescriptions.map((rx, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border border-border"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-md flex items-center justify-center text-xs font-bold">
                                {i + 1}
                              </div>
                              <div>
                                <p className="font-medium text-foreground text-sm">
                                  {rx.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {rx.dosage}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-background">
                              {rx.frequency}
                            </Badge>
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
          {/* Data Pribadi (Side Panel) */}
          <SlideUp delay={0.3}>
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-500" />
                  Data Administrasi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1 text-xs font-medium">
                    Nomor Induk Kependudukan (NIK)
                  </p>
                  <p className="font-semibold text-foreground">
                    {isLoadingData
                      ? "..."
                      : patientData?.nik || "Tidak terdaftar"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs font-medium">
                    Nomor Kartu BPJS
                  </p>
                  <p className="font-semibold text-foreground">
                    {isLoadingData
                      ? "..."
                      : patientData?.bpjs || "Tidak terdaftar"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs font-medium">
                    Asal Faskes
                  </p>
                  <p className="font-medium text-foreground">
                    {isLoadingData
                      ? "..."
                      : patientData?.faskes || "Tidak terdaftar"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Alamat Domisili
                  </p>
                  <p className="text-foreground leading-relaxed">
                    {isLoadingData ? "..." : patientData?.address || "-"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </SlideUp>

          {/* Blockchain History */}
          <SlideUp delay={0.4}>
            <Card className="shadow-sm border-border bg-gradient-to-b from-card to-slate-50 dark:to-slate-900/20">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  Riwayat Medis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {isLoadingData ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Memuat riwayat...</span>
                  </div>
                ) : visitHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-3">
                    <History className="w-10 h-10 opacity-30" />
                    <p className="text-sm font-medium">
                      Belum ada riwayat kunjungan
                    </p>
                  </div>
                ) : (
                  visitHistory.map((record, i) => (
                    <div
                      key={i}
                      className="group relative border border-border bg-card p-4 rounded-xl hover:border-emerald-200 dark:hover:border-emerald-900/50 hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-slate-100 dark:bg-slate-800 text-muted-foreground"
                        >
                          {record.date}
                        </Badge>
                        <ShieldCheck className="w-4 h-4 text-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h4 className="font-semibold text-sm text-foreground mb-1">
                        {record.diagnosis}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        {record.doctor}
                      </p>
                      {record.txHash !== "-" && (
                        <a
                          href="#"
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded transition-colors"
                        >
                          <Search className="w-3 h-3" />
                          Tx: {record.txHash}
                        </a>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </SlideUp>
        </div>
      </div>
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
