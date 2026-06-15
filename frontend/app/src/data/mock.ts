import type { QueuePatient, AuditRecord, TriageResult, PatientData } from '@/types'

export const MOCK_TRIAGE_RESULTS: Record<string, TriageResult> = {
  '1': {
    priority: 'CRITICAL',
    priorityLabel: 'KRITIS',
    confidence: 0.94,
    reasoning: [
      'Pasien menunjukkan tanda-tanda sindrom koroner akut (nyeri dada hebat dengan iradiasi ke lengan kiri)',
      'Tekanan darah 90/60 mmHg menunjukkan hipotensi — tanda syok kardiogenik',
      'Denyut jantung 110 bpm (takikardia sinus) menunjukkan kompensasi kardiovaskular',
      ' Saturasi oksigen 88% menunjukkan hipoksia signifikan — risiko iskemia miokard',
      'Keringat dingin dan mual merupakan tanda autonomi yang mendukung diagnosis ACS'
    ],
    recommendedAction: 'Segera bawa ke Ruang Gawat Darurat. Berikan oksigen 15L/menit via masker non-rebreathing. Pasang akses intravena. EKG 12 lead segera. Siapkan nitrogliserin dan morfin. Hubungi dokter spesialis jantung.',
    estimatedWaitTime: 'SEGERA (0 menit)',
    color: 'text-red-600 bg-red-50 border-red-200'
  },
  '2': {
    priority: 'HIGH',
    priorityLabel: 'TINGGI',
    confidence: 0.89,
    reasoning: [
      'Demam tinggi 39.5°C dengan kejang demam berulang memerlukan evaluasi neurologis segera',
      'Kejang berlangsung >5 menit (status epileptikus febrile) — risiko kerusakan otak',
      'Tonus otot rigid (kejang tonik-klonik) dengan riwayat demam mendadak',
      'Anak berusia 3 tahun — sistem saraf masih berkembang, lebih rentan terhadap komplikasi',
      'Lelah setelah kejang (post-ictal state) memerlukan observasi intensif'
    ],
    recommendedAction: 'Stabilisasi airway-breathing-circulation. Berikan antipiretik (parasetamol 10-15mg/kg). Siapkan diazepam rektal 0.5mg/kg jika kejang berulang. Monitor suhu tiap 15 menit. Rujuk ke RS jika kejang berlanjut >10 menit.',
    estimatedWaitTime: '< 10 menit',
    color: 'text-orange-600 bg-orange-50 border-orange-200'
  },
  '3': {
    priority: 'MEDIUM',
    priorityLabel: 'SEDANG',
    confidence: 0.82,
    reasoning: [
      'Sesak napas progresif selama 3 hari dengan riwayat asma bronkial menunjukkan eksaserbasi',
      'Frekuensi napas 28x/menit (takipnea) menunjukkan peningkatan kerja pernapasan',
      ' saturasi oksigen 92% — masih dalam batas moderat namun memerlukan monitoring',
      'Penggunaan otot bantu napas (retraksi dinding dada) menunjukkan distress pernapasan',
      'Riwayat trigger: paparan debu dan cuaca dingin — faktor lingkungan yang dapat dikontrol'
    ],
    recommendedAction: 'Berikan nebulizer salbutamol 2.5mg. Monitor saturasi oksigen tiap 15 menit. Jika tidak membaik dalam 30 menit, pertimbangkan hidrokortison 100mg IV dan rujuk ke RS.',
    estimatedWaitTime: '30-60 menit',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
  },
  '4': {
    priority: 'LOW',
    priorityLabel: 'RENDAH',
    confidence: 0.91,
    reasoning: [
      'Batuk pilek ringan selama 2 hari tanpa demam tinggi — kemungkinan ISPA ringan',
      'Tekanan darah normal 120/80 mmHg, denyut jantung normal 78 bpm',
      'Saturasi oksigen 97% — dalam batas normal',
      'Tidak ada tanda bahaya: tidak ada sesak napas, tidak ada nyeri dada, tidak ada penurunan kesadaran',
      'Vital signs stabil, pasien tampak tidak dalam distress'
    ],
    recommendedAction: 'Perawatan suportif: istirahat cukup, minum air hangat, parasetamol jika demam. Obat batuk jika mengganggu tidur. Edukasi tanda bahaya yang perlu segera ke fasilitas kesehatan. Kontrol ulang jika tidak membaik dalam 5 hari.',
    estimatedWaitTime: '60-120 menit',
    color: 'text-green-600 bg-green-50 border-green-200'
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
    details: 'Triage: KRITIS (ACS/Chest Pain) | Confirmed by: dr. Ahmad Fauzi, Sp.PD | AI Confidence: 94%'
  },
  {
    id: '2',
    patientName: 'Dewi Lestari',
    timestamp: new Date('2026-06-09T07:55:30'),
    action: 'AI TRIAGE + KONFIRMASI',
    triagePriority: 'HIGH',
    txHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
    blockNumber: 67890087,
    verified: true,
    details: 'Triage: TINGGI (Dehydration/Severe Diarrhea) | Confirmed by: dr. Sari Indah, Sp.A | AI Confidence: 87%'
  },
  {
    id: '3',
    patientName: 'Agus Salim',
    timestamp: new Date('2026-06-09T07:30:45'),
    action: 'AI TRIAGE + KONFIRMASI',
    triagePriority: 'MEDIUM',
    txHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6',
    blockNumber: 67890045,
    verified: true,
    details: 'Triage: SEDANG (Soft Tissue Injury) | Confirmed by: dr. Rudi Hartono | AI Confidence: 78%'
  },
  {
    id: '4',
    patientName: 'Rina Wulandari',
    timestamp: new Date('2026-06-09T07:10:00'),
    action: 'AI TRIAGE + KONFIRMASI',
    triagePriority: 'LOW',
    txHash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
    blockNumber: 67890012,
    verified: true,
    details: 'Triage: RENDAH (Common Cold) | Confirmed by: dr. Maya Sari | AI Confidence: 92%'
  },
  {
    id: '5',
    patientName: 'Hendra Wijaya',
    timestamp: new Date('2026-06-09T06:45:20'),
    action: 'AI TRIAGE + KONFIRMASI',
    triagePriority: 'CRITICAL',
    txHash: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8',
    blockNumber: 67889978,
    verified: true,
    details: 'Triage: KRITIS (Anaphylaxis) | Confirmed by: dr. Ahmad Fauzi, Sp.PD | AI Confidence: 96%'
  },
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
