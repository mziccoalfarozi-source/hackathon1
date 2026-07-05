"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Toaster, toast } from "sonner";
import {
  User,
  Heart,
  Thermometer,
  Wind,
  HeartPulse,
  Clock,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Send,
  Check,
  Brain,
  CircleCheckBig,
  Search,
} from "lucide-react";
import type { PatientData, QueuePatient, RegisteredPatient, TriageFormInput } from "@/types";
import {
  INITIAL_PATIENT_DATA,
  computeDerivedFeatures,
  ESI_CONFIG
} from "@/data/mock";
import { useQueue } from "@/contexts/QueueContext";
import { usePatients } from "@/contexts/PatientContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { SlideUp } from "@/components/motion";
import { callTriageApi, callSkipCritical, callParseText, type ParseTextResult } from "@/lib/api";
import { MessageSquareText, Sparkles, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { logTriageToBlockchain, connectWallet, toBasisPoints } from "@/lib/blockchain";

export default function InputPasien() {
  const router = useRouter();
  const { addPatient, patients } = useQueue();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patient, setPatient] = useState<PatientData>({
    ...INITIAL_PATIENT_DATA,
  });
  
  // Triage form input state
  const [triageInput, setTriageInput] = useState<Partial<TriageFormInput>>({
    gcs_total: 15,
    pain_score: 0,
    mental_status_triage: 'alert',
    riwayat_kronis_berulang: false
  });

  const [showResult, setShowResult] = useState(false);
  const [lastAdded, setLastAdded] = useState<QueuePatient | null>(null);

  // NLP Parser state
  const [nlpText, setNlpText] = useState("");
  const [nlpResult, setNlpResult] = useState<ParseTextResult | null>(null);
  const [isParsingNlp, setIsParsingNlp] = useState(false);
  const [showNlpInput, setShowNlpInput] = useState(false);

  const totalSteps = 2;

  const { searchPatients, addRegisteredPatient } = usePatients();
  const { register } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [mode, setMode] = useState<"search" | "add">("search");
  const [newPatient, setNewPatient] = useState({
    name: "",
    dob: "",
    gender: "L" as "L" | "P",
    nik: "",
    bpjs: "",
    faskes: "",
    phone: "",
    address: "",
    email: "",
    password: "",
  });

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSelectPatient = (pt: RegisteredPatient) => {
    setPatient((prev) => ({
      ...prev,
      id: pt.id,
      name: pt.name,
      age: pt.age,
      gender: pt.gender,
      nik: pt.nik || "",
      phone: pt.phone,
      address: pt.address,
    }));
    setTriageInput(prev => ({ ...prev, patient_id: pt.id, age: pt.age }));
    setStep(2);
  };

  const handleSubmitNewPatient = async () => {
    try {
      const registerResult = await register(
        newPatient.name,
        newPatient.email,
        newPatient.password,
        "pasien",
      );

      if (!registerResult.success) {
        toast.error(registerResult.error || "Gagal membuat akun pasien.");
        return;
      }

      const added = await addRegisteredPatient({
        name: newPatient.name,
        dob: newPatient.dob,
        age: calculateAge(newPatient.dob),
        gender: newPatient.gender,
        nik: newPatient.nik,
        bpjs: newPatient.bpjs,
        faskes: newPatient.faskes || undefined,
        phone: newPatient.phone,
        address: newPatient.address,
        userId: registerResult.userId,
      });
      toast.success("Pasien baru berhasil didaftarkan dan akun dibuat!");
      setMode("search");
      setSearchQuery(added.name);
      setNewPatient({
        name: "", dob: "", gender: "L", nik: "", bpjs: "", faskes: "", phone: "", address: "", email: "", password: "",
      });
    } catch (err) {
      toast.error("Gagal mendaftarkan pasien. Silakan coba lagi.");
      console.error("addRegisteredPatient error:", err);
    }
  };

  const updateTriageInput = (field: keyof TriageFormInput, value: string | number | boolean) => {
    setTriageInput((prev) => ({ ...prev, [field]: value }));
  };

  const { map, shock_index, news2 } = computeDerivedFeatures(triageInput);

  // NLP Parser handler
  const handleNlpParse = async () => {
    if (!nlpText.trim()) return;
    setIsParsingNlp(true);
    try {
      const result = await callParseText(nlpText);
      setNlpResult(result);

      // Auto-fill form with extracted vital signs
      const vs = result.vital_signs;
      const updates: Partial<TriageFormInput> = {};
      if (vs.systolic_bp) updates.systolic_bp = vs.systolic_bp;
      if (vs.diastolic_bp) updates.diastolic_bp = vs.diastolic_bp;
      if (vs.heart_rate) updates.heart_rate = vs.heart_rate;
      if (vs.respiratory_rate) updates.respiratory_rate = vs.respiratory_rate;
      if (vs.spo2) updates.spo2 = vs.spo2;
      if (vs.temperature_c) updates.temperature_c = vs.temperature_c;
      if (vs.gcs_total) updates.gcs_total = vs.gcs_total;
      if (vs.pain_score !== undefined) updates.pain_score = vs.pain_score;
      if (vs.age) updates.age = vs.age;

      // Update chief_complaint with the original text
      updates.chief_complaint = nlpText;

      setTriageInput(prev => ({ ...prev, ...updates }));

      const filledCount = Object.keys(vs).length;
      if (filledCount > 0) {
        toast.success(`${filledCount} field berhasil diekstrak dari teks!`);
      } else {
        toast.warning('Tidak ada vital sign yang berhasil diekstrak dari teks.');
      }
    } catch (err) {
      console.error('NLP parse error:', err);
      toast.error('Gagal memproses teks. Pastikan backend AI berjalan.');
    } finally {
      setIsParsingNlp(false);
    }
  };

  const handleSubmit = async (isSkip: boolean = false) => {
    setIsSubmitting(true);
    toast.loading(isSkip ? "Memproses Jalur Bypass Kritis..." : "Menganalisis data dengan AI...", { id: 'submit' });

    try {
      let res;
      if (isSkip) {
        res = await callSkipCritical(patient.id);
      } else {
        res = await callTriageApi(triageInput as TriageFormInput);
      }

      const generatedVisitId = crypto.randomUUID();
      
      let realTxHash = res.tx_hash_initial;
      try {
        await connectWallet();
        const bcResult = await logTriageToBlockchain(
          generatedVisitId,
          patient.name,
          res.result.priority,
          toBasisPoints(res.result.confidence),
          isSkip ? "BYPASS KRITIS" : "AI TRIAGE (INITIAL)"
        );
        realTxHash = bcResult.txHash;
        toast.success(`Triage tercatat di blockchain! Block #${bcResult.blockNumber}`);
      } catch (bcErr: unknown) {
        const errMsg = (bcErr as Error)?.message || String(bcErr);
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
        toast.dismiss('submit');
        return;
      }

      const queuePrefix = res.result.esi_level === 1 || res.result.esi_level === 2 ? "A" : "B";
      const queueNum = patients.filter((p) => p.queueNumber.startsWith(queuePrefix)).length + 1;

      const newPatientObj: QueuePatient = {
        ...patient,
        id: generatedVisitId,
        patientId: patient.id,
        vitalSigns: {
          bloodPressure: triageInput.systolic_bp && triageInput.diastolic_bp ? `${triageInput.systolic_bp}/${triageInput.diastolic_bp}` : "",
          heartRate: triageInput.heart_rate || 0,
          temperature: triageInput.temperature_c || 0,
          oxygenSaturation: triageInput.spo2 || 0,
          respiratoryRate: triageInput.respiratory_rate || 0,
          gcstotal: triageInput.gcs_total,
          painScore: triageInput.pain_score,
          mentalStatus: triageInput.mental_status_triage,
          map, shockIndex: shock_index, news2Score: news2
        },
        complaint: triageInput.chief_complaint || "",
        queueNumber: `${queuePrefix}-${String(queueNum).padStart(3, "0")}`,
        triageResult: res.result,
        triageFormInput: triageInput as TriageFormInput,
        tx_hash_initial: realTxHash,
        blockchain_status: 'pending',
        timestamp: new Date(),
        status: "WAITING",
      };

      await addPatient(newPatientObj);
      setLastAdded(newPatientObj);
      setShowResult(true);
      toast.dismiss('submit');
      toast.success(isSkip ? "Pasien masuk prioritas ESI 1 (Resusitasi)!" : "Analisis AI selesai, pasien masuk antrian!");
    } catch (err) {
      console.error("addPatient error:", err);
      toast.dismiss('submit');
      toast.error("Gagal mendaftarkan pasien. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewPatient = () => {
    setPatient({ ...INITIAL_PATIENT_DATA });
    setTriageInput({ gcs_total: 15, pain_score: 0, mental_status_triage: 'alert', riwayat_kronis_berulang: false });
    setStep(1);
    setMode("search");
    setSearchQuery("");
    setShowResult(false);
    setLastAdded(null);
  };

  // Lewati form identitas (buat data dummy draft) dan langsung ke form triase/vitals
  const handleSkipToStep2 = () => {
    const timestamp = Date.now();
    const queueNum = patients.length + 1; // dummy number
    
    setPatient({
      ...INITIAL_PATIENT_DATA,
      id: `CODE-${timestamp}`,
      name: `Pasien Draft ${String(queueNum).padStart(3, '0')}`,
      age: 0,
      gender: 'L',
      phone: '-',
      address: 'Data belum diisi - Pasien Draft',
      complaint: 'Data identitas belum diisi',
    });
    setTriageInput(prev => ({
      ...prev,
      chief_complaint: 'Data identitas belum diisi',
    }));
    setMode("add");
    setStep(2); // Langsung ke step 2 (form vital signs)
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        if (mode === "add") {
          return (
            newPatient.name && newPatient.dob && newPatient.phone && newPatient.address && newPatient.email && newPatient.password
          );
        }
        return false; 
      case 2:
        return (
          triageInput.gcs_total && 
          triageInput.systolic_bp && 
          triageInput.diastolic_bp && 
          triageInput.heart_rate && 
          triageInput.respiratory_rate && 
          triageInput.spo2 && 
          triageInput.temperature_c
        );
      default:
        return false;
    }
  };

  const stepLabels = ["Data Pribadi", "Triase Cepat (AI)"];

  if (showResult && lastAdded) {
    const esi = lastAdded.triageResult.esi_level || 4;
    const cfg = ESI_CONFIG[esi];

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
        className="max-w-4xl mx-auto space-y-6"
      >
        <Toaster position="top-right" richColors />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            className={`w-16 h-16 mx-auto rounded-2xl ${cfg.bgLight} flex items-center justify-center mb-4`}
          >
            <CircleCheckBig className={`w-8 h-8 ${cfg.color.replace('bg-', 'text-')}`} />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground">
            {lastAdded.triageResult.is_skip_triage ? "Bypass Kritis Diaktifkan" : "Analisis Triase Selesai"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Data tercatat di Initial Log Blockchain ({lastAdded.tx_hash_initial?.substring(0,10)}...)
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className={`border-2 ${cfg.bgLight} md:col-span-1`}>
            <CardContent className="p-6 text-center space-y-4">
              <div className={`w-24 h-24 mx-auto rounded-full ${cfg.badge} flex items-center justify-center text-3xl font-black shadow-lg`}>
                {esi}
              </div>
              <div>
                <h2 className="text-xl font-bold">{cfg.label}</h2>
                <p className="text-sm font-medium opacity-80">{lastAdded.name} ({lastAdded.age} thn)</p>
              </div>
              <div className="bg-background/50 rounded-xl p-3 text-sm">
                <p className="text-muted-foreground mb-1">Nomor Antrian</p>
                <p className="text-2xl font-bold text-foreground">{lastAdded.queueNumber}</p>
              </div>
              {lastAdded.triageResult.confidence !== undefined && !lastAdded.triageResult.is_skip_triage && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-sm border border-blue-200 dark:border-blue-900/50 mt-3">
                  <p className="text-muted-foreground mb-1">AI Confidence</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {typeof lastAdded.triageResult.confidence === 'number' 
                      ? (lastAdded.triageResult.confidence * 100).toFixed(1) + '%' 
                      : lastAdded.triageResult.confidence}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2 border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-violet-600" /> AI Reasoning & SHAP Features
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-sm text-foreground leading-relaxed">
                {lastAdded.triageResult.reasoning_text}
              </p>
              
              {lastAdded.triageResult.shap_features && lastAdded.triageResult.shap_features.length > 0 && (
                <div className="h-[300px] mt-4 border border-border rounded-xl p-3 bg-muted/30">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={lastAdded.triageResult.shap_features.map(f => ({ name: f.label, value: Math.abs(f.shap_value), isNeg: f.shap_value < 0 }))}
                      margin={{ left: 0, right: 0, top: 10, bottom: 90 }}
                    >
                      <XAxis type="category" dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={100} />
                      <YAxis type="number" hide />
                      <Tooltip formatter={(v: number) => [v.toFixed(2), 'Impact']} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {lastAdded.triageResult.shap_features.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.shap_value < 0 ? '#ef4444' : '#f59e0b'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center mt-6">
          <Button onClick={handleNewPatient} className="gap-2 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
            <User className="w-4 h-4" /> Pasien Berikutnya
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <SlideUp className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Input Pasien Baru
        </h1>
        <p className="text-sm text-muted-foreground">
          Masukkan data lengkap pasien untuk analisis AI triage
        </p>
      </SlideUp>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 px-12">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step > i + 1
                  ? "bg-blue-600 text-white"
                  : step === i + 1
                    ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-500"
                    : "bg-muted text-muted-foreground"
                  }`}
              >
                {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`hidden sm:inline text-sm font-medium ${step === i + 1
                  ? "text-blue-700 dark:text-blue-400"
                  : "text-muted-foreground"
                  }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-600 rounded-full"
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Step 1: Search or Add Patient */}
      <AnimatePresence mode="wait">
        {step === 1 && mode === "search" && (
          <motion.div
            key="step-1-search"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-end mb-4 gap-2 flex-wrap">
              <Button
                onClick={() => setMode("add")}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <User className="w-4 h-4" /> Tambahkan Pasien Baru
              </Button>
            </div>
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-600" />
                  Cari Pasien Terdaftar
                </CardTitle>
                <CardDescription>
                  Cari pasien berdasarkan nama atau NIK
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ketik nama atau NIK pasien..."
                  className="h-12 text-lg"
                />
                <div className="space-y-3 mt-4">
                  {searchQuery.trim() === "" ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                      Masukkan kata kunci pencarian
                    </p>
                  ) : searchPatients(searchQuery).length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                      Tidak ada pasien yang cocok.
                    </p>
                  ) : (
                    searchPatients(searchQuery).map((pt) => (
                      <div
                        key={pt.id}
                        className="flex items-center justify-between p-4 border border-border rounded-xl hover:border-blue-300 dark:hover:border-blue-800 transition-colors bg-card"
                      >
                        <div>
                          <h3 className="font-bold text-foreground">
                            {pt.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {pt.age} thn · {pt.address}
                          </p>
                          <div className="flex gap-2 mt-2">
                            {pt.nik && (
                              <Badge variant="outline" className="text-[10px]">
                                NIK: {pt.nik}
                              </Badge>
                            )}
                            {pt.bpjs && (
                              <Badge variant="outline" className="text-[10px]">
                                BPJS: {pt.bpjs}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleSelectPatient(pt)}
                          variant="outline"
                          className="gap-2 shrink-0 border-blue-200 hover:bg-blue-50 text-blue-600 dark:border-blue-900 dark:hover:bg-blue-900/30"
                        >
                          <Check className="w-4 h-4" /> Pilih
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 1 && mode === "add" && (
          <motion.div
            key="step-1-add"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <Button
                onClick={() => setMode("search")}
                variant="ghost"
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Kembali ke Pencarian
              </Button>
              <Button
                onClick={handleSkipToStep2}
                className="gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
                variant="outline"
              >
                Lewati Pengisian Data Diri <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Registrasi Pasien Baru
                </CardTitle>
                <CardDescription>
                  Daftarkan pasien ke database Vitas dan buatkan akun login
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label>
                      Nama Lengkap <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={newPatient.name}
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, name: e.target.value })
                      }
                      placeholder="Nama pasien"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Tanggal Lahir <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={newPatient.dob}
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, dob: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Usia (Otomatis)</Label>
                    <Input
                      disabled
                      value={calculateAge(newPatient.dob) || ""}
                      placeholder="Dihitung otomatis"
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Jenis Kelamin <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={newPatient.gender}
                      onValueChange={(v) =>
                        setNewPatient({ ...newPatient, gender: v as "L" | "P" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">Laki-laki</SelectItem>
                        <SelectItem value="P">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      NIK{" "}
                      <span className="text-xs text-muted-foreground">
                        (Tidak Wajib)
                      </span>
                    </Label>
                    <Input
                      value={newPatient.nik}
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, nik: e.target.value })
                      }
                      placeholder="Tidak Wajib Diisi"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      No. BPJS{" "}
                      <span className="text-xs text-muted-foreground">
                        (Tidak Wajib)
                      </span>
                    </Label>
                    <Input
                      value={newPatient.bpjs}
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, bpjs: e.target.value })
                      }
                      placeholder="Tidak Wajib Diisi "
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      No. Telepon <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={newPatient.phone}
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, phone: e.target.value })
                      }
                      placeholder="08xxx"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>
                      Alamat Lengkap <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      value={newPatient.address}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          address: e.target.value,
                        })
                      }
                      placeholder="Alamat lengkap"
                      rows={2}
                    />
                  </div>
                </div>

                <Separator className="my-6" />
                <h3 className="font-semibold text-sm mb-4">
                  Informasi Akun Pasien (Untuk Login)
                </h3>
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label>
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      value={newPatient.email}
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, email: e.target.value })
                      }
                      placeholder="email@pasien.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Password Default <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={newPatient.password}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          password: e.target.value,
                        })
                      }
                      placeholder="password123"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Vital Signs 11 Field Form */}
        {step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* SKIP KRITIS BANNER */}
            <Card className="border-red-400 bg-red-50 dark:bg-red-950/20 mb-6 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <AlertTriangle className="w-24 h-24 text-red-600" />
              </div>
              <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-red-800 dark:text-red-400">Pasien Kritis (Mengancam Nyawa)?</h3>
                    <p className="text-sm text-red-700/80 dark:text-red-400/80">Lewati pengisian form dan segera rujuk ke resusitasi</p>
                  </div>
                </div>
                <Button 
                  size="lg" 
                  onClick={() => handleSubmit(true)} 
                  className="bg-red-600 hover:bg-red-700 w-full sm:w-auto shadow-md hover:shadow-lg transition-all"
                >
                  Bypass (ESI 1)
                </Button>
              </CardContent>
            </Card>

            {/* NLP Auto-Fill Section */}
            <Card className="border-violet-200 dark:border-violet-900/50 bg-gradient-to-r from-violet-50/50 to-blue-50/50 dark:from-violet-950/20 dark:to-blue-950/20 mb-6 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                      <MessageSquareText className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-foreground">Input Teks Bebas (NLP)</h3>
                      <p className="text-xs text-muted-foreground">Ketik narasi singkat, AI akan ekstrak vital sign otomatis</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNlpInput(!showNlpInput)}
                    className="text-violet-600 hover:text-violet-700 hover:bg-violet-100 dark:text-violet-400 dark:hover:bg-violet-900/30"
                  >
                    {showNlpInput ? 'Tutup' : 'Buka'}
                  </Button>
                </div>

                <AnimatePresence>
                  {showNlpInput && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 pt-2">
                        <Textarea
                          value={nlpText}
                          onChange={(e) => setNlpText(e.target.value)}
                          placeholder='Contoh: "pasien pusing, mual, TD 170/100, nadi 110, spo2 91, demam 3 hari, GCS 14"'
                          rows={3}
                          className="bg-white dark:bg-background border-violet-200 dark:border-violet-800 focus:border-violet-400"
                        />
                        <div className="flex items-center gap-3">
                          <Button
                            onClick={handleNlpParse}
                            disabled={isParsingNlp || !nlpText.trim()}
                            className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                            size="sm"
                          >
                            {isParsingNlp ? (
                              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Memproses...</>
                            ) : (
                              <><Sparkles className="w-3.5 h-3.5" /> Ekstrak Otomatis</>
                            )}
                          </Button>
                          <span className="text-xs text-muted-foreground">Powered by NLP Parser Indonesia</span>
                        </div>

                        {/* NLP Results */}
                        {nlpResult && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3 pt-2 border-t border-violet-100 dark:border-violet-900/50"
                          >
                            {/* Extracted vital signs */}
                            {Object.keys(nlpResult.vital_signs).length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1.5">Vital Sign Terekstrak:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {Object.entries(nlpResult.vital_signs).map(([key, val]) => (
                                    <Badge key={key} className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-emerald-200 text-xs">
                                      {key}: {val}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Detected symptoms */}
                            {nlpResult.gejala_terdeteksi.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1.5">Gejala Terdeteksi:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {nlpResult.gejala_terdeteksi.map((g, i) => (
                                    <Badge key={i} variant="outline" className="text-xs border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400">
                                      {g.gejala} (sev: {g.severity})
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Negated symptoms */}
                            {nlpResult.gejala_dinegasikan.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1.5">Gejala Disangkal:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {nlpResult.gejala_dinegasikan.map((g, i) => (
                                    <Badge key={i} variant="outline" className="text-xs line-through opacity-60">
                                      {g}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Missing fields warning */}
                            {nlpResult.field_masih_kosong.length > 0 && (
                              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-2.5 border border-amber-200 dark:border-amber-900/50">
                                <p className="text-xs text-amber-800 dark:text-amber-300">
                                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                                  Field belum terekstrak (isi manual): {nlpResult.field_masih_kosong.join(', ')}
                                </p>
                              </div>
                            )}

                            {/* Warnings */}
                            {nlpResult.peringatan.length > 0 && (
                              <div className="space-y-1">
                                {nlpResult.peringatan.map((w, i) => (
                                  <p key={i} className="text-xs text-red-600 dark:text-red-400">{w}</p>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-600" />
                  Form Triase Cepat (AI)
                </CardTitle>
                <CardDescription>
                  Isi vital sign untuk kalkulasi MAP, Shock Index, NEWS2, dan level ESI.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* 11 Fields Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-rose-500" /> Sistolik (mmHg) *</Label>
                    <Input type="number" value={triageInput.systolic_bp || ''} onChange={e => updateTriageInput('systolic_bp', parseInt(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-rose-500" /> Diastolik (mmHg) *</Label>
                    <Input type="number" value={triageInput.diastolic_bp || ''} onChange={e => updateTriageInput('diastolic_bp', parseInt(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5"><HeartPulse className="w-3.5 h-3.5 text-red-500" /> Denyut Jantung *</Label>
                    <Input type="number" value={triageInput.heart_rate || ''} onChange={e => updateTriageInput('heart_rate', parseInt(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-cyan-500" /> Frek. Napas *</Label>
                    <Input type="number" value={triageInput.respiratory_rate || ''} onChange={e => updateTriageInput('respiratory_rate', parseInt(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5"><Wind className="w-3.5 h-3.5 text-blue-500" /> SpO2 (%) *</Label>
                    <Input type="number" value={triageInput.spo2 || ''} onChange={e => updateTriageInput('spo2', parseInt(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5"><Thermometer className="w-3.5 h-3.5 text-orange-500" /> Suhu (°C) *</Label>
                    <Input type="number" step="0.1" value={triageInput.temperature_c || ''} onChange={e => updateTriageInput('temperature_c', parseFloat(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5"><Brain className="w-3.5 h-3.5 text-violet-500" /> GCS Total *</Label>
                    <Input type="number" min="3" max="15" value={triageInput.gcs_total || ''} onChange={e => updateTriageInput('gcs_total', parseInt(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Skor Nyeri (0-10) *</Label>
                    <Input type="number" min="0" max="10" value={triageInput.pain_score || ''} onChange={e => updateTriageInput('pain_score', parseInt(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Status Mental *</Label>
                    <Select value={triageInput.mental_status_triage} onValueChange={v => updateTriageInput('mental_status_triage', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alert">Alert (Sadar Penuh)</SelectItem>
                        <SelectItem value="verbal">Verbal (Respon Suara)</SelectItem>
                        <SelectItem value="pain">Pain (Respon Nyeri)</SelectItem>
                        <SelectItem value="unresponsive">Unresponsive (Tidak Sadar)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 lg:col-span-3">
                    <Label>Keluhan Utama / Tambahan</Label>
                    <Textarea rows={2} value={triageInput.chief_complaint || ''} onChange={e => updateTriageInput('chief_complaint', e.target.value)} />
                  </div>
                </div>

                <Separator />

                {/* Auto Calculate Display */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">Kalkulasi Otomatis</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-muted rounded-lg p-3 text-center border border-border">
                      <p className="text-xs text-muted-foreground">MAP</p>
                      <p className="text-xl font-bold">{map || '-'}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center border border-border">
                      <p className="text-xs text-muted-foreground">Shock Index</p>
                      <p className="text-xl font-bold">{shock_index || '-'}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center border border-border">
                      <p className="text-xs text-muted-foreground">NEWS2 Score</p>
                      <p className="text-xl font-bold">{news2}</p>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => (step > 1 ? setStep(step - 1) : router.push("/admin"))}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          {step > 1 ? "Sebelumnya" : "Kembali"}
        </Button>
        <div className="flex items-center gap-3">
          {step < totalSteps && step !== 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!isStepValid()}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              Lanjutkan
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : step === 1 ? (
            mode === "add" && (
              <Button
                onClick={handleSubmitNewPatient}
                disabled={!isStepValid()}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                Simpan Pasien Baru
                <Check className="w-4 h-4" />
              </Button>
            )
          ) : (
            <Button
              onClick={() => handleSubmit(false)}
              disabled={!isStepValid() || isSubmitting}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menganalisis...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Analisis & Daftarkan
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
