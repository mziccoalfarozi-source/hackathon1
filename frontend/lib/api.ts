import type { TriageFormInput, TriageResult, EsiLevel } from '@/types'
import { computeDerivedFeatures, generateReasoningText, hashData } from '@/data/mock'

const AI_API_URL = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8000'

// ─── Real API: POST /predict ────────────────────────────
async function callRealPredictApi(input: TriageFormInput): Promise<{
  result: TriageResult
  tx_hash_initial: string
}> {
  const response = await fetch(`${AI_API_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient_id: input.patient_id || '',
      gcs_total: input.gcs_total,
      pain_score: input.pain_score,
      mental_status_triage: input.mental_status_triage,
      systolic_bp: input.systolic_bp,
      diastolic_bp: input.diastolic_bp,
      respiratory_rate: input.respiratory_rate,
      spo2: input.spo2,
      heart_rate: input.heart_rate,
      temperature_c: input.temperature_c,
      age: input.age || 30,
      chief_complaint: input.chief_complaint || '',
      riwayat_kronis_berulang: input.riwayat_kronis_berulang || false,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `API error: ${response.status}`)
  }

  const data = await response.json()

  const result: TriageResult = {
    priority: data.priority,
    priorityLabel: data.priorityLabel,
    confidence: data.confidence,
    reasoning: [],
    recommendedAction: data.recommendedAction,
    estimatedWaitTime: data.estimatedWaitTime,
    color: data.color,
    esi_level: data.esi_level as EsiLevel,
    shap_features: data.shap_features,
    reasoning_text: data.reasoning_text,
    is_skip_triage: data.is_skip_triage || false,
  }

  const tx_hash_initial = hashData(JSON.stringify(input) + Date.now().toString())

  return { result, tx_hash_initial }
}

// ─── Fallback Mock API ──────────────────────────────────
async function callMockPredictApi(input: TriageFormInput): Promise<{
  result: TriageResult
  tx_hash_initial: string
}> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000))

  const { map, shock_index, news2 } = computeDerivedFeatures(input)
  
  // Simple heuristic for mock prediction
  let esi_level: EsiLevel = 4
  if (news2 >= 7 || shock_index > 1.2 || input.gcs_total <= 8) esi_level = 1
  else if (news2 >= 5 || input.pain_score >= 8 || shock_index > 0.9) esi_level = 2
  else if (news2 >= 3 || input.pain_score >= 5 || input.spo2 < 95) esi_level = 3
  else if (news2 === 0 && input.pain_score < 3) esi_level = 5

  const shap_features = [
    { feature: 'news2', label: 'NEWS2 Score', shap_value: 0.8 * (6 - esi_level), raw_value: news2 },
    { feature: 'shock_index', label: 'Shock Index', shap_value: 0.6 * (6 - esi_level), raw_value: shock_index },
    { feature: 'gcs_total', label: 'GCS Total', shap_value: -0.4 * esi_level, raw_value: input.gcs_total }
  ].sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value))

  const result: TriageResult = {
    priority: esi_level === 1 ? 'CRITICAL' : esi_level === 2 ? 'HIGH' : esi_level === 3 ? 'MEDIUM' : 'LOW',
    priorityLabel: `ESI ${esi_level}`,
    confidence: 0.85 + (Math.random() * 0.1),
    reasoning: [],
    recommendedAction: esi_level <= 2 ? 'Segera tangani di ruang resusitasi/emergen.' : 'Pasien dapat menunggu di ruang tunggu.',
    estimatedWaitTime: esi_level === 1 ? 'SEGERA' : esi_level === 2 ? '< 10 mnt' : esi_level === 3 ? '30-60 mnt' : '> 60 mnt',
    color: esi_level === 1 ? 'text-red-600 bg-red-50 border-red-200' : 
           esi_level === 2 ? 'text-orange-600 bg-orange-50 border-orange-200' :
           esi_level === 3 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
           'text-green-600 bg-green-50 border-green-200',
    esi_level,
    shap_features,
    reasoning_text: generateReasoningText(shap_features, esi_level, false),
    is_skip_triage: false
  }

  const tx_hash_initial = hashData(JSON.stringify(input) + Date.now().toString())
  return { result, tx_hash_initial }
}

// ─── Main API Function (auto-fallback) ──────────────────
export async function callTriageApi(input: TriageFormInput): Promise<{ result: TriageResult, tx_hash_initial: string }> {
  try {
    // Try real API first
    const result = await callRealPredictApi(input)
    console.log('[AI] Using real XGBoost model prediction')
    return result
  } catch (err) {
    // Fallback to mock if backend is down
    console.warn('[AI] Backend not available, using mock prediction:', err)
    return callMockPredictApi(input)
  }
}

// ─── Skip Critical (always local — no model needed) ─────
export async function callSkipCritical(patient_id: string): Promise<{ result: TriageResult, tx_hash_initial: string }> {
  await new Promise(resolve => setTimeout(resolve, 800))
  
  const result: TriageResult = {
    priority: 'CRITICAL',
    priorityLabel: 'ESI 1',
    confidence: 1.0,
    reasoning: [],
    recommendedAction: 'TINDAKAN PENYELAMATAN NYAWA SEGERA',
    estimatedWaitTime: 'SEGERA',
    color: 'text-red-600 bg-red-50 border-red-200',
    esi_level: 1,
    shap_features: [],
    reasoning_text: generateReasoningText([], 1, true),
    is_skip_triage: true
  }

  const tx_hash_initial = hashData('SKIP_' + patient_id + Date.now().toString())

  return { result, tx_hash_initial }
}

// ─── Confirm Triage ─────────────────────────────────────
export async function callConfirmTriage(patient_id: string, confirmation: {
  tier_final: EsiLevel,
  diubah_dokter: boolean,
  dokter_id: string,
  doctor_notes: string
}): Promise<{ success: boolean, tx_hash_final: string }> {
  await new Promise(resolve => setTimeout(resolve, 1500))
  const tx_hash_final = hashData('FINAL_' + patient_id + JSON.stringify(confirmation) + Date.now().toString())
  return { success: true, tx_hash_final }
}

// ─── NLP Parse Text ─────────────────────────────────────
export interface ParseTextResult {
  vital_signs: Record<string, number>
  gejala_terdeteksi: Array<{ gejala: string; severity: number }>
  gejala_dinegasikan: string[]
  field_masih_kosong: string[]
  siap_kirim_ke_model: boolean
  peringatan: string[]
  kategori_gejala: string[]
  severity_max: number
}

export async function callParseText(text: string): Promise<ParseTextResult> {
  const response = await fetch(`${AI_API_URL}/parse-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `Parse API error: ${response.status}`)
  }

  return response.json()
}
