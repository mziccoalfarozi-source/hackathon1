"use client";

import type { QueuePatient } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "sonner";
import {
  FlaskConical,
  Clock,
  CircleCheckBig,
  Package,
  Stethoscope,
  Pill,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useQueue } from "@/contexts/QueueContext";
import { useState } from "react";
import { StaggerContainer, StaggerItem, SlideUp } from "@/components/motion";
import { motion } from "framer-motion";

export default function FarmasiDashboard() {
  const { patients, updatePharmacyStatus } = useQueue();
  const [processingId, setProcessingId] = useState<string | null>(null);

  let pendingPatients = patients.filter((p) => p.pharmacyStatus === "PENDING");
  let processingPatients = patients.filter(
    (p) => p.pharmacyStatus === "PROCESSING",
  );
  let completedPatients = patients.filter(
    (p) => p.pharmacyStatus === "COMPLETED",
  );

  // Inject dummy data if queue is completely empty for UI demonstration
  if (
    pendingPatients.length === 0 &&
    processingPatients.length === 0 &&
    completedPatients.length === 0
  ) {
    pendingPatients = [
      {
        id: "dummy-farm-1",
        name: "Ahmad Faisal",
        age: 50,
        gender: "L",
        status: "COMPLETED",
        queueNumber: "A-010",
        doctorName: "dr. Budi Setiawan, Sp.PD",
        diagnosis: "Diabetes Mellitus Tipe 2",
        prescriptions: [
          {
            medicationName: "Metformin",
            dosage: "500mg",
            frequency: "3x sehari",
            duration: "30 hari",
          },
          {
            medicationName: "Glimepiride",
            dosage: "2mg",
            frequency: "1x sehari",
            duration: "30 hari",
          },
        ],
        pharmacyStatus: "PENDING",
      },
    ] as QueuePatient[];

    processingPatients = [
      {
        id: "dummy-farm-2",
        name: "Dewi Lestari",
        age: 28,
        gender: "P",
        status: "COMPLETED",
        queueNumber: "B-024",
        doctorName: "dr. Siti Aminah, Sp.OG",
        diagnosis: "Anemia defisiensi besi",
        prescriptions: [
          {
            medicationName: "Sangobion",
            dosage: "1 kapsul",
            frequency: "1x sehari",
            duration: "14 hari",
          },
        ],
        pharmacyStatus: "PROCESSING",
      },
    ] as QueuePatient[];

    completedPatients = [
      {
        id: "dummy-farm-3",
        name: "Ratna Mutiara",
        age: 35,
        gender: "P",
        status: "COMPLETED",
        queueNumber: "C-005",
        doctorName: "dr. Andi Hakim, Sp.THT",
        diagnosis: "Faringitis Akut",
        prescriptions: [
          {
            medicationName: "Amoxicillin",
            dosage: "500mg",
            frequency: "3x sehari",
            duration: "5 hari",
          },
          {
            medicationName: "Paracetamol",
            dosage: "500mg",
            frequency: "3x sehari",
            duration: "5 hari",
          },
        ],
        pharmacyStatus: "COMPLETED",
      },
    ] as QueuePatient[];
  }

  const handleProcess = (id: string) => {
    updatePharmacyStatus(id, "PROCESSING");
    toast.success("Obat sedang disiapkan");
  };

  const handleComplete = (id: string) => {
    setProcessingId(id);
    toast.loading("Menyelesaikan...", { duration: 1000 });
    setTimeout(() => {
      updatePharmacyStatus(id, "COMPLETED");
      setProcessingId(null);
      toast.success("Obat telah diserahkan ke pasien!");
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      <SlideUp>
        <h1 className="text-2xl font-bold text-foreground">
          Dashboard Farmasi
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola rujukan obat dari dokter
        </p>
      </SlideUp>

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-3 gap-4" staggerDelay={0.1}>
        {[
          {
            icon: Clock,
            label: "Menunggu",
            value: pendingPatients.length,
            iconBg: "bg-amber-100 dark:bg-amber-950/50",
            iconColor: "text-amber-600 dark:text-amber-400",
            valueColor: "text-amber-600 dark:text-amber-400",
          },
          {
            icon: Package,
            label: "Disiapkan",
            value: processingPatients.length,
            iconBg: "bg-blue-100 dark:bg-blue-950/50",
            iconColor: "text-blue-600 dark:text-blue-400",
            valueColor: "text-blue-600 dark:text-blue-400",
          },
          {
            icon: CircleCheckBig,
            label: "Diserahkan",
            value: completedPatients.length,
            iconBg: "bg-green-100 dark:bg-green-950/50",
            iconColor: "text-green-600 dark:text-green-400",
            valueColor: "text-green-600 dark:text-green-400",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <StaggerItem key={stat.label}>
              <motion.div whileHover={{ y: -3 }}>
                <Card className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`w-9 h-9 rounded-lg ${stat.iconBg} flex items-center justify-center`}
                      >
                        <Icon className={`w-4 h-4 ${stat.iconColor}`} />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {stat.label}
                      </span>
                    </div>
                    <p className={`text-2xl font-bold ${stat.valueColor}`}>
                      {stat.value}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Pending */}
      {pendingPatients.length > 0 && (
        <SlideUp delay={0.2}>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Menunggu Disiapkan ({pendingPatients.length})
          </h2>
          <div className="space-y-3">
            {pendingPatients.map((patient, i) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.08 }}
              >
                <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                        <FlaskConical className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-card-foreground">
                            {patient.name}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {patient.age}th · {patient.queueNumber}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50"
                          >
                            Menunggu
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                          <Stethoscope className="w-3 h-3" />
                          <span>Dokter: {patient.doctorName || "-"}</span>
                          {patient.diagnosis && (
                            <>
                              <span>·</span>
                              <span>Diagnosis: {patient.diagnosis}</span>
                            </>
                          )}
                        </div>

                        {/* Prescriptions */}
                        {patient.prescriptions &&
                          patient.prescriptions.length > 0 && (
                            <div className="bg-background rounded-xl p-3 border border-border space-y-2">
                              <p className="text-xs font-semibold text-card-foreground flex items-center gap-1">
                                <Pill className="w-3 h-3 text-violet-500" />
                                Resep Obat:
                              </p>
                              {patient.prescriptions.map((rx, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-3 text-sm bg-muted rounded-lg p-2"
                                >
                                  <span className="w-5 h-5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 flex items-center justify-center text-xs font-bold">
                                    {i + 1}
                                  </span>
                                  <div className="flex-1">
                                    <span className="font-medium text-card-foreground">
                                      {rx.medicationName}
                                    </span>
                                    <span className="text-muted-foreground ml-2">
                                      {rx.dosage}
                                    </span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {rx.frequency} · {rx.duration}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                      <Button
                        onClick={() => handleProcess(patient.id)}
                        className="bg-amber-600 hover:bg-amber-700 gap-2 flex-shrink-0"
                      >
                        <Package className="w-4 h-4" />
                        Siapkan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </SlideUp>
      )}

      {/* Processing */}
      {processingPatients.length > 0 && (
        <SlideUp delay={0.3}>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500" />
            Sedang Disiapkan ({processingPatients.length})
          </h2>
          <div className="space-y-3">
            {processingPatients.map((patient, i) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + i * 0.08 }}
              >
                <Card className="border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <Package className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-card-foreground">
                            {patient.name}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {patient.queueNumber}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50"
                          >
                            Disiapkan
                          </Badge>
                        </div>
                        {patient.prescriptions && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {patient.prescriptions.map((rx, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs bg-background"
                              >
                                {rx.medicationName} {rx.dosage}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => handleComplete(patient.id)}
                        disabled={processingId === patient.id}
                        className="bg-green-600 hover:bg-green-700 gap-2 flex-shrink-0"
                      >
                        {processingId === patient.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CircleCheckBig className="w-4 h-4" />
                        )}
                        Serahkan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </SlideUp>
      )}

      {/* Completed */}
      {completedPatients.length > 0 && (
        <SlideUp delay={0.4}>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <CircleCheckBig className="w-5 h-5 text-green-500" />
            Sudah Diserahkan ({completedPatients.length})
          </h2>
          <div className="space-y-2">
            {completedPatients.slice(0, 5).map((patient, i) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + i * 0.06 }}
              >
                <Card className="border-border shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                        <CircleCheckBig className="w-4 h-4 text-green-600 dark:text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-card-foreground">
                          {patient.name}
                        </p>
                        <div className="flex gap-1 mt-0.5">
                          {patient.prescriptions?.map((rx, i) => (
                            <span
                              key={i}
                              className="text-xs text-muted-foreground"
                            >
                              {rx.medicationName}
                              {i < (patient.prescriptions?.length || 0) - 1
                                ? ","
                                : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50"
                      >
                        Selesai
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </SlideUp>
      )}

      {pendingPatients.length === 0 &&
        processingPatients.length === 0 &&
        completedPatients.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center py-20"
          >
            <FlaskConical className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">
              Belum ada rujukan obat
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Rujukan dari dokter akan muncul di sini
            </p>
          </motion.div>
        )}
    </div>
  );
}
