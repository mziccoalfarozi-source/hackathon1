import { createContext, useContext, useState, type ReactNode } from 'react'
import type { QueuePatient, Prescription } from '@/types'
import { QUEUE_PATIENTS } from '@/data/mock'

interface QueueContextType {
  patients: QueuePatient[]
  addPatient: (patient: QueuePatient) => void
  updatePatientStatus: (id: string, status: QueuePatient['status']) => void
  assignDoctor: (patientId: string, doctorId: string, doctorName: string) => void
  addDiagnosisAndPrescription: (patientId: string, diagnosis: string, prescriptions: Prescription[]) => void
  updatePharmacyStatus: (patientId: string, status: 'PENDING' | 'PROCESSING' | 'COMPLETED') => void
  getPatientById: (id: string) => QueuePatient | undefined
  getPatientsByStatus: (status: QueuePatient['status']) => QueuePatient[]
  getPatientsByPharmacyStatus: (status: 'PENDING' | 'PROCESSING' | 'COMPLETED') => QueuePatient[]
  getPatientsForDoctor: () => QueuePatient[]
  getPatientsForPharmacy: () => QueuePatient[]
}

const QueueContext = createContext<QueueContextType | null>(null)

export function QueueProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<QueuePatient[]>(() => {
    try {
      const stored = localStorage.getItem('rs_misal_queue')
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed.map((p: QueuePatient) => ({ ...p, timestamp: new Date(p.timestamp) }))
      }
    } catch { /* ignore */ }
    return [...QUEUE_PATIENTS]
  })

  const save = (updated: QueuePatient[]) => {
    setPatients(updated)
    localStorage.setItem('rs_misal_queue', JSON.stringify(updated))
  }

  const addPatient = (patient: QueuePatient) => {
    const updated = [...patients, patient].sort((a, b) => {
      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
      return order[a.triageResult.priority] - order[b.triageResult.priority]
    })
    save(updated)
  }

  const updatePatientStatus = (id: string, status: QueuePatient['status']) => {
    save(patients.map(p => p.id === id ? { ...p, status } : p))
  }

  const assignDoctor = (patientId: string, doctorId: string, doctorName: string) => {
    save(patients.map(p => p.id === patientId ? { ...p, doctorId, doctorName, status: 'IN_PROGRESS' as const } : p))
  }

  const addDiagnosisAndPrescription = (patientId: string, diagnosis: string, prescriptions: Prescription[]) => {
    save(patients.map(p => p.id === patientId ? {
      ...p,
      diagnosis,
      prescriptions,
      status: 'COMPLETED' as const,
      pharmacyStatus: 'PENDING' as const,
    } : p))
  }

  const updatePharmacyStatus = (patientId: string, status: 'PENDING' | 'PROCESSING' | 'COMPLETED') => {
    save(patients.map(p => p.id === patientId ? {
      ...p,
      pharmacyStatus: status,
      completedAt: status === 'COMPLETED' ? new Date() : p.completedAt,
    } : p))
  }

  const getPatientById = (id: string) => patients.find(p => p.id === id)

  const getPatientsByStatus = (status: QueuePatient['status']) =>
    patients.filter(p => p.status === status)

  const getPatientsByPharmacyStatus = (status: 'PENDING' | 'PROCESSING' | 'COMPLETED') =>
    patients.filter(p => p.pharmacyStatus === status)

  const getPatientsForDoctor = () =>
    patients.filter(p => p.status === 'WAITING' || p.status === 'IN_PROGRESS')
      .sort((a, b) => {
        const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
        return order[a.triageResult.priority] - order[b.triageResult.priority]
      })

  const getPatientsForPharmacy = () =>
    patients.filter(p => p.pharmacyStatus && p.pharmacyStatus !== undefined)
      .sort((a, b) => {
        const statusOrder = { PENDING: 0, PROCESSING: 1, COMPLETED: 2 }
        return (statusOrder[a.pharmacyStatus!] || 0) - (statusOrder[b.pharmacyStatus!] || 0)
      })

  return (
    <QueueContext.Provider value={{
      patients, addPatient, updatePatientStatus, assignDoctor,
      addDiagnosisAndPrescription, updatePharmacyStatus,
      getPatientById, getPatientsByStatus, getPatientsByPharmacyStatus,
      getPatientsForDoctor, getPatientsForPharmacy,
    }}>
      {children}
    </QueueContext.Provider>
  )
}

export function useQueue() {
  const ctx = useContext(QueueContext)
  if (!ctx) throw new Error('useQueue must be used within QueueProvider')
  return ctx
}
