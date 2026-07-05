"""
Rule-based NLP Parser Bahasa Indonesia — Ekstraksi Vital Sign & Gejala
========================================================================

KONTEKS: parser ini untuk MODE INPUT TEKS BEBAS di form triase (opsional,
pelengkap form terstruktur -- lihat keputusan "form cepat" sebelumnya).
Form terstruktur (dropdown/angka) tetap jadi cara input UTAMA karena
paling cepat dan akurat. Parser ini berguna kalau perawat lebih nyaman
mengetik satu kalimat cepat ketimbang mengisi field satu-satu, atau untuk
melengkapi catatan chief complaint yang lebih naratif.

BERBEDA DARI NLP DI NOTEBOOK TRAINING:
- Notebook (chief_complaints.csv) memproses teks BAHASA INGGRIS dari
  dataset training (vocabulary ~560 kata, dipakai untuk melatih model).
- Parser ini memproses teks BAHASA INDONESIA yang diketik perawat secara
  LIVE saat produksi digunakan di rumah sakit Indonesia. Dua hal yang
  berbeda konteks meski sama-sama "rule-based, bukan model bahasa besar".

KENAPA RULE-BASED, BUKAN IndoBERT (keputusan yang sudah diambil sebelumnya):
- Fine-tuning IndoBERT butuh dataset ber-anotasi NER yang besar, waktu
  training, dan GPU -- tidak sepadan untuk hackathon 2 minggu.
- Kalimat yang diketik perawat saat triase cenderung singkat, formulaik
  ("TD 170/100, nadi 100, sesak, nyeri dada"), mirip pola chief complaint
  di dataset training -- rule-based cukup akurat untuk kasus ini.
- Perlu diaudit reasoning-nya (bagian dari prinsip explainable AI) --
  rule-based 100% transparan, sementara model bahasa besar tidak.

CARA PAKAI:
    from nlp_parser_indonesia import parse_free_text

    hasil = parse_free_text("pasien pusing, mual, TD 170/100, demam 3 hari")
    # -> dict berisi vital sign yang berhasil diekstrak + daftar gejala
    #    + flag severity, siap digabung dengan field form terstruktur
"""

import re
from dataclasses import dataclass, field


# ============================================================
# 1. KAMUS GEJALA (symptom keywords -> kategori standar)
# ============================================================
# Kategori disusun mengikuti pola chief_complaint_system di dataset
# training (cardiovascular, respiratory, neurological, dst) supaya
# hasil parser bisa dipetakan ke fitur yang sama dengan model.

SYMPTOM_KEYWORDS = {
    # kata kunci (lowercase) -> (kategori, level_severity_dasar)
    "nyeri dada": ("cardiovascular", 2),
    "sakit dada": ("cardiovascular", 2),
    "dada berdebar": ("cardiovascular", 1),
    "jantung berdebar": ("cardiovascular", 1),

    "sesak": ("respiratory", 2),
    "sesak napas": ("respiratory", 2),
    "sulit bernapas": ("respiratory", 2),
    "batuk": ("respiratory", 0),
    "batuk darah": ("respiratory", 2),

    "pusing": ("neurological", 0),
    "sakit kepala": ("neurological", 0),
    "sakit kepala hebat": ("neurological", 2),
    "kejang": ("neurological", 2),
    "lumpuh": ("neurological", 2),
    "bicara pelo": ("neurological", 2),
    "tidak sadar": ("neurological", 3),
    "pingsan": ("neurological", 2),
    "bingung": ("neurological", 1),

    "mual": ("gastrointestinal", 0),
    "muntah": ("gastrointestinal", 0),
    "muntah darah": ("gastrointestinal", 2),
    "diare": ("gastrointestinal", 0),
    "nyeri perut": ("gastrointestinal", 1),
    "sakit perut": ("gastrointestinal", 1),

    "demam": ("infectious", 0),
    "menggigil": ("infectious", 1),

    "nyeri sendi": ("musculoskeletal", 0),
    "patah tulang": ("musculoskeletal", 2),
    "bengkak": ("musculoskeletal", 0),

    "luka": ("trauma", 1),
    "luka terbuka": ("trauma", 1),
    "perdarahan": ("trauma", 2),
    "pendarahan": ("trauma", 2),
    "kecelakaan": ("trauma", 2),
    "jatuh": ("trauma", 1),

    "gelisah": ("psychiatric", 0),
    "cemas": ("psychiatric", 0),
    "ingin bunuh diri": ("psychiatric", 3),
}

# Kata yang menaikkan severity gejala di sekitarnya
SEVERITY_BOOST_WORDS = ["hebat", "berat", "parah", "sangat", "akut", "mendadak", "tiba-tiba"]

# Kata negasi -- kalau muncul tepat sebelum keyword gejala, gejala itu
# TIDAK dihitung sebagai temuan positif. Penting secara klinis: "tidak
# sesak" harus diperlakukan berbeda dari "sesak" -- kalau tidak ditangani,
# parser bisa salah menaikkan urgensi berdasarkan gejala yang justru
# disangkal oleh perawat/pasien.
NEGATION_WORDS_SEBELUM = ["tidak", "tanpa", "bukan", "no", "negatif"]
NEGATION_WORDS_SESUDAH = ["disangkal", "negatif", "tidak ada", "tidak dijumpai", "tidak ditemukan"]
JARAK_NEGASI_MAKS = 15  # jumlah karakter maksimum sebelum/sesudah keyword untuk dicek negasinya

# Kata yang menandakan durasi -- dipakai sebagai sinyal tambahan
# (durasi lebih lama pada kasus tertentu bisa menandakan kondisi kronis,
# durasi sangat singkat + severity tinggi mengarah ke kondisi akut)
DURATION_PATTERN = re.compile(
    r"(\d+)\s*(hari|jam|menit|minggu|bulan)", re.IGNORECASE
)


# ============================================================
# 2. EKSTRAKSI VITAL SIGN VIA REGEX
# ============================================================
# Pola regex dibuat toleran terhadap variasi penulisan yang umum
# dipakai tenaga medis Indonesia (singkatan TD, HR, RR, dst).

VITAL_PATTERNS = {
    "systolic_bp_diastolic_bp": re.compile(
        r"(?:td|tekanan darah|tensi)\s*[:=]?\s*(\d{2,3})\s*/\s*(\d{2,3})",
        re.IGNORECASE,
    ),
    "heart_rate": re.compile(
        r"(?:nadi|hr|heart rate|denyut)\s*[:=]?\s*(\d{2,3})\s*(?:x/menit|bpm|/menit)?",
        re.IGNORECASE,
    ),
    "respiratory_rate": re.compile(
        r"(?:rr|napas|pernapasan|respirasi)\s*[:=]?\s*(\d{1,2})\s*(?:x/menit|/menit)?",
        re.IGNORECASE,
    ),
    "spo2": re.compile(
        r"(?:spo2|saturasi|sat o2|saturasi oksigen)\s*[:=]?\s*(\d{2,3})\s*%?",
        re.IGNORECASE,
    ),
    "temperature_c": re.compile(
        r"(?:suhu|temp|temperatur)\s*[:=]?\s*(\d{2}(?:[.,]\d)?)\s*(?:°?c)?",
        re.IGNORECASE,
    ),
    "gcs_total": re.compile(
        r"(?:gcs)\s*[:=]?\s*(\d{1,2})",
        re.IGNORECASE,
    ),
    "pain_score": re.compile(
        r"(?:nyeri|skala nyeri|pain score)\s*[:=]?\s*(\d{1,2})\s*(?:/\s*10)?",
        re.IGNORECASE,
    ),
    "age": re.compile(
        r"(?:usia|umur)\s*[:=]?\s*(\d{1,3})\s*(?:tahun|thn)?",
        re.IGNORECASE,
    ),
}


@dataclass
class HasilParsing:
    """Struktur hasil parsing teks bebas, siap digabung ke feature vector model."""

    vital_signs: dict = field(default_factory=dict)
    gejala_terdeteksi: list = field(default_factory=list)
    gejala_dinegasikan: list = field(default_factory=list)
    kategori_gejala: set = field(default_factory=set)
    severity_max: int = 0
    durasi_terdeteksi: list = field(default_factory=list)
    cc_severity_flag: int = 0        # kompatibel dengan fitur di training
    cc_word_count: int = 0           # kompatibel dengan fitur di training
    teks_asli: str = ""
    peringatan: list = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "vital_signs": self.vital_signs,
            "gejala_terdeteksi": self.gejala_terdeteksi,
            "gejala_dinegasikan": self.gejala_dinegasikan,
            "kategori_gejala": sorted(self.kategori_gejala),
            "severity_max": self.severity_max,
            "durasi_terdeteksi": self.durasi_terdeteksi,
            "cc_severity_flag": self.cc_severity_flag,
            "cc_word_count": self.cc_word_count,
            "peringatan": self.peringatan,
        }


def _ekstrak_vital_signs(teks: str) -> dict:
    """Ekstrak vital sign numerik dari teks memakai regex yang sudah didefinisikan."""
    hasil = {}
    teks_lower = teks.lower()

    m = VITAL_PATTERNS["systolic_bp_diastolic_bp"].search(teks_lower)
    if m:
        hasil["systolic_bp"] = int(m.group(1))
        hasil["diastolic_bp"] = int(m.group(2))

    for key in ["heart_rate", "respiratory_rate", "spo2", "gcs_total", "pain_score", "age"]:
        m = VITAL_PATTERNS[key].search(teks_lower)
        if m:
            hasil[key] = int(m.group(1))

    m = VITAL_PATTERNS["temperature_c"].search(teks_lower)
    if m:
        hasil["temperature_c"] = float(m.group(1).replace(",", "."))

    return hasil


def _validasi_rentang_vital(vital_signs: dict) -> list:
    """
    Validasi rentang wajar untuk tiap vital sign yang berhasil diekstrak.
    Mengembalikan daftar peringatan jika ada nilai di luar rentang fisiologis
    manusia -- penting supaya salah parsing (mis. salah tangkap angka lain
    sebagai HR) tidak lolos tanpa disadari petugas.
    """
    rentang_wajar = {
        "systolic_bp": (50, 260),
        "diastolic_bp": (30, 150),
        "heart_rate": (20, 250),
        "respiratory_rate": (4, 60),
        "spo2": (50, 100),
        "temperature_c": (30.0, 43.0),
        "gcs_total": (3, 15),
        "pain_score": (0, 10),
        "age": (0, 120),
    }

    peringatan = []
    for key, val in vital_signs.items():
        if key in rentang_wajar:
            low, high = rentang_wajar[key]
            if not (low <= val <= high):
                peringatan.append(
                    f"Nilai {key}={val} di luar rentang wajar ({low}-{high}). "
                    f"Kemungkinan salah parsing -- mohon verifikasi manual."
                )
    return peringatan


def _ada_negasi(teks_lower: str, idx_keyword: int, panjang_keyword: int) -> bool:
    """
    Cek apakah ada kata negasi di sekitar posisi keyword gejala, baik
    SEBELUM (mis. "tidak sesak") maupun SESUDAH (mis. "nyeri dada
    disangkal") -- pola bahasa medis Indonesia bisa memakai keduanya.
    """
    awal_sebelum = max(0, idx_keyword - JARAK_NEGASI_MAKS)
    window_sebelum = teks_lower[awal_sebelum:idx_keyword]
    if any(neg in window_sebelum for neg in NEGATION_WORDS_SEBELUM):
        return True

    akhir_sesudah = idx_keyword + panjang_keyword + JARAK_NEGASI_MAKS
    window_sesudah = teks_lower[idx_keyword + panjang_keyword: akhir_sesudah]
    if any(neg in window_sesudah for neg in NEGATION_WORDS_SESUDAH):
        return True

    return False


def _ekstrak_gejala(teks: str) -> tuple:
    """
    Cari kata kunci gejala di teks, kembalikan daftar gejala terdeteksi,
    kategori sistem tubuh terkait, dan severity maksimum yang ditemukan.
    Gejala yang didahului kata negasi ("tidak", "tanpa", dst) DIABAIKAN
    dari temuan positif, tapi tetap dicatat terpisah untuk transparansi.
    """
    teks_lower = teks.lower()
    gejala_terdeteksi = []
    gejala_dinegasikan = []
    kategori = set()
    severity_max = 0

    for keyword, (kat, sev_dasar) in SYMPTOM_KEYWORDS.items():
        idx = teks_lower.find(keyword)
        if idx == -1:
            continue

        if _ada_negasi(teks_lower, idx, len(keyword)):
            gejala_dinegasikan.append(keyword)
            continue

        sev = sev_dasar
        window = teks_lower[max(0, idx - 20): idx + len(keyword) + 20]
        if any(boost in window for boost in SEVERITY_BOOST_WORDS):
            sev = min(sev + 1, 3)

        gejala_terdeteksi.append({"gejala": keyword, "severity": sev})
        kategori.add(kat)
        severity_max = max(severity_max, sev)

    return gejala_terdeteksi, kategori, severity_max, gejala_dinegasikan


def _ekstrak_durasi(teks: str) -> list:
    """Cari pola durasi (mis. '3 hari', '2 jam') di teks."""
    return [f"{jumlah} {satuan}" for jumlah, satuan in DURATION_PATTERN.findall(teks)]


def parse_free_text(teks: str) -> HasilParsing:
    """
    Fungsi utama: parsing teks bebas Bahasa Indonesia menjadi struktur data
    vital sign + gejala, siap digabung dengan field form terstruktur.

    Parameter:
        teks: kalimat bebas yang diketik perawat, mis.
              "pasien pusing, mual, TD 170/100, demam 3 hari"

    Return:
        HasilParsing -- gunakan .to_dict() untuk serialisasi ke JSON/API response
    """
    if not teks or not teks.strip():
        return HasilParsing(teks_asli=teks, peringatan=["Teks kosong, tidak ada yang bisa diparsing."])

    vital_signs = _ekstrak_vital_signs(teks)
    peringatan_rentang = _validasi_rentang_vital(vital_signs)

    gejala_terdeteksi, kategori, severity_max, gejala_dinegasikan = _ekstrak_gejala(teks)
    durasi = _ekstrak_durasi(teks)

    # cc_severity_flag & cc_word_count -- selaras dengan fitur yang
    # sudah dipakai di training model (lihat notebook, bagian 6.2)
    severity_words_id = ["parah", "berat", "hebat", "akut", "mendadak", "gawat", "kritis"]
    cc_severity_flag = int(any(w in teks.lower() for w in severity_words_id) or severity_max >= 2)
    cc_word_count = len(teks.split())

    hasil = HasilParsing(
        vital_signs=vital_signs,
        gejala_terdeteksi=gejala_terdeteksi,
        gejala_dinegasikan=gejala_dinegasikan,
        kategori_gejala=kategori,
        severity_max=severity_max,
        durasi_terdeteksi=durasi,
        cc_severity_flag=cc_severity_flag,
        cc_word_count=cc_word_count,
        teks_asli=teks,
        peringatan=peringatan_rentang,
    )

    if not vital_signs and not gejala_terdeteksi:
        hasil.peringatan.append(
            "Tidak ada vital sign maupun gejala yang berhasil dikenali. "
            "Disarankan gunakan form terstruktur untuk kasus ini."
        )

    return hasil


# ============================================================
# 3. CONTOH PENGGUNAAN & SELF-TEST
# ============================================================

if __name__ == "__main__":
    contoh_kalimat = [
        "pasien pusing, mual, TD 170/100, demam 3 hari",
        "nyeri dada hebat sejak 30 menit, sesak napas, nadi 110, spo2 91",
        "usia 45 tahun, luka terbuka di kaki akibat kecelakaan motor, perdarahan aktif",
        "kontrol rutin, tidak ada keluhan, TD 120/80, suhu 36.5",
        "GCS 7, tidak sadar, napas 8x/menit, tekanan darah 80/50",
        "anak demam 2 hari, batuk, tidak sesak",
        "",  # kasus kosong
        "pasien mengeluh sakit kepala dan pusing tanpa angka vital sign apapun",
        "tidak ada nyeri dada, tidak sesak, tidak demam, hanya kontrol obat rutin",
        "nyeri dada disangkal, pasien datang untuk cek tensi rutin TD 130/85",
    ]

    print("=" * 78)
    print("SELF-TEST -- Rule-Based NLP Parser Bahasa Indonesia")
    print("=" * 78)

    for kalimat in contoh_kalimat:
        print(f"\nInput  : \"{kalimat}\"")
        hasil = parse_free_text(kalimat)
        print(f"Output : {hasil.to_dict()}")
