"use client";

import type { QueuePatient } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CircleCheckBig, History, FlaskConical } from "lucide-react";
import { useQueue } from "@/contexts/QueueContext";
import { useAuth } from "@/contexts/AuthContext";
import { StaggerContainer, StaggerItem, SlideUp } from "@/components/motion";

export default function DokterRiwayat() {
  const { patients } = useQueue();
  const { user } = useAuth();

  let completedPatients = patients
    .filter((p) => p.status === "COMPLETED" && p.doctorId === user?.id)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

  // Inject dummy data for UI demonstration
  if (completedPatients.length === 0) {
    completedPatients = [
      {
        id: "dummy-1",
        name: "Budi Santoso",
        age: 45,
        gender: "L",
        status: "COMPLETED",
        triageResult: {
          priority: "HIGH",
          confidence: 0.88,
          suggestedDepartment: "Poli Dalam",
          aiReasoning: "",
        },
        queueNumber: "A-005",
        symptoms: "Nyeri dada",
        vitalSigns: { bp: "120/80", hr: 80, temp: 36.5, spo2: 98 },
        timestamp: new Date().toISOString(),
        diagnosis: "Hipertensi derajat 1",
        prescriptions: [
          {
            medicationName: "Amlodipine",
            dosage: "5mg",
            instructions: "1x sehari",
          },
        ],
        pharmacyStatus: "COMPLETED",
      },
      {
        id: "dummy-2",
        name: "Siti Aminah",
        age: 32,
        gender: "P",
        status: "COMPLETED",
        triageResult: {
          priority: "MEDIUM",
          confidence: 0.92,
          suggestedDepartment: "Poli Umum",
          aiReasoning: "",
        },
        queueNumber: "B-012",
        symptoms: "Demam 3 hari",
        vitalSigns: { bp: "110/70", hr: 85, temp: 38.5, spo2: 99 },
        timestamp: new Date(new Date().getTime() - 3600000).toISOString(),
        diagnosis: "Demam thypoid",
        prescriptions: [
          {
            medicationName: "Paracetamol",
            dosage: "500mg",
            instructions: "3x sehari",
          },
          {
            medicationName: "Amoxicillin",
            dosage: "500mg",
            instructions: "3x sehari",
          },
        ],
        pharmacyStatus: "PROCESSING",
      },
    ] as unknown as QueuePatient[];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Riwayat Pasien</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {completedPatients.length} pasien telah diperiksa
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
                        {patient.age}th · {patient.queueNumber}
                      </span>
                    </div>
                    {patient.diagnosis && (
                      <p className="text-sm text-card-foreground mb-2">
                        <span className="font-medium">Diagnosis:</span>{" "}
                        {patient.diagnosis}
                      </p>
                    )}
                    {patient.prescriptions &&
                      patient.prescriptions.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <FlaskConical className="w-3.5 h-3.5 text-violet-500 mt-0.5" />
                          {patient.prescriptions.map((rx, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs bg-violet-50 text-violet-700 border-violet-200"
                            >
                              {rx.medicationName} {rx.dosage}
                            </Badge>
                          ))}
                        </div>
                      )}
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        patient.pharmacyStatus === "COMPLETED"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : patient.pharmacyStatus === "PROCESSING"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {patient.pharmacyStatus === "COMPLETED"
                        ? "Obat Diserahkan"
                        : patient.pharmacyStatus === "PROCESSING"
                          ? "Obat Disiapkan"
                          : "Menunggu Farmasi"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
        {completedPatients.length === 0 && (
          <SlideUp delay={0.2} className="text-center py-20">
            <History className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">
              Belum ada riwayat pasien
            </p>
          </SlideUp>
        )}
      </StaggerContainer>
    </div>
  );
}
