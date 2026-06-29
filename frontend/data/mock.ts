import type { QueuePatient, AuditRecord, TriageResult, PatientData, EsiLevel, TriageFormInput } from '@/types'

// --- ESI CONFIG ---
export const ESI_CONFIG: Record<EsiLevel, { label: string; color: string; badge: string; bgLight: string; borderColor: string; description: string }> = {
  1: {
    label: 'ESI 1 (Resusitasi)',
    color: 'bg-red-600',
    badge: 'bg-red-600 text-white hover:bg-red-700',
    bgLight: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-900/50',
    description: 'Kondisi mengancam nyawa, butuh intervensi segera (mis: henti jantung, syok berat).'
  },
  2: {
    label: 'ESI 2 (Emergen)',
    color: 'bg-orange-500',
    badge: 'bg-orange-500 text-white hover:bg-orange-600',
    bgLight: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-900/50',
    description: 'Kondisi risiko tinggi, nyeri hebat, atau perubahan status mental (mis: stroke, ACS).'
  },
  3: {
    label: 'ESI 3 (Urgensi)',
    color: 'bg-yellow-500',
    badge: 'bg-yellow-500 text-white hover:bg-yellow-600',
    bgLight: 'bg-yellow-50 dark:bg-yellow-950/30',
    borderColor: 'border-yellow-200 dark:border-yellow-900/50',
    description: 'Membutuhkan 2 atau lebih sumber daya (mis: lab, x-ray, IV fluids).'
  },
  4: {
    label: 'ESI 4 (Kurang Urgen)',
    color: 'bg-green-500',
    badge: 'bg-green-500 text-white hover:bg-green-600',
    bgLight: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-900/50',
    description: 'Membutuhkan 1 sumber daya (mis: jahitan sederhana, x-ray dasar).'
  },
  5: {
    label: 'ESI 5 (Tidak Urgen)',
    color: 'bg-blue-500',
    badge: 'bg-blue-500 text-white hover:bg-blue-600',
    bgLight: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-900/50',
    description: 'Tidak membutuhkan sumber daya, hanya periksa (mis: resep obat, ganti balutan).'
  }
}

export const SHAP_FEATURE_LABELS: Record<string, string> = {
  gcs_total: 'GCS Total',
  pain_score: 'Skor Nyeri',
  mental_status: 'Status Mental',
  systolic_bp: 'Tekanan Sistolik',
  diastolic_bp: 'Tekanan Diastolik',
  respiratory_rate: 'Frek. Napas',
  spo2: 'SpO2',
  heart_rate: 'Denyut Jantung',
  temperature: 'Suhu Tubuh',
  age: 'Usia',
  chronic_history: 'Riwayat Kronis',
  map: 'Mean Arterial Pressure',
  shock_index: 'Shock Index'
}

export const computeDerivedFeatures = (input: Partial<TriageFormInput>) => {
  let map = 0
  let shock_index = 0
  let news2 = 0

  if (input.systolic_bp && input.diastolic_bp) {
    map = Math.round(((2 * input.diastolic_bp) + input.systolic_bp) / 3)
  }
  if (input.heart_rate && input.systolic_bp && input.systolic_bp > 0) {
    shock_index = Number((input.heart_rate / input.systolic_bp).toFixed(2))
  }
  if (input.respiratory_rate) {
    if (input.respiratory_rate <= 8 || input.respiratory_rate >= 25) news2 += 3
    else if (input.respiratory_rate >= 21) news2 += 2
    else if (input.respiratory_rate <= 11) news2 += 1
  }
  if (input.spo2) {
    if (input.spo2 <= 91) news2 += 3
    else if (input.spo2 <= 93) news2 += 2
    else if (input.spo2 <= 95) news2 += 1
  }
  if (input.systolic_bp) {
    if (input.systolic_bp <= 90) news2 += 3
    else if (input.systolic_bp <= 100) news2 += 2
    else if (input.systolic_bp <= 110) news2 += 1
    else if (input.systolic_bp >= 220) news2 += 3
  }
  if (input.heart_rate) {
    if (input.heart_rate <= 40 || input.heart_rate >= 131) news2 += 3
    else if (input.heart_rate >= 111) news2 += 2
    else if (input.heart_rate <= 50 || input.heart_rate >= 91) news2 += 1
  }
  if (input.mental_status_triage && input.mental_status_triage !== 'alert') {
    news2 += 3
  }
  if (input.temperature_c) {
    if (input.temperature_c <= 35.0) news2 += 3
    else if (input.temperature_c >= 39.1) news2 += 2
    else if (input.temperature_c <= 36.0 || input.temperature_c >= 38.1) news2 += 1
  }

  return { map, shock_index, news2 }
}

export const generateReasoningText = (features: any[], level: EsiLevel, isSkip: boolean) => {
  if (isSkip) {
    return 'Pasien ditetapkan sebagai ESI 1 (Resusitasi) melalui Jalur Bypass Kritis oleh perawat. Intervensi penyelamatan nyawa harus segera dilakukan tanpa menunggu form triase lengkap.'
  }
  
  const topImpacts = features.slice(0, 3)
  let text = `AI memprediksi level ESI ${level} berdasarkan profil vital sign.`
  
  const reasons = topImpacts.map(f => {
    if (f.feature === 'gcs_total' && f.raw_value < 15) return `Penurunan kesadaran (GCS ${f.raw_value})`
    if (f.feature === 'spo2' && f.raw_value < 92) return `Hipoksia signifikan (SpO2 ${f.raw_value}%)`
    if (f.feature === 'shock_index' && f.raw_value > 1.0) return `Risiko syok tinggi (SI ${f.raw_value})`
    if (f.feature === 'pain_score' && f.raw_value >= 7) return `Nyeri hebat (Skor ${f.raw_value}/10)`
    return `${f.label} (${f.raw_value})`
  })

  if (reasons.length > 0) {
    text += ` Faktor penyumbang risiko tertinggi adalah: ${reasons.join(', ')}.`
  }
  return text
}
// -----------------

export const MOCK_TRIAGE_RESULTS: Record<string, TriageResult> = {
  '1': {
    priority: 'CRITICAL',
    priorityLabel: 'KRITIS',
    confidence: 0.94,
    reasoning: [
      'Pasien menunjukkan tanda-tanda sindrom koroner akut (nyeri dada hebat dengan iradiasi ke lengan kiri)',
      'Tekanan darah 90/60 mmHg menunjukkan hipotensi — tanda syok kardiogenik'
    ],
    recommendedAction: 'Segera bawa ke Ruang Gawat Darurat. Berikan oksigen 15L/menit via masker non-rebreathing. Pasang akses intravena. EKG 12 lead segera. Siapkan nitrogliserin dan morfin. Hubungi dokter spesialis jantung.',
    estimatedWaitTime: 'SEGERA (0 menit)',
    color: 'text-red-600 bg-red-50 border-red-200',
    // --- ESI fields ---
    esi_level: 1,
    reasoning_text: 'AI memprediksi level ESI 1 berdasarkan profil vital sign. Faktor penyumbang risiko tertinggi adalah: Risiko syok tinggi (SI 1.22), Nyeri hebat (Skor 9/10), Hipoksia signifikan (SpO2 88%).',
    shap_features: [
      { feature: 'shock_index', label: 'Shock Index', shap_value: 0.85, raw_value: 1.22 },
      { feature: 'pain_score', label: 'Skor Nyeri', shap_value: 0.65, raw_value: 9 },
      { feature: 'spo2', label: 'SpO2', shap_value: 0.55, raw_value: 88 }
    ],
    is_skip_triage: false
  },
  '2': {
    priority: 'HIGH',
    priorityLabel: 'TINGGI',
    confidence: 0.89,
    reasoning: [
      'Demam tinggi 39.5°C dengan kejang demam berulang memerlukan evaluasi neurologis segera'
    ],
    recommendedAction: 'Stabilisasi airway-breathing-circulation. Berikan antipiretik (parasetamol 10-15mg/kg). Siapkan diazepam rektal 0.5mg/kg jika kejang berulang. Monitor suhu tiap 15 menit. Rujuk ke RS jika kejang berlanjut >10 menit.',
    estimatedWaitTime: '< 10 menit',
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    // --- ESI fields ---
    esi_level: 2,
    reasoning_text: 'AI memprediksi level ESI 2 berdasarkan profil vital sign. Faktor penyumbang risiko tertinggi adalah: Suhu Tubuh (39.5°C), Penurunan kesadaran (GCS 13), Denyut Jantung (130).',
    shap_features: [
      { feature: 'temperature_c', label: 'Suhu Tubuh', shap_value: 0.75, raw_value: 39.5, unit: '°C' },
      { feature: 'gcs_total', label: 'GCS Total', shap_value: 0.6, raw_value: 13 },
      { feature: 'heart_rate', label: 'Denyut Jantung', shap_value: 0.45, raw_value: 130 }
    ],
    is_skip_triage: false
  },
  '3': {
    priority: 'MEDIUM',
    priorityLabel: 'SEDANG',
    confidence: 0.82,
    reasoning: [
      'Sesak napas progresif selama 3 hari dengan riwayat asma bronkial menunjukkan eksaserbasi'
    ],
    recommendedAction: 'Berikan nebulizer salbutamol 2.5mg. Monitor saturasi oksigen tiap 15 menit. Jika tidak membaik dalam 30 menit, pertimbangkan hidrokortison 100mg IV dan rujuk ke RS.',
    estimatedWaitTime: '30-60 menit',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    // --- ESI fields ---
    esi_level: 3,
    reasoning_text: 'AI memprediksi level ESI 3 berdasarkan profil vital sign. Faktor penyumbang risiko tertinggi adalah: SpO2 (92%), Frek. Napas (28).',
    shap_features: [
      { feature: 'spo2', label: 'SpO2', shap_value: 0.5, raw_value: 92, unit: '%' },
      { feature: 'respiratory_rate', label: 'Frek. Napas', shap_value: 0.4, raw_value: 28 }
    ],
    is_skip_triage: false
  },
  '4': {
    priority: 'LOW',
    priorityLabel: 'RENDAH',
    confidence: 0.91,
    reasoning: [
      'Batuk pilek ringan selama 2 hari tanpa demam tinggi — kemungkinan ISPA ringan'
    ],
    recommendedAction: 'Perawatan suportif: istirahat cukup, minum air hangat, parasetamol jika demam. Obat batuk jika mengganggu tidur. Edukasi tanda bahaya yang perlu segera ke fasilitas kesehatan. Kontrol ulang jika tidak membaik dalam 5 hari.',
    estimatedWaitTime: '60-120 menit',
    color: 'text-green-600 bg-green-50 border-green-200',
    // --- ESI fields ---
    esi_level: 4,
    reasoning_text: 'AI memprediksi level ESI 4 berdasarkan profil vital sign. Faktor penyumbang risiko tertinggi adalah: GCS (15), SpO2 (97%), Nyeri (2).',
    shap_features: [
      { feature: 'gcs_total', label: 'GCS Total', shap_value: -0.3, raw_value: 15 },
      { feature: 'spo2', label: 'SpO2', shap_value: -0.2, raw_value: 97, unit: '%' },
      { feature: 'pain_score', label: 'Skor Nyeri', shap_value: -0.1, raw_value: 2 }
    ],
    is_skip_triage: false
  }
}

export const INITIAL_PATIENT_DATA: PatientData = {
  id: '',
  name: '',
  age: 0,
  gender: 'L',
  nik: '',
  phone: '',
  address: '',
  symptoms: [],
  complaint: '',
  vitalSigns: {
    bloodPressure: '',
    heartRate: 0,
    temperature: 0,
    oxygenSaturation: 0,
    respiratoryRate: 0,
  },
  duration: '',
  allergies: '',
  medications: '',
}

export const QUEUE_PATIENTS: QueuePatient[] = [
  {
    ...INITIAL_PATIENT_DATA,
    id: '1',
    name: 'Budi Santoso',
    age: 58,
    gender: 'L',
    nik: '3201015801010001',
    phone: '081234567890',
    address: 'Jl. Merdeka No. 123, Kel. Harapan, Kec. Sejahtera',
    symptoms: ['nyeri_dada', 'sesak_napas', 'keringat_dingin', 'mual'],
    complaint: 'Nyeri dada hebat seperti ditindih batu, menjalar ke lengan kiri, disertai sesak napas dan keringat dingin sejak 30 menit lalu.',
    vitalSigns: {
      bloodPressure: '90/60',
      heartRate: 110,
      temperature: 36.5,
      oxygenSaturation: 88,
      respiratoryRate: 26,
    },
    duration: '30 menit',
    allergies: 'Tidak ada',
    medications: 'Amlodipine 5mg (rutin untuk hipertensi)',
    queueNumber: 'A-001',
    triageResult: MOCK_TRIAGE_RESULTS['1'],
    timestamp: new Date('2026-06-09T08:15:00'),
    status: 'IN_PROGRESS',
    blockchainHash: '0x7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
    blockExplorerUrl: 'https://polygonscan.com/tx/0x7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
    // --- ESI fields ---
    esi_confirmed: 1,
    tx_hash_initial: '0x7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
    tx_hash_final: '0x8f9a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1c',
    blockchain_status: 'confirmed'
  },
  {
    ...INITIAL_PATIENT_DATA,
    id: '2',
    name: 'Anisa Putri',
    age: 3,
    gender: 'P',
    nik: '3201012306010002',
    phone: '082345678901',
    address: 'Jl. Pahlawan No. 45, Kel. Maju, Kec. Makmur',
    symptoms: ['demam_tinggi', 'kejang', 'lemas', 'muntah'],
    complaint: 'Demam tinggi 39.5°C sejak kemarin, tadi pagi kejang 2x (mata melirik, tubuh kaku, mulai dari tangan lalu ke seluruh tubuh), masing-masing sekitar 3-5 menit. Anak terlihat sangat lemas dan sulit minum.',
    vitalSigns: {
      bloodPressure: '85/55',
      heartRate: 130,
      temperature: 39.5,
      oxygenSaturation: 94,
      respiratoryRate: 32,
    },
    duration: '1 hari',
    allergies: 'Tidak diketahui',
    medications: 'Tidak ada',
    queueNumber: 'A-002',
    triageResult: MOCK_TRIAGE_RESULTS['2'],
    timestamp: new Date('2026-06-09T08:30:00'),
    status: 'WAITING',
    // --- ESI fields ---
    tx_hash_initial: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
    blockchain_status: 'pending'
  },
  {
    ...INITIAL_PATIENT_DATA,
    id: '3',
    name: 'Pak Wardi',
    age: 45,
    gender: 'L',
    nik: '3201014501010003',
    phone: '083456789012',
    address: 'Jl. Cendrawasih No. 78, Kel. Baru, Kec. Indah',
    symptoms: ['sesak_napas', 'batuk', 'wheezing', 'berkeringat'],
    complaint: 'Sesak napas semakin berat selama 3 hari terakhir, batuk dengan dahak putih, suara napas mengi (ngik-ngik), disertai keringat banyak. Riwayat asma sejak kecil, sering kambuh saat cuaca dingin dan terpapar debu.',
    vitalSigns: {
      bloodPressure: '130/85',
      heartRate: 105,
      temperature: 37.2,
      oxygenSaturation: 92,
      respiratoryRate: 28,
    },
    duration: '3 hari',
    allergies: 'Alergi debu, bulu kucing, cuaca dingin',
    medications: 'Salbutamol inhaler (sering digunakan akhir-akhir ini)',
    queueNumber: 'B-001',
    triageResult: MOCK_TRIAGE_RESULTS['3'],
    timestamp: new Date('2026-06-09T08:45:00'),
    status: 'WAITING',
    // --- ESI fields ---
    tx_hash_initial: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6',
    blockchain_status: 'pending'
  },
  {
    ...INITIAL_PATIENT_DATA,
    id: '4',
    name: 'Ibu Siti Aminah',
    age: 35,
    gender: 'P',
    nik: '3201013501010004',
    phone: '084567890123',
    address: 'Jl. Melati No. 22, Kel. Damai, Kec. Sentosa',
    symptoms: ['batuk', 'pilek', 'sakit_tenggorokan', 'bersin'],
    complaint: 'Batuk dan pilek selama 2 hari, tenggorokan terasa gatal dan sakit saat menelan, sering bersin, tidak demam. Muncul setelah hujan-hujanan kemarin.',
    vitalSigns: {
      bloodPressure: '120/80',
      heartRate: 78,
      temperature: 36.8,
      oxygenSaturation: 97,
      respiratoryRate: 18,
    },
    duration: '2 hari',
    allergies: 'Tidak ada',
    medications: 'Tidak minum obat, baru minum air hangat',
    queueNumber: 'B-002',
    triageResult: MOCK_TRIAGE_RESULTS['4'],
    timestamp: new Date('2026-06-09T09:00:00'),
    status: 'WAITING',
    // --- ESI fields ---
    tx_hash_initial: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
    blockchain_status: 'pending'
  },
]

export const AUDIT_RECORDS: AuditRecord[] = [
  {
    id: '1',
    patientName: 'Budi Santoso',
    timestamp: new Date('2026-06-09T08:20:15'),
    action: 'AI TRIAGE + KONFIRMASI',
    triagePriority: 'CRITICAL',
    txHash: '0x7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
    blockNumber: 67890123,
    verified: true,
    details: 'Triage: ESI 1 (Resusitasi) | Confirmed by: dr. Ahmad Fauzi, Sp.PD | AI Confidence: 94%',
    // ESI Dual Log
    esi_level: 1,
    tx_hash_initial: '0x7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
    tx_hash_final: '0x8f9a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1c',
    block_number_initial: 67890123,
    block_number_final: 67890130,
    duration_minutes: 5,
    confirmed_at: new Date('2026-06-09T08:25:15')
  },
  {
    id: '2',
    patientName: 'Dewi Lestari',
    timestamp: new Date('2026-06-09T07:55:30'),
    action: 'AI TRIAGE (PENDING DOCTOR)',
    triagePriority: 'HIGH',
    txHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
    blockNumber: 67890087,
    verified: false,
    details: 'Triage: ESI 2 (Emergen) | Menunggu konfirmasi dokter',
    esi_level: 2,
    tx_hash_initial: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
    block_number_initial: 67890087,
  }
]

export const SYMPTOM_OPTIONS = [
  { value: 'nyeri_dada', label: 'Nyeri Dada', icon: 'Heart' },
  { value: 'sesak_napas', label: 'Sesak Napas', icon: 'Wind' },
  { value: 'demam_tinggi', label: 'Demam Tinggi (>38.5°C)', icon: 'Thermometer' },
  { value: 'kejang', label: 'Kejang', icon: 'Zap' },
  { value: 'batuk', label: 'Batuk', icon: 'Activity' },
  { value: 'muntah', label: 'Muntah', icon: 'AlertTriangle' },
  { value: 'diare', label: 'Diare', icon: 'Droplets' },
  { value: 'pusing', label: 'Pusing/Berputar', icon: 'RotateCw' },
  { value: 'nyeri_perut', label: 'Nyeri Perut', icon: 'CircleDot' },
  { value: 'luka', label: 'Luka/Bleeding', icon: 'Scissors' },
  { value: 'alergi', label: 'Reaksi Alergi', icon: 'ShieldAlert' },
  { value: 'lemas', label: 'Lemas/Lemah', icon: 'BatteryLow' },
  { value: 'sakit_kepala', label: 'Sakit Kepala Berat', icon: 'Brain' },
  { value: 'gatal', label: 'Gatal/Gatal-gatal', icon: 'Bug' },
  { value: 'pilek', label: 'Pilek/Hidung Mampet', icon: 'CloudRain' },
  { value: 'sakit_tenggorokan', label: 'Sakit Tenggorokan', icon: 'MicOff' },
  { value: 'keringat_dingin', label: 'Keringat Dingin', icon: 'Snowflake' },
  { value: 'mual', label: 'Mual', icon: 'Frown' },
  { value: 'wheezing', label: 'Suara Napas Mengi', icon: 'AudioLines' },
  { value: 'berkeringat', label: 'Berkeringat Banyak', icon: 'CloudDrizzle' },
  { value: 'nyeri_punggung', label: 'Nyeri Punggung', icon: 'MoveDown' },
  { value: 'bengkak', label: 'Bengkak', icon: 'Maximize' },
  { value: 'ruam', label: 'Ruam/Kemerahan', icon: 'Palette' },
  { value: 'sulit_menelan', label: 'Sulit Menelan', icon: 'Ban' },
]

export function getMockTriageResult(patientId: string): TriageResult {
  return MOCK_TRIAGE_RESULTS[patientId] || MOCK_TRIAGE_RESULTS['4']
}

export function hashData(data: string): string {
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return '0x' + Math.abs(hash).toString(16).padStart(64, '0')
}
