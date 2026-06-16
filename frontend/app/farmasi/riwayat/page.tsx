"use client";

import type { QueuePatient } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CircleCheckBig, History, Pill } from "lucide-react";
import { useQueue } from "@/contexts/QueueContext";
import { StaggerContainer, StaggerItem, SlideUp } from "@/components/motion";

export default function FarmasiRiwayat() {
  const { patients } = useQueue();

  let completedPatients = patients
    .filter((p) => p.pharmacyStatus === "COMPLETED")
    .sort((a, b) => {
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bTime - aTime;
    });

  // Inject dummy data for UI demonstration
  if (completedPatients.length === 0) {
    completedPatients = [
      {
        id: "dummy-farm-history-1",
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
        completedAt: new Date().toISOString(),
      },
      {
        id: "dummy-farm-history-2",
        name: "Herman Susanto",
        age: 62,
        gender: "L",
        status: "COMPLETED",
        queueNumber: "A-002",
        doctorName: "dr. Budi Setiawan, Sp.PD",
        diagnosis: "Hipertensi",
        prescriptions: [
          {
            medicationName: "Amlodipine",
            dosage: "10mg",
            frequency: "1x sehari",
            duration: "30 hari",
          },
        ],
        pharmacyStatus: "COMPLETED",
        completedAt: new Date("2026-06-16T07:00:00").toISOString(),
      },
    ] as unknown as QueuePatient[];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Riwayat Farmasi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {completedPatients.length} resep telah diserahkan
        </p>
      </div>

      <StaggerContainer className="space-y-3">
        {completedPatients.map((patient, i) => (
          <StaggerItem key={patient.id}>
            <Card className="border-border shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                    <CircleCheckBig className="w-5 h-5 text-green-600 dark:text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-card-foreground">
                        {patient.name}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {patient.queueNumber}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Dokter: {patient.doctorName || "-"} · Diagnosis:{" "}
                      {patient.diagnosis || "-"}
                    </p>
                    {patient.prescriptions && (
                      <div className="flex flex-wrap gap-1">
                        {patient.prescriptions.map((rx, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-xs bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-900/50"
                          >
                            <Pill className="w-3 h-3 mr-1" />
                            {rx.medicationName} {rx.dosage} · {rx.frequency}
                          </Badge>
                        ))}
                      </div>
                    )}
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
          </StaggerItem>
        ))}
        {completedPatients.length === 0 && (
          <SlideUp delay={0.2} className="text-center py-20">
            <History className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">
              Belum ada riwayat
            </p>
          </SlideUp>
        )}
      </StaggerContainer>
    </div>
  );
}
