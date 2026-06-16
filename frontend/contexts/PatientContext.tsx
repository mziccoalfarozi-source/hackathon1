"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { RegisteredPatient } from "@/types";
import { supabase } from "@/lib/supabase";

interface PatientContextType {
  registeredPatients: RegisteredPatient[];
  isLoading: boolean;
  addRegisteredPatient: (
    patient: Omit<RegisteredPatient, "id">,
  ) => Promise<RegisteredPatient>;
  searchPatients: (query: string) => RegisteredPatient[];
  getPatientById: (id: string) => RegisteredPatient | undefined;
}

interface PatientRow {
  id: string;
  user_id: string | null;
  name: string;
  date_of_birth: string | null;
  age: number | null;
  gender: "L" | "P";
  nik: string | null;
  bpjs_number: string | null;
  phone: string;
  address: string;
  faskes: string | null;
  created_at: string;
  updated_at: string;
}

function dbToPatient(row: PatientRow): RegisteredPatient {
  return {
    id: row.id,
    name: row.name,
    dob: row.date_of_birth || "",
    age: row.age || 0,
    gender: row.gender,
    nik: row.nik || undefined,
    bpjs: row.bpjs_number || undefined,
    phone: row.phone,
    address: row.address,
    faskes: row.faskes || undefined,
    userId: row.user_id || undefined,
  };
}

const PatientContext = createContext<PatientContextType | null>(null);

export function PatientProvider({ children }: { children: ReactNode }) {
  const [registeredPatients, setRegisteredPatients] = useState<
    RegisteredPatient[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch patients:", error);
        setIsLoading(false);
        return;
      }

      if (data) setRegisteredPatients(data.map(dbToPatient));
      setIsLoading(false);
    };

    fetchPatients();
  }, []);

  const addRegisteredPatient = async (
    patient: Omit<RegisteredPatient, "id">,
  ): Promise<RegisteredPatient> => {
    const { data, error } = await supabase
      .from("patients")
      .insert({
        user_id: patient.userId || null,
        name: patient.name,
        date_of_birth: patient.dob || null,
        age: patient.age,
        gender: patient.gender,
        nik: patient.nik || null,
        bpjs_number: patient.bpjs || null,
        phone: patient.phone,
        address: patient.address,
        faskes: patient.faskes || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    const newPatient = dbToPatient(data);
    setRegisteredPatients((prev) => [newPatient, ...prev]);
    return newPatient;
  };

  const searchPatients = (query: string): RegisteredPatient[] => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return registeredPatients.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.nik && p.nik.includes(q)),
    );
  };

  const getPatientById = (id: string) =>
    registeredPatients.find((p) => p.id === id);

  return (
    <PatientContext.Provider
      value={{
        registeredPatients,
        isLoading,
        addRegisteredPatient,
        searchPatients,
        getPatientById,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
}

export function usePatients() {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error("usePatients must be used within PatientProvider");
  return ctx;
}
