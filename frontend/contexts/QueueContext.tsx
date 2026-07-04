"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { QueuePatient, Prescription, PriorityLevel } from "@/types";
import { supabase } from "@/lib/supabase";

interface QueueContextType {
  patients: QueuePatient[];
  isLoading: boolean;
  addPatient: (patient: QueuePatient) => Promise<void>;
  updatePatientStatus: (
    id: string,
    status: QueuePatient["status"],
  ) => Promise<void>;
  updatePatientTriage: (
    id: string,
    updates: Partial<QueuePatient>
  ) => Promise<void>;
  assignDoctor: (
    patientId: string,
    doctorId: string,
    doctorName: string,
  ) => Promise<void>;
  addDiagnosisAndPrescription: (
    patientId: string,
    diagnosis: string,
    prescriptions: Prescription[],
  ) => Promise<void>;
  updatePharmacyStatus: (
    patientId: string,
    status: "PENDING" | "PROCESSING" | "COMPLETED",
  ) => Promise<void>;
  updatePatientIdentity: (
    visitId: string,
    patientId: string,
    updates: {
      name: string;
      date_of_birth?: string;
      age?: number;
      gender: "L" | "P";
      nik?: string;
      bpjs_number?: string;
      phone: string;
      address: string;
      user_id?: string;
    }
  ) => Promise<void>;
  getPatientById: (id: string) => QueuePatient | undefined;
  getPatientsByStatus: (status: QueuePatient["status"]) => QueuePatient[];
  getPatientsByPharmacyStatus: (
    status: "PENDING" | "PROCESSING" | "COMPLETED",
  ) => QueuePatient[];
  getPatientsForDoctor: () => QueuePatient[];
  getPatientsForPharmacy: () => QueuePatient[];
}

const QueueContext = createContext<QueueContextType | null>(null);

// Hitung warna priority (tidak disimpan di DB, dihitung di frontend)
function getPriorityColor(priority: PriorityLevel): string {
  switch (priority) {
    case "CRITICAL":
      return "text-red-600 bg-red-50 border-red-200";
    case "HIGH":
      return "text-orange-600 bg-orange-50 border-orange-200";
    case "MEDIUM":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "LOW":
      return "text-green-600 bg-green-50 border-green-200";
  }
}

// Mapping row DB → QueuePatient frontend type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToQueuePatient(row: any): QueuePatient {
  const triage = Array.isArray(row.triage_results)
    ? row.triage_results[0]
    : row.triage_results;
  let vitals = Array.isArray(row.vital_signs)
    ? row.vital_signs[0]
    : row.vital_signs;
  const patient = Array.isArray(row.patients) ? row.patients[0] : row.patients;
  const doctor = Array.isArray(row.users) ? row.users[0] : row.users;

  return {
    // Visit fields
    id: row.id,
    queueNumber: row.queue_number,
    complaint: row.complaint || "",
    duration: row.duration_of_symptoms || "",
    allergies: row.allergies || "",
    medications: row.current_medications || "",
    status: row.status,
    diagnosis: row.diagnosis || undefined,
    blockchainHash: row.blockchain_hash || undefined,
    blockExplorerUrl: row.block_explorer_url || undefined,
    pharmacyStatus: row.pharmacy_status || undefined,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    timestamp: new Date(row.created_at),
    doctorId: row.doctor_id || undefined,
    doctorName: doctor?.name || undefined,

    // Patient master data
    patientId: patient?.id || "",
    name: patient?.name || "",
    age: patient?.age || 0,
    gender: patient?.gender || "L",
    nik: patient?.nik || "",
    phone: patient?.phone || "",
    address: patient?.address || "",
    isDraft: patient?.name?.startsWith("Pasien Kode") || patient?.name?.startsWith("Pasien Draft") || patient?.address?.includes("Pasien Draft") || patient?.address?.includes("Pasien Kode") || false,

    // Symptoms (array of codes)
    symptoms: (row.visit_symptoms || []).map(
      (s: { symptom_code: string }) => s.symptom_code,
    ),

    // Triage result (Extract Meta if exists)
    triageResult: triage
      ? (function() {
          let reasoningArray = Array.isArray(triage.reasoning) ? [...triage.reasoning] : [];
          let meta: any = null;
          const metaIndex = reasoningArray.findIndex(r => typeof r === 'string' && r.startsWith('__META__:'));
          if (metaIndex >= 0) {
            try {
              meta = JSON.parse(reasoningArray[metaIndex].substring(9));
              reasoningArray.splice(metaIndex, 1);
            } catch (e) {}
          }
          
          // Re-assign extra vitals if meta exists
          if (meta?.vitalSignsExtra) {
            vitals = { ...vitals, ...meta.vitalSignsExtra };
          }
          
          return {
            priority: triage.priority,
            priorityLabel: triage.priority_label,
            confidence: triage.confidence,
            reasoning: reasoningArray,
            recommendedAction: triage.recommended_action,
            estimatedWaitTime: triage.estimated_wait_time,
            color: getPriorityColor(triage.priority),
            esi_level: meta?.esi_level || (triage.priority === 'CRITICAL' ? 1 : triage.priority === 'HIGH' ? 2 : triage.priority === 'MEDIUM' ? 3 : 4),
            shap_features: meta?.shap_features || [],
            reasoning_text: meta?.reasoning_text || "",
            is_skip_triage: meta?.is_skip_triage || false
          };
        })()
      : {
          priority: "LOW" as PriorityLevel,
          priorityLabel: "RENDAH",
          confidence: 0,
          reasoning: [],
          recommendedAction: "",
          estimatedWaitTime: "",
          color: getPriorityColor("LOW"),
          esi_level: 4
        },

    // Extra fields from Meta
    ...(function() {
      const reasoningArray = Array.isArray(triage?.reasoning) ? triage.reasoning : [];
      const metaStr = reasoningArray.find((r: any) => typeof r === 'string' && r.startsWith('__META__:'));
      let meta: any = null;
      if (metaStr) {
        try { meta = JSON.parse(metaStr.substring(9)); } catch(e) {}
      }
      return {
        tx_hash_initial: meta?.tx_hash_initial || row.blockchain_hash || undefined,
        tx_hash_final: meta?.tx_hash_final || row.block_explorer_url || undefined,
        blockchain_status: meta?.blockchain_status || undefined,
        vitalSigns: {
          bloodPressure: vitals?.blood_pressure || "",
          heartRate: vitals?.heart_rate || 0,
          temperature: vitals?.temperature || 0,
          oxygenSaturation: vitals?.oxygen_saturation || 0,
          respiratoryRate: vitals?.respiratory_rate || 0,
          gcstotal: meta?.vitalSignsExtra?.gcstotal,
          painScore: meta?.vitalSignsExtra?.painScore,
          mentalStatus: meta?.vitalSignsExtra?.mentalStatus,
          map: meta?.vitalSignsExtra?.map,
          shockIndex: meta?.vitalSignsExtra?.shockIndex,
          news2Score: meta?.vitalSignsExtra?.news2Score,
        }
      };
    })(),

    // Prescriptions
    prescriptions: (row.prescriptions || []).map(
      (rx: {
        id: string;
        medication_name: string;
        dosage: string;
        frequency: string;
        duration: string;
        notes?: string;
      }) => ({
        id: rx.id,
        medicationName: rx.medication_name,
        dosage: rx.dosage,
        frequency: rx.frequency,
        duration: rx.duration,
        notes: rx.notes || undefined,
      }),
    ),
  };
}

export function QueueProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<QueuePatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Fetch semua antrian dari Supabase (join semua tabel terkait) ──
  const fetchQueue = useCallback(async () => {
    const { data, error } = await supabase
      .from("visits")
      .select(
        `
        id,
        queue_number,
        complaint,
        duration_of_symptoms,
        allergies,
        current_medications,
        status,
        diagnosis,
        blockchain_hash,
        block_explorer_url,
        pharmacy_status,
        completed_at,
        pharmacy_completed_at,
        created_at,
        doctor_id,
        patients!patient_id (
          id, name, age, gender, nik, phone, address
        ),
        users!doctor_id (
          id, name
        ),
        vital_signs!visit_id (
          blood_pressure, heart_rate, temperature,
          oxygen_saturation, respiratory_rate
        ),
        triage_results!visit_id (
          priority, priority_label, confidence,
          reasoning, recommended_action, estimated_wait_time
        ),
        visit_symptoms!visit_id (
          symptom_code
        ),
        prescriptions!visit_id (
          id, medication_name, dosage, frequency, duration, notes
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching queue:", error);
      return;
    }

    if (data) {
      setPatients(data.map(dbToQueuePatient));
    }
    setIsLoading(false);
  }, []);

  // ── Mount: fetch data + subscribe realtime ──
  useEffect(() => {
    // Bungkus dalam fungsi async lokal agar React Compiler tidak komplain
    const init = async () => {
      await fetchQueue();
    };
    init().catch(console.error);

    // Supabase Realtime: auto-refresh antrian jika ada perubahan dari device lain
    const channel = supabase
      .channel("visits-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "visits" },
        () => {
          fetchQueue();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchQueue]);

  // ── addPatient: multi-table insert ──
  const addPatient = async (patient: QueuePatient): Promise<void> => {
    // Resolve patient_id:
    // Pasien Kode (anonymous critical) belum punya baris di tabel patients,
    // jadi kita insert placeholder dulu dan gunakan UUID yang dikembalikan.
    let resolvedPatientId = patient.patientId || patient.id;

    if (resolvedPatientId.startsWith("CODE-")) {
      // Insert placeholder ke tabel patients dengan semua field yang mungkin NOT NULL
      const { data: anonPatient, error: anonError } = await supabase
        .from("patients")
        .insert({
          name: patient.name,           // e.g. "Pasien Kode 001"
          age: 0,
          gender: patient.gender || "L",
          nik: null,
          bpjs_number: null,
          phone: "-",                   // placeholder untuk kolom NOT NULL
          address: "Data belum diisi - Pasien Draft",
          faskes: null,
          date_of_birth: null,
        })
        .select("id")
        .single();

      if (anonError || !anonPatient) {
        // Log detail error supaya bisa diagnosa
        console.error("Error inserting anonymous patient:", {
          message: anonError?.message,
          code: anonError?.code,
          details: anonError?.details,
          hint: anonError?.hint,
        });
        return;
      }
      resolvedPatientId = anonPatient.id;
    }

    // 1. Insert ke tabel visits
    const { data: visitData, error: visitError } = await supabase
      .from("visits")
      .insert({
        id: patient.id, // Gunakan UUID yang di-generate dari frontend (sudah dicatat di Blockchain)
        patient_id: resolvedPatientId, // UUID valid dari tabel patients
        queue_number: patient.queueNumber,
        complaint: patient.complaint,
        duration_of_symptoms: patient.duration,
        allergies: patient.allergies || null,
        current_medications: patient.medications || null,
        status: "WAITING",
        blockchain_hash: patient.blockchainHash || null,
        block_explorer_url: patient.blockExplorerUrl || null,
      })
      .select("id")
      .single();

    if (visitError || !visitData) {
      console.error("Error inserting visit:", visitError);
      return;
    }
    const visitId = visitData.id;

    // 2. Insert vital_signs
    const { error: vsError } = await supabase.from("vital_signs").insert({
      visit_id: visitId,
      blood_pressure: patient.vitalSigns.bloodPressure || null,
      heart_rate: patient.vitalSigns.heartRate || null,
      temperature: patient.vitalSigns.temperature || null,
      oxygen_saturation: patient.vitalSigns.oxygenSaturation || null,
      respiratory_rate: patient.vitalSigns.respiratoryRate || null,
    });
    if (vsError) console.error("Error inserting vital_signs:", vsError);

    // 3. Insert triage_results with Meta Data packing
    const metaData = {
      esi_level: patient.triageResult.esi_level,
      shap_features: patient.triageResult.shap_features,
      reasoning_text: patient.triageResult.reasoning_text,
      is_skip_triage: patient.triageResult.is_skip_triage,
      tx_hash_initial: patient.tx_hash_initial,
      tx_hash_final: patient.tx_hash_final,
      blockchain_status: patient.blockchain_status,
      vitalSignsExtra: {
        gcstotal: patient.vitalSigns.gcstotal,
        painScore: patient.vitalSigns.painScore,
        mentalStatus: patient.vitalSigns.mentalStatus,
        map: patient.vitalSigns.map,
        shockIndex: patient.vitalSigns.shockIndex,
        news2Score: patient.vitalSigns.news2Score,
      }
    };
    
    const reasoningWithMeta = [
      ...(patient.triageResult.reasoning || []),
      `__META__:${JSON.stringify(metaData)}`
    ];

    const { error: trError } = await supabase.from("triage_results").insert({
      visit_id: visitId,
      priority: patient.triageResult.priority,
      priority_label: patient.triageResult.priorityLabel,
      confidence: patient.triageResult.confidence,
      reasoning: reasoningWithMeta,
      recommended_action: patient.triageResult.recommendedAction,
      estimated_wait_time: patient.triageResult.estimatedWaitTime,
    });
    if (trError) console.error("Error inserting triage_results:", trError);

    // 4. Insert visit_symptoms (jika ada)
    if (patient.symptoms && patient.symptoms.length > 0) {
      const { error: symError } = await supabase.from("visit_symptoms").insert(
        patient.symptoms.map((code) => ({
          visit_id: visitId,
          symptom_code: code,
        })),
      );
      if (symError) console.error("Error inserting visit_symptoms:", symError);
    }

    // 5. Refresh state
    await fetchQueue();
  };

  // ── updatePatientStatus ──
  const updatePatientStatus = async (
    id: string,
    status: QueuePatient["status"],
  ): Promise<void> => {
    const { error } = await supabase
      .from("visits")
      .update({ status })
      .eq("id", id);
    if (error) console.error("Error updating status:", error);
    await fetchQueue();
  };

  // ── updatePatientTriage ──
  const updatePatientTriage = async (
    id: string,
    updates: Partial<QueuePatient>
  ): Promise<void> => {
    const pt = patients.find(p => p.id === id);
    if (!pt) return;
    
    // We update the triage_results reasoning field with the new meta
    const metaData = {
      esi_level: updates.triageResult?.esi_level ?? pt.triageResult.esi_level,
      shap_features: updates.triageResult?.shap_features ?? pt.triageResult.shap_features,
      reasoning_text: updates.triageResult?.reasoning_text ?? pt.triageResult.reasoning_text,
      is_skip_triage: updates.triageResult?.is_skip_triage ?? pt.triageResult.is_skip_triage,
      tx_hash_initial: updates.tx_hash_initial ?? pt.tx_hash_initial,
      tx_hash_final: updates.tx_hash_final ?? pt.tx_hash_final,
      blockchain_status: updates.blockchain_status ?? pt.blockchain_status,
      vitalSignsExtra: {
        gcstotal: pt.vitalSigns.gcstotal,
        painScore: pt.vitalSigns.painScore,
        mentalStatus: pt.vitalSigns.mentalStatus,
        map: pt.vitalSigns.map,
        shockIndex: pt.vitalSigns.shockIndex,
        news2Score: pt.vitalSigns.news2Score,
      }
    };
    
    const baseReasoning = pt.triageResult.reasoning.filter(r => !r.startsWith('__META__:'));
    const reasoningWithMeta = [...baseReasoning, `__META__:${JSON.stringify(metaData)}`];

    const { error: trError } = await supabase
      .from("triage_results")
      .update({ reasoning: reasoningWithMeta })
      .eq("visit_id", id);
      
    if (trError) console.error("Error updating triage_results meta:", trError);
    await fetchQueue();
  };

  // ── assignDoctor ──
  const assignDoctor = async (
    patientId: string,
    doctorId: string,
    _doctorName: string,
  ): Promise<void> => {
    const { error } = await supabase
      .from("visits")
      .update({ doctor_id: doctorId, status: "IN_PROGRESS" })
      .eq("id", patientId);
    if (error) console.error("Error assigning doctor:", error);
    await fetchQueue();
  };

  // ── addDiagnosisAndPrescription ──
  const addDiagnosisAndPrescription = async (
    patientId: string,
    diagnosis: string,
    prescriptions: Prescription[],
  ): Promise<void> => {
    // Update visit: diagnosis + status COMPLETED + pharmacy_status PENDING
    const { error: visitError } = await supabase
      .from("visits")
      .update({
        diagnosis,
        status: "COMPLETED",
        pharmacy_status: "PENDING",
        completed_at: new Date().toISOString(),
      })
      .eq("id", patientId);
    if (visitError) console.error("Error updating diagnosis:", visitError);

    // Insert semua resep obat
    if (prescriptions.length > 0) {
      const { error: rxError } = await supabase.from("prescriptions").insert(
        prescriptions.map((rx) => ({
          visit_id: patientId,
          medication_name: rx.medicationName,
          dosage: rx.dosage,
          frequency: rx.frequency,
          duration: rx.duration,
          notes: rx.notes || null,
        })),
      );
      if (rxError) console.error("Error inserting prescriptions:", rxError);
    }

    await fetchQueue();
  };

  // ── updatePharmacyStatus ──
  const updatePharmacyStatus = async (
    patientId: string,
    status: "PENDING" | "PROCESSING" | "COMPLETED",
  ): Promise<void> => {
    const updateData: Record<string, unknown> = { pharmacy_status: status };
    if (status === "COMPLETED") {
      updateData.pharmacy_completed_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from("visits")
      .update(updateData)
      .eq("id", patientId);
    if (error) console.error("Error updating pharmacy status:", error);
    await fetchQueue();
  };

  // ── updatePatientIdentity ──
  const updatePatientIdentity = async (
    visitId: string,
    patientId: string,
    updates: {
      name: string;
      date_of_birth?: string;
      age?: number;
      gender: "L" | "P";
      nik?: string;
      bpjs_number?: string;
      phone: string;
      address: string;
      user_id?: string;
    }
  ): Promise<void> => {
    const { error } = await supabase
      .from("patients")
      .update({
        ...updates,
      })
      .eq("id", patientId);

    if (error) console.error("Error updating patient identity:", error);
    await fetchQueue();
  };

  // ── Filter helpers (sync, dari state in-memory) ──
  const getPatientById = (id: string) => patients.find((p) => p.id === id);

  const getPatientsByStatus = (status: QueuePatient["status"]) =>
    patients.filter((p) => p.status === status);

  const getPatientsByPharmacyStatus = (
    status: "PENDING" | "PROCESSING" | "COMPLETED",
  ) => patients.filter((p) => p.pharmacyStatus === status);

  const getPatientsForDoctor = () =>
    patients
      .filter((p) => p.status === "WAITING" || p.status === "IN_PROGRESS")
      .sort((a, b) => {
        const order: Record<PriorityLevel, number> = {
          CRITICAL: 0,
          HIGH: 1,
          MEDIUM: 2,
          LOW: 3,
        };
        return order[a.triageResult.priority] - order[b.triageResult.priority];
      });

  const getPatientsForPharmacy = () =>
    patients
      .filter((p) => p.pharmacyStatus !== undefined)
      .sort((a, b) => {
        const statusOrder = { PENDING: 0, PROCESSING: 1, COMPLETED: 2 };
        return (
          (statusOrder[a.pharmacyStatus!] || 0) -
          (statusOrder[b.pharmacyStatus!] || 0)
        );
      });

  return (
    <QueueContext.Provider
      value={{
        patients,
        isLoading,
        addPatient,
        updatePatientStatus,
        updatePatientTriage,
        assignDoctor,
        addDiagnosisAndPrescription,
        updatePharmacyStatus,
        updatePatientIdentity,
        getPatientById,
        getPatientsByStatus,
        getPatientsByPharmacyStatus,
        getPatientsForDoctor,
        getPatientsForPharmacy,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const ctx = useContext(QueueContext);
  if (!ctx) throw new Error("useQueue must be used within QueueProvider");
  return ctx;
}
