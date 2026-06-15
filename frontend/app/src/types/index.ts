export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export interface VitalSigns {
  bloodPressure: string
  heartRate: number
  temperature: number
  oxygenSaturation: number
  respiratoryRate: number
}

export interface PatientData {
  id: string
  name: string
  age: number
  gender: 'L' | 'P'
  nik: string
  phone: string
  address: string
  symptoms: string[]
  complaint: string
  vitalSigns: VitalSigns
  duration: string
  allergies: string
  medications: string
}

export interface TriageResult {
  priority: PriorityLevel
  priorityLabel: string
  confidence: number
  reasoning: string[]
  recommendedAction: string
  estimatedWaitTime: string
  color: string
}

export interface QueuePatient extends PatientData {
  queueNumber: string
  triageResult: TriageResult
  timestamp: Date
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED'
  blockchainHash?: string
  blockExplorerUrl?: string
}

export interface AuditRecord {
  id: string
  patientName: string
  timestamp: Date
  action: string
  triagePriority: PriorityLevel
  txHash: string
  blockNumber: number
  verified: boolean
  details: string
}
