export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type UserRole = 'admin' | 'dokter' | 'farmasi' | 'pasien'

// --- ESI 1-5 NEW TYPES ---
export type EsiLevel = 1 | 2 | 3 | 4 | 5
export type BlockchainStatus = 'pending' | 'confirmed' | 'failed'

export interface TriageFormInput {
  patient_id: string
  gcs_total: number          // 3-15
  pain_score: number         // 0-10
  mental_status_triage: 'alert' | 'verbal' | 'pain' | 'unresponsive'
  systolic_bp: number        // mmHg
  diastolic_bp: number       // mmHg
  respiratory_rate: number   // /menit
  spo2: number               // 0-100%
  heart_rate: number         // bpm
  temperature_c: number      // °C
  age: number                // tahun
  riwayat_kronis_berulang: boolean
  chief_complaint?: string   // opsional
}

export interface ShapFeature {
  feature: string
  label: string
  shap_value: number
  raw_value: number
  unit?: string
}
// -----------------------


export interface User {
  id: string
  name: string
  email: string
  password: string
  role: UserRole
}

export interface VitalSigns {
  bloodPressure: string
  heartRate: number
  temperature: number
  oxygenSaturation: number
  respiratoryRate: number
  // Opsi baru untuk ESI
  gcstotal?: number
  painScore?: number
  mentalStatus?: string
  map?: number
  shockIndex?: number
  news2Score?: number
}

export interface RegisteredPatient {
  id: string
  name: string
  dob: string
  age: number
  gender: 'L' | 'P'
  nik?: string
  bpjs?: string
  phone: string
  address: string
  faskes?: string
  userId?: string // Tautkan ke akun login
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
  // Opsi baru untuk ESI
  esi_level?: EsiLevel
  shap_features?: ShapFeature[]
  reasoning_text?: string
  is_skip_triage?: boolean
}

export interface Prescription {
  id: string
  medicationName: string
  dosage: string
  frequency: string
  duration: string
  notes?: string
}

export interface QueuePatient extends PatientData {
  patientId?: string
  queueNumber: string
  triageResult: TriageResult
  timestamp: Date
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED'
  blockchainHash?: string
  blockExplorerUrl?: string
  // Opsi ESI & Dual Log
  triageFormInput?: TriageFormInput
  tx_hash_initial?: string
  tx_hash_final?: string
  blockchain_status?: BlockchainStatus
  esi_confirmed?: EsiLevel
  doctor_notes?: string
  diubah_dokter?: boolean
  // Doctor fields
  doctorId?: string
  doctorName?: string
  diagnosis?: string
  prescriptions?: Prescription[]
  // Pharmacy fields
  pharmacyStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED'
  completedAt?: Date
  // Draft flag for anonymous patients
  isDraft?: boolean
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
  // Opsi ESI
  esi_level?: EsiLevel
  tx_hash_initial?: string
  tx_hash_final?: string
  block_number_initial?: number
  block_number_final?: number
  duration_minutes?: number
  diubah_dokter?: boolean
  confirmed_at?: Date
}
