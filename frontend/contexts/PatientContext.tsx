'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { RegisteredPatient } from '@/types'

interface PatientContextType {
  registeredPatients: RegisteredPatient[]
  addRegisteredPatient: (patient: Omit<RegisteredPatient, 'id'>) => RegisteredPatient
  searchPatients: (query: string) => RegisteredPatient[]
  getPatientById: (id: string) => RegisteredPatient | undefined
}

const DEFAULT_REGISTERED_PATIENTS: RegisteredPatient[] = [
  {
    id: 'pt-budisantoso',
    name: 'Budi Santoso',
    dob: '1979-05-12',
    age: 45,
    gender: 'L',
    nik: '3201234567890001',
    bpjs: '0001234567890',
    phone: '081234567890',
    address: 'Jl. Merdeka No. 45, RT 01/RW 02, Jakarta Selatan',
    faskes: 'Tingkat 1 - Klinik Sehat Bersama',
    userId: 'pasien-1' // from AuthContext
  },
  {
    id: 'pt-anon-2',
    name: 'Joko Anonim',
    dob: '1990-08-20',
    age: 33,
    gender: 'L',
    // No NIK, No BPJS, No History
    phone: '089876543210',
    address: 'Jl. Mawar No. 12, Bekasi',
    // faskes is empty
    userId: 'pasien-2'
  }
]

const PatientContext = createContext<PatientContextType | null>(null)

export function PatientProvider({ children }: { children: ReactNode }) {
  const [registeredPatients, setRegisteredPatients] = useState<RegisteredPatient[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('rs_misal_registered_patients')
      if (stored) {
        setRegisteredPatients(JSON.parse(stored))
        return
      }
    } catch { /* ignore */ }
    setRegisteredPatients(DEFAULT_REGISTERED_PATIENTS)
    localStorage.setItem('rs_misal_registered_patients', JSON.stringify(DEFAULT_REGISTERED_PATIENTS))
  }, [])

  const save = (updated: RegisteredPatient[]) => {
    setRegisteredPatients(updated)
    localStorage.setItem('rs_misal_registered_patients', JSON.stringify(updated))
  }

  const addRegisteredPatient = (patient: Omit<RegisteredPatient, 'id'>) => {
    const newPatient: RegisteredPatient = {
      ...patient,
      id: `pt-${Date.now().toString(36)}`
    }
    save([...registeredPatients, newPatient])
    return newPatient
  }

  const searchPatients = (query: string) => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return registeredPatients.filter(p => p.name.toLowerCase().includes(q) || (p.nik && p.nik.includes(q)))
  }

  const getPatientById = (id: string) => registeredPatients.find(p => p.id === id)

  return (
    <PatientContext.Provider value={{ registeredPatients, addRegisteredPatient, searchPatients, getPatientById }}>
      {children}
    </PatientContext.Provider>
  )
}

export function usePatients() {
  const ctx = useContext(PatientContext)
  if (!ctx) throw new Error('usePatients must be used within PatientProvider')
  return ctx
}
