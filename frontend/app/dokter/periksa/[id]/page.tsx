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
} from "lucide-react";
import type { Prescription } from "@/types";
import { useQueue } from "@/contexts/QueueContext";
import { useAuth } from "@/contexts/AuthContext";
import { SYMPTOM_OPTIONS } from "@/data/mock";

export default function PeriksaPasien() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const { user } = useAuth();
  const { getPatientById, assignDoctor, addDiagnosisAndPrescription } =
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

    setIsSubmitting(true);
    toast.loading("Menyimpan dan merujuk ke farmasi...", { duration: 1500 });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    try {
      await addDiagnosisAndPrescription(
        patient.id,
        diagnosis,
        validPrescriptions,
      );
      toast.success("Pasien berhasil dirujuk ke farmasi!");
      setTimeout(() => router.push("/dokter"), 1000);
    } catch {
      toast.error("Gagal menyimpan. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSymptomLabel = (val: string) =>
    SYMPTOM_OPTIONS.find((s) => s.value === val)?.label || val;

  const isHandledByMe = patient.doctorId === user?.id || isAssigned;
  const needsAssignment = patient.status === "WAITING" && !isHandledByMe;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
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
          Kembali
        </Button>
      </div>

      {/* Patient Status Banner */}
      {needsAssignment && (
        <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-400">
                  Pasien belum ditangani
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  Klik tombol untuk mulai memeriksa pasien ini
                </p>
              </div>
            </div>
            <Button
              onClick={handleAssign}
              className="bg-amber-600 hover:bg-amber-700 gap-2"
            >
              <Stethoscope className="w-4 h-4" />
              Tangani Pasien
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Patient Info (read-only) */}
        <div className="lg:col-span-1 space-y-4">
          {/* Priority */}
          <Card
            className={`border-2 ${
              patient.triageResult.priority === "CRITICAL"
                ? "border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30"
                : patient.triageResult.priority === "HIGH"
                  ? "border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/30"
                  : patient.triageResult.priority === "MEDIUM"
                    ? "border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-950/30"
                    : "border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/30"
            }`}
          >
            <CardContent className="p-4 text-center">
              <Badge
                className={`text-sm mb-2 ${
                  patient.triageResult.priority === "CRITICAL"
                    ? "bg-red-600"
                    : patient.triageResult.priority === "HIGH"
                      ? "bg-orange-500"
                      : patient.triageResult.priority === "MEDIUM"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                } text-white`}
              >
                {patient.triageResult.priorityLabel}
              </Badge>
              <p className="text-lg font-bold text-card-foreground">
                {patient.queueNumber}
              </p>
              <p className="text-xs text-muted-foreground">
                AI Confidence:{" "}
                {(patient.triageResult.confidence * 100).toFixed(0)}%
              </p>
            </CardContent>
          </Card>

          {/* Patient Details */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                Data Pasien
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nama</span>
                <span className="font-medium">{patient.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Usia</span>
                <span className="font-medium">
                  {patient.age} th ({patient.gender === "L" ? "L" : "P"})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">NIK</span>
                <span className="font-medium text-xs">{patient.nik}</span>
              </div>
              <Separator />
              <div>
                <span className="text-muted-foreground block mb-1">
                  Keluhan
                </span>
                <p className="text-xs bg-muted p-2 rounded-lg leading-relaxed">
                  {patient.complaint}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Gejala</span>
                <div className="flex flex-wrap gap-1">
                  {patient.symptoms.map((s) => (
                    <Badge
                      key={s}
                      variant="outline"
                      className="text-xs bg-background"
                    >
                      {getSymptomLabel(s)}
                    </Badge>
                  ))}
                </div>
              </div>
              {patient.allergies && (
                <div>
                  <span className="text-muted-foreground block mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                    Alergi
                  </span>
                  <p className="text-xs bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg text-amber-800 dark:text-amber-500">
                    {patient.allergies}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vital Signs */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                Tanda Vital
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                {
                  label: "Tekanan Darah",
                  value: patient.vitalSigns.bloodPressure,
                  unit: "mmHg",
                  icon: Heart,
                  color: "text-rose-500",
                  bg: "bg-rose-50 dark:bg-rose-950/30",
                },
                {
                  label: "Denyut Jantung",
                  value: patient.vitalSigns.heartRate,
                  unit: "bpm",
                  icon: HeartPulse,
                  color: "text-red-500",
                  bg: "bg-red-50 dark:bg-red-950/30",
                },
                {
                  label: "Suhu",
                  value: patient.vitalSigns.temperature,
                  unit: "°C",
                  icon: Thermometer,
                  color: "text-orange-500",
                  bg: "bg-orange-50 dark:bg-orange-950/30",
                },
                {
                  label: "SpO2",
                  value: patient.vitalSigns.oxygenSaturation,
                  unit: "%",
                  icon: Wind,
                  color: "text-blue-500",
                  bg: "bg-blue-50 dark:bg-blue-950/30",
                },
                {
                  label: "Frek. Napas",
                  value: patient.vitalSigns.respiratoryRate,
                  unit: "/menit",
                  icon: Clock,
                  color: "text-cyan-500",
                  bg: "bg-cyan-50 dark:bg-cyan-950/30",
                },
              ].map((v, i) => {
                const Icon = v.icon;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-2 rounded-lg ${v.bg}`}
                  >
                    <Icon className={`w-4 h-4 ${v.color}`} />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{v.label}</p>
                      <p className="font-semibold text-card-foreground text-sm">
                        {v.value}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          {v.unit}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right: Diagnosis & Prescription Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* AI Reasoning */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-violet-600" />
                AI Triage Reasoning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {patient.triageResult.reasoning.map((r, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <span className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900/50">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-500 mb-1">
                  Rekomendasi AI:
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {patient.triageResult.recommendedAction}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Diagnosis */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emerald-600" />
                Diagnosis & Resep Obat
              </CardTitle>
              <CardDescription>
                Isi diagnosis dan resep obat untuk dirujuk ke farmasi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="diagnosis">
                  Diagnosis <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="diagnosis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Masukkan diagnosis pasien..."
                  rows={3}
                  disabled={needsAssignment}
                />
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-violet-600" />
                    Resep Obat
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addPrescription}
                    disabled={needsAssignment}
                    className="gap-1 text-xs"
                  >
                    <Plus className="w-3 h-3" />
                    Tambah Obat
                  </Button>
                </div>

                <div className="space-y-4">
                  {prescriptions.map((rx, idx) => (
                    <div
                      key={rx.id}
                      className="bg-muted/50 rounded-xl p-4 border border-border relative"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-muted-foreground">
                          Obat #{idx + 1}
                        </span>
                        {prescriptions.length > 1 && (
                          <button
                            onClick={() => removePrescription(rx.id)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1 sm:col-span-2">
                          <Label className="text-xs">
                            Nama Obat <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            value={rx.medicationName}
                            onChange={(e) =>
                              updatePrescription(
                                rx.id,
                                "medicationName",
                                e.target.value,
                              )
                            }
                            placeholder="cth: Amoxicillin"
                            className="h-9"
                            disabled={needsAssignment}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">
                            Dosis <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            value={rx.dosage}
                            onChange={(e) =>
                              updatePrescription(
                                rx.id,
                                "dosage",
                                e.target.value,
                              )
                            }
                            placeholder="cth: 500mg"
                            className="h-9"
                            disabled={needsAssignment}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Frekuensi</Label>
                          <Input
                            value={rx.frequency}
                            onChange={(e) =>
                              updatePrescription(
                                rx.id,
                                "frequency",
                                e.target.value,
                              )
                            }
                            placeholder="cth: 3x sehari"
                            className="h-9"
                            disabled={needsAssignment}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Durasi</Label>
                          <Input
                            value={rx.duration}
                            onChange={(e) =>
                              updatePrescription(
                                rx.id,
                                "duration",
                                e.target.value,
                              )
                            }
                            placeholder="cth: 5 hari"
                            className="h-9"
                            disabled={needsAssignment}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Catatan</Label>
                          <Input
                            value={rx.notes || ""}
                            onChange={(e) =>
                              updatePrescription(rx.id, "notes", e.target.value)
                            }
                            placeholder="Setelah makan"
                            className="h-9"
                            disabled={needsAssignment}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || needsAssignment || !diagnosis}
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 h-11"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Selesai & Rujuk ke Farmasi
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
