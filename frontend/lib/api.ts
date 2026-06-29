import type { TriageFormInput, TriageResult, EsiLevel } from '@/types'
import { computeDerivedFeatures, generateReasoningText, hashData } from '@/data/mock'

// Ini adalah mock API call untuk simulasi komunikasi dengan backend FastAPI
// yang menangani ML inference & Blockchain dual-log

export async function callTriageApi(input: TriageFormInput): Promise<{ result: TriageResult, tx_hash_initial: string }> {
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
    // Legacy fields (for backward compatibility during transition)
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
    
    // New ESI fields
    esi_level,
    shap_features,
    reasoning_text: generateReasoningText(shap_features, esi_level, false),
    is_skip_triage: false
  }

  // Generate mock tx_hash for INITIAL log
  const tx_hash_initial = hashData(JSON.stringify(input) + Date.now().toString())

  return { result, tx_hash_initial }
}

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
