# X-TRACE — Panduan & Deskripsi Proyek
## Implementasi Algoritma XGBoost dan TF-IDF pada Sistem Cerdas Triase Pasien Terintegrasi Blockchain Audit Trail

**Tema:** Kesehatan  
**Event:** Hackathon  
**Tanggal:** Juni 2026

---

## 1. Permasalahan yang Diangkat

Proses triase pasien di Instalasi Gawat Darurat (IGD) rumah sakit Indonesia saat ini masih menghadapi berbagai tantangan serius yang berdampak langsung pada kualitas dan keselamatan pelayanan medis, di antaranya:

**a) Triase yang Subjektif dan Rawan Kesalahan**
Penilaian tingkat kegawatan pasien masih sangat bergantung pada pengalaman dan intuisi petugas triase secara individual. Tanpa alat bantu yang terstandarisasi, keputusan ini rentan terhadap bias manusia (human error), terutama di situasi IGD yang padat dan penuh tekanan. Kesalahan dalam menentukan prioritas — misalnya pasien kritis diklasifikasikan sebagai non-urgent — dapat berujung pada keterlambatan penanganan yang mengancam jiwa.

**b) Antrian yang Tidak Transparan dan Tidak Terstruktur**
Banyak IGD di rumah sakit belum memiliki sistem manajemen antrian digital yang terintegrasi. Pasien dan keluarga sering tidak mengetahui estimasi waktu tunggu atau posisi antriannya. Dokter dan perawat pun kesulitan memantau status seluruh pasien secara real-time dari satu tampilan terpusat, sehingga koordinasi antar unit (dokter, farmasi, admin) menjadi tidak efisien.

**c) Tidak Ada Jejak Audit Medis yang Dapat Dipercaya**
Keputusan triase, tindakan medis, hingga pemberian resep obat umumnya hanya tercatat di sistem internal rumah sakit yang bersifat terpusat dan mudah dimanipulasi. Tidak ada mekanisme yang menjamin bahwa data rekam medis tidak diubah setelah dicatat. Hal ini menimbulkan permasalahan serius dalam akuntabilitas medis, terutama jika terjadi sengketa atau klaim malpraktik.

**d) Lambatnya Alur Pelayanan dari Pendaftaran hingga Farmasi**
Fragmentasi informasi antar unit — dari admin pendaftaran, dokter pemeriksa, hingga apotek farmasi — menyebabkan alur pelayanan menjadi lambat. Resep dokter tidak langsung tersinkronisasi ke farmasi, pasien harus membawa dokumen fisik, dan tidak ada visibilitas status penyiapan obat secara real-time.

**e) Minimnya Pemanfaatan Data untuk Pengambilan Keputusan Klinis**
Data tanda vital dan keluhan pasien yang terkumpul dari ribuan kunjungan tidak dimanfaatkan secara optimal untuk mendukung keputusan klinis. Padahal, data tersebut berpotensi besar diolah menggunakan teknologi kecerdasan buatan untuk menghasilkan rekomendasi prioritas yang lebih akurat dan konsisten.

---

## 2. Solusi yang Ditawarkan

**X-TRACE** (eXplainable Triage & Record with Audit Chain Engine) adalah sebuah sistem informasi rumah sakit berbasis web yang cerdas dan terintegrasi, dirancang khusus untuk mengatasi permasalahan triase dan manajemen pelayanan IGD secara menyeluruh. Sistem ini menggabungkan tiga teknologi utama:

### 🤖 A. Kecerdasan Buatan: XGBoost + TF-IDF untuk Triase Otomatis

Inti dari sistem ini adalah model klasifikasi **XGBoost (Extreme Gradient Boosting)** yang telah dilatih menggunakan dataset medis berskala besar (±291.000 rekaman pasien gabungan data sintetis dan data rumah sakit nyata). Model ini mampu mengklasifikasikan tingkat kegawatan pasien ke dalam empat kategori — **CRITICAL, HIGH, MEDIUM,** dan **LOW** — hanya dalam hitungan milidetik.

Fitur input yang digunakan meliputi:
- Tanda-tanda vital numerik: usia, detak jantung (HR), tekanan darah sistolik (SBP), saturasi oksigen (SpO2), dan suhu tubuh
- Fitur turunan: **Shock Index** (HR/SBP sebagai indikator syok) dan **SIRS Alert** (indikator respons inflamasi sistemik)
- Fitur teks: keluhan utama pasien diproses menggunakan **TF-IDF (Term Frequency-Inverse Document Frequency)** untuk mengekstrak kata kunci medis yang relevan dari narasi keluhan bebas, kemudian dikonversi menjadi representasi vektor numerik yang dapat dipahami model

Selain itu, sistem menerapkan **Clinical Safety Override** berbasis aturan klinis WHO/AHA: jika SpO2 pasien di bawah 90%, sistem secara otomatis memaksa klasifikasi ke level Emergency, terlepas dari prediksi model, demi keselamatan pasien.

Setiap prediksi disertai **skor kepercayaan (confidence score)** dan **penjelasan alasan** dalam Bahasa Indonesia, sehingga keputusan AI tetap transparan dan dapat dipertanggungjawabkan oleh tenaga medis.

### ⛓️ B. Blockchain Audit Trail: Immutabilitas Rekam Medis

Setiap keputusan triase yang dikonfirmasi oleh admin atau dokter akan dicatat ke dalam **smart contract** di jaringan blockchain (Ethereum-compatible). Proses ini menghasilkan **transaction hash** unik yang tidak dapat dipalsukan atau dihapus.

Manfaat implementasi blockchain dalam sistem ini:
- **Immutabilitas**: Setelah data tersimpan di blockchain, tidak ada pihak manapun yang dapat mengubah atau menghapusnya
- **Transparansi**: Setiap perubahan status medis pasien (triage dikonfirmasi, diagnosis ditambahkan, resep dibuat, obat diserahkan) tercatat sebagai event on-chain yang dapat diverifikasi publik
- **Akuntabilitas**: Setiap aksi medis terikat pada identitas pengguna dan timestamp yang tidak dapat dimanipulasi
- **Audit Trail Digital**: Halaman dashboard audit menampilkan seluruh riwayat transaksi lengkap dengan link ke block explorer, sehingga dapat diverifikasi oleh pihak ketiga (BPJS, regulator, dll.)

### 🌐 C. Sistem Manajemen Pelayanan Terintegrasi Real-Time

X-TRACE menyediakan antarmuka berbasis web yang responsif dengan dashboard khusus untuk empat peran pengguna:

| Peran | Fungsi Utama |
|---|---|
| **Admin / Petugas Pendaftaran** | Input data pasien, tanda vital, keluhan → trigger AI triage → konfirmasi dan sinkronisasi ke blockchain |
| **Dokter** | Melihat antrian berdasarkan prioritas AI, melakukan pemeriksaan, menambahkan diagnosis dan resep obat |
| **Farmasi** | Menerima notifikasi resep real-time, memproses dan menandai obat sebagai selesai diserahkan |
| **Pasien** | Melihat status antrian, riwayat kunjungan, hasil triage, dan resep secara mandiri |

Seluruh data tersinkronisasi secara **real-time** menggunakan Supabase Realtime (PostgreSQL + WebSocket), sehingga perubahan yang dilakukan satu pengguna langsung terlihat di seluruh dashboard tanpa perlu refresh halaman.

### 🛠️ D. Stack Teknologi

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 15, TypeScript, Framer Motion, TailwindCSS |
| Backend AI | FastAPI (Python), XGBoost, TF-IDF (scikit-learn), joblib |
| Database | Supabase (PostgreSQL) dengan RLS, realtime subscription |
| Blockchain | Hardhat 3, Solidity, Ethereum-compatible network |
| Auth | bcryptjs, session berbasis localStorage |

### 🎯 E. Dampak yang Diharapkan

- **Akurasi triase meningkat**: Model XGBoost mencapai akurasi >91% pada dataset uji, mengurangi risiko kesalahan klasifikasi prioritas pasien
- **Waktu triase lebih cepat**: Dari rata-rata 5–15 menit menjadi <30 detik dengan bantuan AI
- **Kepercayaan publik meningkat**: Rekam medis yang tercatat di blockchain memberikan jaminan transparansi yang tidak bisa diberikan oleh sistem konvensional
- **Alur pelayanan lebih efisien**: Integrasi real-time antar unit menghilangkan bottleneck komunikasi manual antar departemen IGD

---

## 3. Deskripsi Fitur yang Akan Dibuat dan Progress Saat Ini

Berikut adalah daftar seluruh fitur dalam sistem X-TRACE beserta status pengerjaannya hingga tahap checkpoint ini:

---

### 🔐 A. Autentikasi & Manajemen Akun

| Fitur | Status |
|---|---|
| Halaman Login (semua role) | ✅ **Selesai** |
| Halaman Register (pasien, dokter, farmasi, admin) | ✅ **Selesai** |
| Sistem hashing password dengan bcrypt (rounds=12) | ✅ **Selesai** |
| Role-based redirect setelah login (admin/dokter/farmasi/pasien) | ✅ **Selesai** |
| Protected Route — cegah akses halaman tanpa login | ✅ **Selesai** |
| Sistem persetujuan registrasi dokter/farmasi/admin oleh admin (pending approval) | ✅ **Selesai** |
| Halaman verifikasi & persetujuan registrasi staff (oleh admin) | ✅ **Selesai** |
| Fitur ganti password | ✅ **Selesai** |
| Logout & clear session | ✅ **Selesai** |

---

### 🏠 B. Landing Page & UI Umum

| Fitur | Status |
|---|---|
| Landing page rumah sakit (hero, layanan, keunggulan, alur kerja, kontak) | ✅ **Selesai** |
| Dark mode / Light mode toggle | ✅ **Selesai** |
| Animasi Framer Motion (SlideUp, StaggerContainer, AnimatedCard) | ✅ **Selesai** |
| Navbar responsif (mobile & desktop) | ✅ **Selesai** |
| Footer | ✅ **Selesai** |
| Halaman 404 Not Found kustom | ✅ **Selesai** |
| Skeleton loader saat data loading | ✅ **Selesai** |

---

### 🖥️ C. Dashboard Admin (Petugas Pendaftaran IGD)

| Fitur | Status |
|---|---|
| Dashboard utama admin (ringkasan statistik antrian) | ✅ **Selesai** |
| Form multi-step pendaftaran pasien baru (data diri + tanda vital + gejala + keluhan) | ✅ **Selesai** |
| Integrasi API AI untuk trigger prediksi triage saat input selesai | ✅ **Selesai** |
| Tampilan hasil triage AI (prioritas, confidence, rekomendasi, estimasi waktu tunggu) | ✅ **Selesai** |
| Konfirmasi hasil triage dan masukkan ke antrian | ✅ **Selesai** |
| Manajemen antrian admin (lihat status semua pasien) | ✅ **Selesai** |
| Halaman verifikasi & approve registrasi staff | ✅ **Selesai** |
| Halaman audit trail (tampilkan riwayat blockchain) | ⚠️ **Sebagian** — UI halaman belum diisi penuh |

---

### 👨‍⚕️ D. Dashboard Dokter

| Fitur | Status |
|---|---|
| Dashboard utama dokter (statistik pasien ditangani) | ✅ **Selesai** |
| Daftar antrian pasien diurutkan berdasarkan prioritas AI (CRITICAL → LOW) | ✅ **Selesai** |
| Ambil pasien dari antrian (assign dokter ke kunjungan) | ✅ **Selesai** |
| Halaman pemeriksaan pasien: lihat detail tanda vital, gejala, hasil AI | ✅ **Selesai** |
| Input diagnosis dokter | ✅ **Selesai** |
| Input resep obat (multi-item: nama obat, dosis, frekuensi, durasi, catatan) | ✅ **Selesai** |
| Selesaikan kunjungan & trigger ke antrian farmasi | ✅ **Selesai** |
| Halaman riwayat pasien yang sudah ditangani | ✅ **Selesai** |

---

### 💊 E. Dashboard Farmasi

| Fitur | Status |
|---|---|
| Dashboard utama farmasi (statistik resep pending/processing/completed) | ✅ **Selesai** |
| Daftar antrian resep masuk dari dokter secara real-time | ✅ **Selesai** |
| Lihat detail resep per pasien (nama obat, dosis, frekuensi, durasi) | ✅ **Selesai** |
| Update status penyiapan obat: PENDING → PROCESSING → COMPLETED | ✅ **Selesai** |
| Riwayat transaksi farmasi yang telah diselesaikan | ✅ **Selesai** |

---

### 👤 F. Dashboard Pasien

| Fitur | Status |
|---|---|
| Dashboard utama pasien (sambutan, ringkasan status) | ✅ **Selesai** |
| Lihat status antrian real-time (nomor antrian, posisi, estimasi waktu) | ✅ **Selesai** |
| Lihat hasil triage AI (prioritas, confidence score, penjelasan alasan) | ✅ **Selesai** |
| Lihat riwayat kunjungan sebelumnya | ✅ **Selesai** |
| Lihat resep obat dari dokter | ✅ **Selesai** |
| Lihat detail diagnosis per kunjungan | ✅ **Selesai** |
| Verifikasi blockchain hash rekam medis (link ke block explorer) | ⚠️ **Sebagian** — hash tersimpan di DB, tombol verifikasi belum aktif |

---

### 🤖 G. AI Engine — Model XGBoost + TF-IDF

| Fitur | Status |
|---|---|
| Dataset preprocessing & feature engineering (notebook `data_prep.ipynb`) | ✅ **Selesai** |
| Training model XGBoost dengan 291.000+ data rekam medis | ✅ **Selesai** |
| Model terlatih tersimpan sebagai artifact (`xgboost_triage_model.joblib`, 3.35 MB) | ✅ **Selesai** |
| FastAPI server dengan endpoint `/predict` (input vital signs → output prioritas) | ✅ **Selesai** |
| Derived features: Shock Index dan SIRS Alert | ✅ **Selesai** |
| Clinical Safety Override: SpO2 < 90% → paksa Emergency (WHO/AHA standard) | ✅ **Selesai** |
| Output Blockchain-ready: `confidence_onchain` dalam basis points (Solidity-safe) | ✅ **Selesai** |
| Endpoint `/model-info` untuk metadata model | ✅ **Selesai** |
| Endpoint `/health` untuk liveness probe | ✅ **Selesai** |
| CORS konfigurasi untuk koneksi dengan frontend | ✅ **Selesai** |
| Integrasi TF-IDF untuk analisis teks keluhan pasien | ⚠️ **Dalam Pengerjaan** |

---

### ⛓️ H. Blockchain Audit Trail

| Fitur | Status |
|---|---|
| Hardhat 3 project setup & konfigurasi | ✅ **Selesai** |
| Smart Contract `TriageAuditTrail.sol` (logTriage, verifyTriage, emit events) | ❌ **Belum Dikerjakan** |
| Deploy smart contract ke testnet (Sepolia / OP Sepolia) | ❌ **Belum Dikerjakan** |
| Integrasi ethers.js / wagmi di frontend untuk memanggil contract | ❌ **Belum Dikerjakan** |
| Simpan transaction hash ke database (kolom `blockchain_hash` di tabel `visits`) | ⚠️ **Sebagian** — kolom sudah ada di DB, pemanggilan contract belum ada |
| Tampilan audit trail di dashboard admin (daftar semua tx hash + block number) | ⚠️ **Sebagian** — UI struktur ada, data belum terisi dari blockchain nyata |
| Link verifikasi ke block explorer (Etherscan / OP-scan) | ⚠️ **Sebagian** — kolom `block_explorer_url` ada di DB, belum aktif di UI |

---

### 🗄️ I. Database & Backend (Supabase)

| Fitur | Status |
|---|---|
| Schema database lengkap (9 tabel, 5 ENUM, 20+ index) | ✅ **Selesai** |
| Row Level Security (RLS) per tabel dan per role | ✅ **Selesai** |
| 3 Database Views (`v_queue_full`, `v_pharmacy_queue`, `v_audit_dashboard`) | ✅ **Selesai** |
| Seed data: 25 master gejala, default users, default patients | ✅ **Selesai** |
| Trigger auto-update `updated_at` | ✅ **Selesai** |
| Realtime subscription (WebSocket) untuk sinkronisasi antar dashboard | ✅ **Selesai** |
| Tabel `pending_registrations` untuk approval workflow staff | ⚠️ **Dalam Pengerjaan** — digunakan di kode tapi belum ada di schema resmi |

---

### 📊 Rekapitulasi Progress Keseluruhan

| Komponen | Progress |
|---|---|
| 🔐 Autentikasi & Akun | ✅ 100% |
| 🏠 Landing Page & UI Umum | ✅ 100% |
| 🖥️ Dashboard Admin | ✅ ~90% |
| 👨‍⚕️ Dashboard Dokter | ✅ ~95% |
| 💊 Dashboard Farmasi | ✅ ~95% |
| 👤 Dashboard Pasien | ✅ ~85% |
| 🤖 AI Engine (XGBoost) | ⚠️ ~85% |
| ⛓️ Blockchain Audit Trail | ❌ ~15% |
| 🗄️ Database & Backend | ✅ ~90% |
| **TOTAL KESELURUHAN** | **~65–68%** |

