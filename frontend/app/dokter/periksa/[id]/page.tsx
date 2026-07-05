"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Toaster, toast } from "sonner";
import {
  User,
  Heart,
  Thermometer,
  Wind,
  HeartPulse,
  Clock,
  Brain,
  Stethoscope,
  ArrowLeft,
  Plus,
  Trash2,
  Send,
  FlaskConical,
  AlertTriangle,
  Link2,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import type { Prescription, EsiLevel } from "@/types";
import { useQueue } from "@/contexts/QueueContext";
import { useAuth } from "@/contexts/AuthContext";
import { SYMPTOM_OPTIONS, ESI_CONFIG } from "@/data/mock";
import { callConfirmTriage } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { logTriageToBlockchain, connectWallet, toBasisPoints } from "@/lib/blockchain";

export default function PeriksaPasien() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const { user } = useAuth();
  const { getPatientById, assignDoctor, addDiagnosisAndPrescription, updatePatientTriage } =
    useQueue();
  const patient = getPatientById(id || "");

  const [diagnosis, setDiagnosis] = useState("");
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([
    {
      id: "1",
      medicationName: "",
      dosage: "",
      frequency: "",
      duration: "",
      notes: "",
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAssigned, setIsAssigned] = useState(false);
  
  // ESI Confirmation State
  const initialEsi = patient?.triageResult?.esi_level || 4;
  const [finalEsi, setFinalEsi] = useState<EsiLevel>(initialEsi as EsiLevel);
  const [isEsiChanged, setIsEsiChanged] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);

  if (!patient) {
    return (
      <div className="text-center py-20">
        <Stethoscope className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground font-medium">
          Pasien tidak ditemukan
        </p>
        <Button
          variant="outline"
          onClick={() => router.push("/dokter")}
          className="mt-4 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Button>
      </div>
    );
  }

  const handleAssign = async () => {
    if (!user) return;
    await assignDoctor(patient.id, user.id, user.name);
    setIsAssigned(true);
    toast.success("Pasien telah diambil untuk diperiksa");
  };

  const addPrescription = () => {
    setPrescriptions((prev) => [
      ...prev,
      {
        id: Date.now().toString(36),
        medicationName: "",
        dosage: "",
        frequency: "",
        duration: "",
        notes: "",
      },
    ]);
  };

  const removePrescription = (id: string) => {
    if (prescriptions.length <= 1) return;
    setPrescriptions((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePrescription = (
    id: string,
    field: keyof Prescription,
    value: string,
  ) => {
    setPrescriptions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  const handleSubmit = async () => {
    if (!diagnosis) {
      toast.error("Mohon isi diagnosis");
      return;
    }
    const validPrescriptions = prescriptions.filter(
      (p) => p.medicationName && p.dosage,
    );
    if (validPrescriptions.length === 0) {
      toast.error("Mohon isi minimal 1 resep obat");
      return;
    }
    if (isEsiChanged && !doctorNotes) {
      toast.error("Mohon berikan alasan perubahan ESI level");
      return;
    }

    setIsSubmitting(true);
    toast.loading("Mencatat ke Blockchain & Menyimpan data...", { duration: 1500, id: 'submit' });
    
    try {
      // 1. Panggil API backend (mock) untuk simpan data
      const confirmRes = await callConfirmTriage(patient.id, {
        tier_final: finalEsi,
        diubah_dokter: isEsiChanged,
        dokter_id: user?.id || 'doc-1',
        doctor_notes: doctorNotes
      });

      let realTxHash = confirmRes.tx_hash_final;
      try {
        await connectWallet();
        // Asumsi: Dokter memiliki wewenang mencatat 'DOKTER CONFIRM' ke Smart Contract yang sama
        const bcResult = await logTriageToBlockchain(
          `${patient.id}-FINAL`,
          patient.name,
          finalEsi === 1 ? 'CRITICAL' : finalEsi === 2 ? 'HIGH' : finalEsi === 3 ? 'MEDIUM' : 'LOW',
          toBasisPoints(patient.triageResult.confidence), // Pakai confidence dari AI awal
          "DOKTER CONFIRM"
        );
        realTxHash = bcResult.txHash;
        toast.success(`Konfirmasi dokter tercatat di blockchain! Block #${bcResult.blockNumber}`);
      } catch (bcErr: any) {
        const errMsg = bcErr?.message || String(bcErr);
        const lowerErr = errMsg.toLowerCase();
        
        if (lowerErr.includes("user rejected")) {
           toast.error("Pencatatan blockchain dibatalkan. Transaksi wajib dikonfirmasi!");
        } else if (lowerErr.includes("insufficient funds") || lowerErr.includes("insufficient balance")) {
           toast.error("Saldo MATIC Amoy Anda tidak cukup untuk membayar biaya transaksi (Gas Fee)!");
        } else {
           toast.error(`Gagal konek MetaMask/Blockchain: ${errMsg}`);
           console.error("Blockchain log error:", bcErr);
        }
        // HENTIKAN proses jika blockchain gagal (wajib blockchain untuk Hackathon)
        setIsSubmitting(false);
        return;
      }

      // Update patient status in local context
      updatePatientTriage(patient.id, {
        tx_hash_final: realTxHash,
        blockchain_status: 'confirmed',
        triageResult: {
          ...patient.triageResult,
          esi_level: finalEsi // update ESI
        }
      });

      // 2. Lanjut ke farmasi
      await addDiagnosisAndPrescription(
        patient.id,
        diagnosis,
        validPrescriptions,
      );
      toast.dismiss('submit');
      toast.success("Log Final Blockchain tersimpan. Rujuk farmasi berhasil!");
      setTimeout(() => router.push("/dokter"), 1000);
    } catch {
      toast.dismiss('submit');
      toast.error("Gagal menyimpan. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSymptomLabel = (val: string) =>
    SYMPTOM_OPTIONS.find((s) => s.value === val)?.label || val;

  const isHandledByMe = patient.doctorId === user?.id || isAssigned;
  const needsAssignment = patient.status === "WAITING" && !isHandledByMe;
  
  const currentEsiCfg = ESI_CONFIG[patient.triageResult.esi_level as EsiLevel || 4];
  const finalEsiCfg = ESI_CONFIG[finalEsi];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dokter")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard
        </Button>
      </div>

      {/* Patient Status Banner */}
      {needsAssignment && (
        <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 shadow-md animate-pulse">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500" />
              <div>
                <p className="font-bold text-amber-800 dark:text-amber-400 text-lg">
                  Pasien Belum Ditangani
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-500">
                  Klik tombol untuk mengambil alih pemeriksaan pasien ini
                </p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={handleAssign}
              className="bg-amber-600 hover:bg-amber-700 gap-2 w-full sm:w-auto"
            >
              <Stethoscope className="w-5 h-5" />
              Tangani Pasien Sekarang
            </Button>
          </CardContent>
        </Card>
      )}

      {/* CDSS Disclaimer Alert */}
      <div className="bg-indigo-50/80 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/50 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-xl h-fit w-fit shrink-0">
            <ShieldCheck className="w-6 h-6 text-indigo-700 dark:text-indigo-400" />
          </div>
          <div>
            <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 flex items-center gap-2 text-base mb-1">
              Disclaimer Clinical Decision Support System (CDSS)
            </h4>
            <p className="text-sm text-indigo-800/80 dark:text-indigo-400/80 leading-relaxed max-w-4xl">
              Sistem ini merupakan alat bantu keputusan klinis (CDSS) berbasis kecerdasan buatan dan <strong className="text-indigo-900 dark:text-indigo-300">bukan pengganti penilaian medis profesional</strong>. Segala rekomendasi triase dan saran tindakan medis wajib ditinjau, divalidasi, dan dikonfirmasi secara independen oleh dokter yang bertugas sebelum dicatat sebagai keputusan final ke dalam rekam medis dan blockchain.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Patient Info (read-only) */}
        <div className="lg:col-span-1 space-y-4">
          {/* Priority */}
          <Card className={`border-2 ${currentEsiCfg.bgLight} border-${currentEsiCfg.color.replace('bg-', '')}/30`}>
            <CardContent className="p-6 text-center">
              <Badge className={`text-sm mb-3 px-3 py-1 ${currentEsiCfg.badge} border-transparent`}>
                ESI {patient.triageResult.esi_level || 4} - {currentEsiCfg.label}
              </Badge>
              <p className="text-3xl font-black text-card-foreground">
                {patient.queueNumber}
              </p>
              <p className="text-sm font-medium mt-2">
                {patient.name} ({patient.age} thn)
              </p>
              {patient.tx_hash_initial && (
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Link2 className="w-3 h-3" /> Initial Log: {patient.tx_hash_initial.substring(0,8)}...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vital Signs */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                Data Klinis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <span className="text-muted-foreground block mb-1">Keluhan Utama</span>
                <p className="font-medium bg-muted p-2 rounded">{patient.complaint}</p>
              </div>
              <div className="grid grid-cols-2 gap-y-3">
                <div><p className="text-muted-foreground text-xs">BP</p><p className="font-medium">{patient.vitalSigns.bloodPressure || '-'}</p></div>
                <div><p className="text-muted-foreground text-xs">HR</p><p className="font-medium">{patient.vitalSigns.heartRate || '-'} bpm</p></div>
                <div><p className="text-muted-foreground text-xs">SpO2</p><p className="font-medium">{patient.vitalSigns.oxygenSaturation || '-'}%</p></div>
                <div><p className="text-muted-foreground text-xs">RR</p><p className="font-medium">{patient.vitalSigns.respiratoryRate || '-'} /m</p></div>
                <div><p className="text-muted-foreground text-xs">Temp</p><p className="font-medium">{patient.vitalSigns.temperature || '-'} °C</p></div>
                <div><p className="text-muted-foreground text-xs">GCS</p><p className="font-medium">{patient.vitalSigns.gcstotal || '-'}</p></div>
              </div>
              <div className="bg-blue-50/50 dark:bg-blue-900/10 p-2 rounded-lg border border-blue-100 dark:border-blue-900 grid grid-cols-3 text-center">
                <div><p className="text-[10px] text-blue-600/70">MAP</p><p className="font-bold text-blue-700 dark:text-blue-400">{patient.vitalSigns.map || '-'}</p></div>
                <div><p className="text-[10px] text-blue-600/70">Shock Index</p><p className="font-bold text-blue-700 dark:text-blue-400">{patient.vitalSigns.shockIndex || '-'}</p></div>
                <div><p className="text-[10px] text-blue-600/70">NEWS2</p><p className="font-bold text-blue-700 dark:text-blue-400">{patient.vitalSigns.news2Score ?? '-'}</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Diagnosis & Prescription Form */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* AI Reasoning & SHAP */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="w-5 h-5 text-violet-600" />
                AI Triage Interpretability
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm leading-relaxed text-foreground">
                  {patient.triageResult.reasoning_text || patient.triageResult.reasoning.join('. ')}
                </p>
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900/50">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-500 mb-1">Rekomendasi Tindakan:</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">{patient.triageResult.recommendedAction}</p>
                </div>
              </div>
              
              {/* SHAP Chart */}
              {patient.triageResult.shap_features && patient.triageResult.shap_features.length > 0 && (
                <div className="h-[300px] border border-border rounded-xl p-3 bg-muted/30">
                  <p className="text-xs font-semibold text-center mb-2 text-muted-foreground">SHAP Feature Importance</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={patient.triageResult.shap_features.map(f => ({ name: f.label, value: Math.abs(f.shap_value), isNeg: f.shap_value < 0 }))}
                      margin={{ left: 0, right: 0, top: 10, bottom: 90 }}
                    >
                      <XAxis type="category" dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={100} />
                      <YAxis type="number" hide />
                      <Tooltip formatter={(v: number) => [v.toFixed(2), 'Impact']} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {patient.triageResult.shap_features.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.shap_value < 0 ? '#ef4444' : '#f59e0b'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Konfirmasi ESI */}
          <Card className="shadow-sm border-emerald-200 dark:border-emerald-900/50">
            <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emerald-600" />
                Konfirmasi Level Triase ESI
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Level AI: <Badge variant="outline">ESI {initialEsi}</Badge></p>
                  <p className="text-xs text-muted-foreground">Silakan tinjau dan konfirmasi level yang sesuai.</p>
                </div>
                <div className="flex gap-2">
                  {([1,2,3,4,5] as EsiLevel[]).map(esi => {
                    const c = ESI_CONFIG[esi];
                    return (
                      <button
                        key={esi}
                        disabled={needsAssignment}
                        onClick={() => {
                          setFinalEsi(esi);
                          setIsEsiChanged(esi !== initialEsi);
                        }}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-all ${
                          finalEsi === esi ? `${c.badge} text-white shadow-md scale-110` : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {esi}
                      </button>
                    )
                  })}
                </div>
              </div>
              
              {isEsiChanged && (
                <div className="space-y-2 mt-4 animate-in fade-in slide-in-from-top-2">
                  <Label className="text-red-600 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Alasan Perubahan Level ESI *
                  </Label>
                  <Textarea
                    placeholder="Wajib diisi mengapa Anda mengubah prediksi AI..."
                    value={doctorNotes}
                    onChange={e => setDoctorNotes(e.target.value)}
                    disabled={needsAssignment}
                    className="border-red-200 focus-visible:ring-red-500"
                  />
                </div>
              )}

              <div className="mt-6 p-4 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex-1">
                    <h5 className="font-semibold text-sm text-indigo-950 dark:text-indigo-200">Validasi Keputusan Medis</h5>
                    <p className="text-xs text-indigo-800/70 dark:text-indigo-400/70 mt-1">
                      Sebagai dokter yang bertugas, saya telah meninjau rekomendasi AI dan bertanggung jawab penuh atas keputusan akhir triase ini.
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsConfirmed(!isConfirmed)}
                    variant={isConfirmed ? "default" : "outline"}
                    className={`gap-2 whitespace-nowrap shrink-0 transition-all ${
                      isConfirmed 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' 
                        : 'border-indigo-200 hover:bg-indigo-100 text-indigo-700 dark:border-indigo-800 dark:hover:bg-indigo-900 dark:text-indigo-300'
                    }`}
                    disabled={needsAssignment}
                  >
                    {isConfirmed ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    {isConfirmed ? "Telah Dikonfirmasi Dokter" : "Konfirmasi oleh Dokter"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Diagnosis */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-blue-600" />
                Diagnosis & Rencana Tindakan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="diagnosis">
                  Diagnosis Medis <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="diagnosis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Masukkan diagnosis kerja atau pasti..."
                  rows={3}
                  disabled={needsAssignment}
                />
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Resep Obat</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addPrescription}
                    disabled={needsAssignment}
                    className="gap-1 text-xs"
                  >
                    <Plus className="w-3 h-3" /> Tambah Obat
                  </Button>
                </div>

                <div className="space-y-4">
                  {prescriptions.map((rx, idx) => (
                    <div key={rx.id} className="bg-muted/30 rounded-xl p-4 border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-muted-foreground">Obat #{idx + 1}</span>
                        {prescriptions.length > 1 && (
                          <button onClick={() => removePrescription(rx.id)} className="text-red-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1 sm:col-span-2">
                          <Label className="text-xs">Nama Obat *</Label>
                          <Input value={rx.medicationName} onChange={e => updatePrescription(rx.id, "medicationName", e.target.value)} className="h-9" disabled={needsAssignment} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Dosis *</Label>
                          <Input value={rx.dosage} onChange={e => updatePrescription(rx.id, "dosage", e.target.value)} className="h-9" disabled={needsAssignment} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Frekuensi</Label>
                          <Input value={rx.frequency} onChange={e => updatePrescription(rx.id, "frequency", e.target.value)} className="h-9" disabled={needsAssignment} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || needsAssignment || !diagnosis || !isConfirmed}
                className={`w-full gap-2 h-12 text-lg transition-all ${
                  isConfirmed 
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md' 
                    : 'bg-muted text-muted-foreground cursor-not-allowed opacity-70'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses & Log Blockchain...
                  </>
                ) : (
                  <>
                    <Link2 className="w-5 h-5" />
                    Simpan Final Log & Selesai
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
