"""
FastAPI Backend — X-Trace AI Engine
====================================
Endpoints:
  POST /predict     — Prediksi ESI level dari vital signs (XGBoost 61 fitur)
  POST /parse-text  — Parsing teks bebas Bahasa Indonesia (NLP rule-based)
  GET  /health      — Health check
"""

import os
import logging
from datetime import datetime
from typing import Optional, List

# pyrefly: ignore [missing-import]
import joblib
# pyrefly: ignore [missing-import]
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from nlp_parser_indonesia import parse_free_text

# ─── Logging ──────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("xtrace-ai")

# ─── Load Model ──────────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model", "xgb_triage_model.joblib")
model = joblib.load(MODEL_PATH)
logger.info(f"Model loaded from {MODEL_PATH}")
logger.info(f"Model expects {len(model.get_booster().feature_names)} features")

FEATURE_ORDER = model.get_booster().feature_names

# ─── Label Encoding Maps (replicated from notebook) ─────
# LabelEncoder uses sorted alphabetical order, so these match training exactly.
LABEL_ENCODINGS = {
    "arrival_mode": {"ambulance": 0, "brought_by_family": 1, "helicopter": 2, "police": 3, "transfer": 4, "walk-in": 5},
    "arrival_day": {"Friday": 0, "Monday": 1, "Saturday": 2, "Sunday": 3, "Thursday": 4, "Tuesday": 5, "Wednesday": 6},
    "arrival_season": {"autumn": 0, "spring": 1, "summer": 2, "winter": 3},
    "shift": {"afternoon": 0, "evening": 1, "morning": 2, "night": 3},
    "age_group": {"elderly": 0, "middle_aged": 1, "pediatric": 2, "young_adult": 3},
    "sex": {"F": 0, "M": 1, "Other": 2},
    "language": {"Arabic": 0, "English": 1, "Estonian": 2, "Finnish": 3, "Other": 4, "Russian": 5, "Somali": 6, "Swedish": 7},
    "insurance_type": {"military": 0, "none": 1, "private": 2, "public": 3, "unknown": 4},
    "transport_origin": {"home": 0, "nursing_home": 1, "other_hospital": 2, "outdoor": 3, "public_space": 4, "school": 5, "workplace": 6},
    "pain_location": {"abdomen": 0, "back": 1, "chest": 2, "extremity": 3, "head": 4, "multiple": 5, "none": 6, "pelvis": 7, "unknown": 8},
    "mental_status_triage": {"agitated": 0, "alert": 1, "confused": 2, "drowsy": 3, "unresponsive": 4},
    "chief_complaint_system": {"ENT": 0, "cardiovascular": 1, "dermatological": 2, "endocrine": 3, "gastrointestinal": 4, "genitourinary": 5, "infectious": 6, "musculoskeletal": 7, "neurological": 8, "ophthalmic": 9, "other": 10, "psychiatric": 11, "respiratory": 12, "trauma": 13},
}

# Map frontend mental_status values to training dataset values
MENTAL_STATUS_MAP = {
    "alert": "alert",
    "verbal": "drowsy",      # closest mapping
    "pain": "confused",       # closest mapping
    "unresponsive": "unresponsive",
}

# SHAP-friendly feature labels (Bahasa Indonesia)
FEATURE_LABELS = {
    "gcs_total": "GCS Total",
    "pain_score": "Skor Nyeri",
    "mental_status_triage": "Status Mental",
    "systolic_bp": "Tekanan Sistolik",
    "diastolic_bp": "Tekanan Diastolik",
    "mean_arterial_pressure": "MAP",
    "pulse_pressure": "Pulse Pressure",
    "respiratory_rate": "Frek. Napas",
    "spo2": "SpO2",
    "heart_rate": "Denyut Jantung",
    "temperature_c": "Suhu Tubuh",
    "age": "Usia",
    "shock_index": "Shock Index",
    "news2_score": "NEWS2 Score",
    "arrival_mode": "Cara Datang",
    "num_comorbidities": "Jumlah Komorbid",
    "bmi": "BMI",
    "weight_kg": "Berat Badan",
    "cc_severity_flag": "Flag Keparahan",
    "cc_word_count": "Jumlah Kata Keluhan",
}

# ─── Pydantic Models ────────────────────────────────────

class PredictRequest(BaseModel):
    """Input dari form triase frontend."""
    patient_id: str = ""
    gcs_total: int = Field(15, ge=3, le=15)
    pain_score: int = Field(0, ge=0, le=10)
    mental_status_triage: str = "alert"  # alert/verbal/pain/unresponsive
    systolic_bp: float = Field(..., gt=0)
    diastolic_bp: float = Field(..., gt=0)
    respiratory_rate: float = Field(..., gt=0)
    spo2: float = Field(..., gt=0, le=100)
    heart_rate: float = Field(..., gt=0)
    temperature_c: float = Field(..., gt=30, lt=45)
    age: int = Field(30, ge=0, le=120)
    chief_complaint: str = ""
    riwayat_kronis_berulang: bool = False
    # Opsional: sex untuk mapping lebih akurat
    sex: Optional[str] = None  # "L"/"P" dari frontend


class ShapFeature(BaseModel):
    feature: str
    label: str
    shap_value: float
    raw_value: float
    unit: str = ""


class PredictResponse(BaseModel):
    esi_level: int
    confidence: float
    shap_features: List[ShapFeature]
    reasoning_text: str
    is_skip_triage: bool = False
    # Legacy fields for backward compatibility
    priority: str
    priorityLabel: str
    recommendedAction: str
    estimatedWaitTime: str
    color: str


class ParseTextRequest(BaseModel):
    text: str


class ParseTextResponse(BaseModel):
    vital_signs: dict
    gejala_terdeteksi: list
    gejala_dinegasikan: list
    field_masih_kosong: list
    siap_kirim_ke_model: bool
    peringatan: list
    kategori_gejala: list
    severity_max: int


# ─── Helper Functions ────────────────────────────────────

def _encode_categorical(col: str, value: str) -> int:
    """Encode a categorical value using the stored mapping."""
    mapping = LABEL_ENCODINGS.get(col, {})
    if value in mapping:
        return mapping[value]
    # Fallback: return 0 (first alphabetical value)
    return 0


def _get_age_group(age: int) -> str:
    if age < 18:
        return "pediatric"
    elif age < 40:
        return "young_adult"
    elif age < 65:
        return "middle_aged"
    else:
        return "elderly"


def _get_current_shift() -> str:
    hour = datetime.now().hour
    if 6 <= hour < 14:
        return "morning"
    elif 14 <= hour < 20:
        return "afternoon"
    elif 20 <= hour < 23:
        return "evening"
    else:
        return "night"


def _get_current_season() -> str:
    month = datetime.now().month
    if month in [3, 4, 5]:
        return "spring"
    elif month in [6, 7, 8]:
        return "summer"
    elif month in [9, 10, 11]:
        return "autumn"
    else:
        return "winter"


def _compute_news2(inp: PredictRequest) -> int:
    """Compute NEWS2 score from vital signs."""
    score = 0
    # Respiratory rate
    rr = inp.respiratory_rate
    if rr <= 8 or rr >= 25:
        score += 3
    elif rr >= 21:
        score += 2
    elif rr <= 11:
        score += 1
    # SpO2
    if inp.spo2 <= 91:
        score += 3
    elif inp.spo2 <= 93:
        score += 2
    elif inp.spo2 <= 95:
        score += 1
    # Systolic BP
    sbp = inp.systolic_bp
    if sbp <= 90:
        score += 3
    elif sbp <= 100:
        score += 2
    elif sbp <= 110:
        score += 1
    elif sbp >= 220:
        score += 3
    # Heart rate
    hr = inp.heart_rate
    if hr <= 40 or hr >= 131:
        score += 3
    elif hr >= 111:
        score += 2
    elif hr <= 50 or hr >= 91:
        score += 1
    # Temperature
    t = inp.temperature_c
    if t <= 35.0:
        score += 3
    elif t >= 39.1:
        score += 2
    elif t <= 36.0 or t >= 38.1:
        score += 1
    # Mental status
    if inp.mental_status_triage != "alert":
        score += 3
    return score


def _build_feature_vector(inp: PredictRequest) -> pd.DataFrame:
    """
    Build the 61-feature vector expected by the XGBoost model.
    Features not available from form are filled with sensible defaults.
    """
    now = datetime.now()
    news2 = _compute_news2(inp)
    map_val = round((2 * inp.diastolic_bp + inp.systolic_bp) / 3, 1)
    pulse_pressure = inp.systolic_bp - inp.diastolic_bp
    shock_index = round(inp.heart_rate / inp.systolic_bp, 3) if inp.systolic_bp > 0 else 0.0

    # Determine sex encoding
    sex_val = "M"  # default
    if inp.sex == "P":
        sex_val = "F"
    elif inp.sex == "L":
        sex_val = "M"

    # Chief complaint processing
    cc_severity_flag = 0
    cc_word_count = 0
    chief_complaint_system = "other"
    if inp.chief_complaint:
        cc_word_count = len(inp.chief_complaint.split())
        severity_words = ["severe", "acute", "worsening", "critical",
                          "parah", "berat", "hebat", "akut", "mendadak", "gawat", "kritis"]
        if any(w in inp.chief_complaint.lower() for w in severity_words):
            cc_severity_flag = 1
        # Try to detect system from NLP parser
        try:
            parsed = parse_free_text(inp.chief_complaint)
            if parsed.kategori_gejala:
                # Use the first detected category
                cat = sorted(parsed.kategori_gejala)[0]
                if cat in LABEL_ENCODINGS["chief_complaint_system"]:
                    chief_complaint_system = cat
            if parsed.severity_max >= 2:
                cc_severity_flag = 1
        except Exception:
            pass

    # Map mental_status from frontend to training values
    mental_status_mapped = MENTAL_STATUS_MAP.get(inp.mental_status_triage, "alert")

    # Build the feature dict in exact order
    features = {
        "arrival_mode": _encode_categorical("arrival_mode", "walk-in"),
        "arrival_hour": now.hour,
        "arrival_day": _encode_categorical("arrival_day", now.strftime("%A")),
        "arrival_month": now.month,
        "arrival_season": _encode_categorical("arrival_season", _get_current_season()),
        "shift": _encode_categorical("shift", _get_current_shift()),
        "age": inp.age,
        "age_group": _encode_categorical("age_group", _get_age_group(inp.age)),
        "sex": _encode_categorical("sex", sex_val),
        "language": _encode_categorical("language", "Finnish"),  # default from dataset mode
        "insurance_type": _encode_categorical("insurance_type", "public"),
        "transport_origin": _encode_categorical("transport_origin", "home"),
        "pain_location": _encode_categorical("pain_location", "none"),
        "mental_status_triage": _encode_categorical("mental_status_triage", mental_status_mapped),
        "chief_complaint_system": _encode_categorical("chief_complaint_system", chief_complaint_system),
        "num_prior_ed_visits_12m": 1,
        "num_prior_admissions_12m": 0,
        "num_active_medications": 4,
        "num_comorbidities": 5 if inp.riwayat_kronis_berulang else 0,
        "systolic_bp": inp.systolic_bp,
        "diastolic_bp": inp.diastolic_bp,
        "mean_arterial_pressure": map_val,
        "pulse_pressure": pulse_pressure,
        "heart_rate": inp.heart_rate,
        "respiratory_rate": inp.respiratory_rate,
        "temperature_c": inp.temperature_c,
        "spo2": inp.spo2,
        "gcs_total": inp.gcs_total,
        "pain_score": inp.pain_score,
        "weight_kg": 76.0,
        "height_cm": 171.1,
        "bmi": 26.0,
        "shock_index": shock_index,
        "news2_score": news2,
        # All history defaults to 0 (no history)
        "hx_hypertension": 1 if inp.riwayat_kronis_berulang else 0,
        "hx_diabetes_type2": 0,
        "hx_diabetes_type1": 0,
        "hx_asthma": 0,
        "hx_copd": 0,
        "hx_heart_failure": 0,
        "hx_atrial_fibrillation": 0,
        "hx_ckd": 0,
        "hx_liver_disease": 0,
        "hx_malignancy": 0,
        "hx_obesity": 0,
        "hx_depression": 0,
        "hx_anxiety": 0,
        "hx_dementia": 0,
        "hx_epilepsy": 0,
        "hx_hypothyroidism": 0,
        "hx_hyperthyroidism": 0,
        "hx_hiv": 0,
        "hx_coagulopathy": 0,
        "hx_immunosuppressed": 0,
        "hx_pregnant": 0,
        "hx_substance_use_disorder": 0,
        "hx_coronary_artery_disease": 0,
        "hx_stroke_prior": 0,
        "hx_peripheral_vascular_disease": 0,
        "cc_severity_flag": cc_severity_flag,
        "cc_word_count": cc_word_count,
    }

    # Ensure feature order matches model
    df = pd.DataFrame([features])[FEATURE_ORDER]
    return df


def _get_top_shap_features(feature_vector: pd.DataFrame, probas: np.ndarray, predicted_class: int) -> List[ShapFeature]:
    """
    Compute feature importance for the prediction.
    Uses the model's built-in feature importances weighted by the feature's
    deviation from typical values to approximate contribution.
    """
    try:
        # Try SHAP TreeExplainer if available
        import shap
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(feature_vector)

        # shap_values is a list of arrays, one per class
        if isinstance(shap_values, list):
            sv = shap_values[predicted_class][0]  # values for predicted class
        else:
            sv = shap_values[0]

        # Build feature list with SHAP values
        features_list = []
        for i, fname in enumerate(FEATURE_ORDER):
            features_list.append({
                "feature": fname,
                "shap_value": float(sv[i]),
                "raw_value": float(feature_vector.iloc[0][fname]),
            })

        # Sort by absolute SHAP value, take top 5
        features_list.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
        top_features = features_list[:5]

    except Exception as e:
        logger.warning(f"SHAP calculation failed ({e}), using feature importance fallback")
        # Fallback: use model feature importances
        importances = model.feature_importances_
        raw_vals = feature_vector.iloc[0]

        features_list = []
        for i, fname in enumerate(FEATURE_ORDER):
            features_list.append({
                "feature": fname,
                "shap_value": float(importances[i]),
                "raw_value": float(raw_vals[fname]),
            })
        features_list.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
        top_features = features_list[:5]

    result = []
    for f in top_features:
        label = FEATURE_LABELS.get(f["feature"], f["feature"])
        unit = ""
        if f["feature"] == "spo2":
            unit = "%"
        elif f["feature"] == "temperature_c":
            unit = "°C"
        elif f["feature"] in ("systolic_bp", "diastolic_bp", "mean_arterial_pressure"):
            unit = "mmHg"
        elif f["feature"] in ("heart_rate",):
            unit = "bpm"

        result.append(ShapFeature(
            feature=f["feature"],
            label=label,
            shap_value=round(f["shap_value"], 4),
            raw_value=round(f["raw_value"], 2),
            unit=unit,
        ))
    return result


def _generate_reasoning(shap_features: List[ShapFeature], esi_level: int) -> str:
    """Generate human-readable reasoning text in Bahasa Indonesia."""
    text = f"AI memprediksi level ESI {esi_level} berdasarkan profil vital sign pasien."

    reasons = []
    for f in shap_features[:3]:
        if f.feature == "gcs_total" and f.raw_value < 15:
            reasons.append(f"Penurunan kesadaran (GCS {int(f.raw_value)})")
        elif f.feature == "spo2" and f.raw_value < 95:
            reasons.append(f"Hipoksia (SpO2 {f.raw_value}%)")
        elif f.feature == "shock_index" and f.raw_value > 0.9:
            reasons.append(f"Risiko syok (SI {f.raw_value})")
        elif f.feature == "news2_score" and f.raw_value >= 5:
            reasons.append(f"NEWS2 tinggi ({int(f.raw_value)})")
        elif f.feature == "pain_score" and f.raw_value >= 7:
            reasons.append(f"Nyeri hebat (Skor {int(f.raw_value)}/10)")
        elif f.feature == "heart_rate" and (f.raw_value > 100 or f.raw_value < 50):
            reasons.append(f"Denyut jantung abnormal ({int(f.raw_value)} bpm)")
        elif f.feature == "systolic_bp" and (f.raw_value < 90 or f.raw_value > 180):
            reasons.append(f"Tekanan darah abnormal ({int(f.raw_value)} mmHg)")
        elif f.feature == "respiratory_rate" and (f.raw_value > 22 or f.raw_value < 10):
            reasons.append(f"Frekuensi napas abnormal ({int(f.raw_value)}/menit)")
        elif f.feature == "temperature_c" and (f.raw_value > 38.5 or f.raw_value < 35.5):
            reasons.append(f"Suhu tubuh abnormal ({f.raw_value}{f.unit})")
        else:
            reasons.append(f"{f.label} ({f.raw_value}{f.unit})")

    if reasons:
        text += f" Faktor penyumbang risiko tertinggi: {', '.join(reasons)}."

    return text


def _esi_to_legacy(esi_level: int) -> dict:
    """Convert ESI level to legacy priority fields for backward compatibility."""
    mapping = {
        1: {"priority": "CRITICAL", "label": "ESI 1", "action": "TINDAKAN PENYELAMATAN NYAWA SEGERA. Bawa ke ruang resusitasi.", "wait": "SEGERA", "color": "text-red-600 bg-red-50 border-red-200"},
        2: {"priority": "HIGH", "label": "ESI 2", "action": "Pasien emergensi. Segera evaluasi di ruang emergensi.", "wait": "< 10 menit", "color": "text-orange-600 bg-orange-50 border-orange-200"},
        3: {"priority": "MEDIUM", "label": "ESI 3", "action": "Pasien membutuhkan evaluasi dan tes diagnostik.", "wait": "30-60 menit", "color": "text-yellow-600 bg-yellow-50 border-yellow-200"},
        4: {"priority": "LOW", "label": "ESI 4", "action": "Pasien membutuhkan 1 sumber daya. Dapat menunggu.", "wait": "60-120 menit", "color": "text-green-600 bg-green-50 border-green-200"},
        5: {"priority": "LOW", "label": "ESI 5", "action": "Pasien tidak membutuhkan sumber daya. Periksa ringan.", "wait": "> 120 menit", "color": "text-blue-600 bg-blue-50 border-blue-200"},
    }
    return mapping.get(esi_level, mapping[4])


# ─── FastAPI App ─────────────────────────────────────────

app = FastAPI(
    title="X-Trace AI Engine",
    description="Backend AI untuk prediksi triase ESI dan parsing teks medis Bahasa Indonesia",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Frontend Next.js
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "num_features": len(FEATURE_ORDER),
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/predict", response_model=PredictResponse)
async def predict_esi(req: PredictRequest):
    """
    Prediksi ESI level dari input vital signs.
    Model XGBoost menggunakan 61 fitur — fitur yang tidak tersedia
    dari form diisi dengan nilai default yang representatif.
    """
    try:
        # 1. Build feature vector
        feature_vector = _build_feature_vector(req)
        logger.info(f"Feature vector shape: {feature_vector.shape}")

        # 2. Predict
        pred_class = int(model.predict(feature_vector)[0])  # 0-indexed (0=ESI1, ..., 4=ESI5)
        pred_proba = model.predict_proba(feature_vector)[0]
        esi_level = pred_class + 1  # Convert to 1-indexed ESI level
        confidence = float(pred_proba[pred_class])

        logger.info(f"Prediction: ESI {esi_level}, confidence: {confidence:.3f}")
        logger.info(f"All probas: {[f'{p:.3f}' for p in pred_proba]}")

        # 3. Get top SHAP features
        shap_features = _get_top_shap_features(feature_vector, pred_proba, pred_class)

        # 4. Generate reasoning
        reasoning_text = _generate_reasoning(shap_features, esi_level)

        # 5. Build response
        legacy = _esi_to_legacy(esi_level)

        return PredictResponse(
            esi_level=esi_level,
            confidence=confidence,
            shap_features=shap_features,
            reasoning_text=reasoning_text,
            is_skip_triage=False,
            priority=legacy["priority"],
            priorityLabel=legacy["label"],
            recommendedAction=legacy["action"],
            estimatedWaitTime=legacy["wait"],
            color=legacy["color"],
        )

    except Exception as e:
        logger.error(f"Prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/parse-text", response_model=ParseTextResponse)
async def parse_text(req: ParseTextRequest):
    """
    Parse teks bebas Bahasa Indonesia dan ekstrak vital signs + gejala.
    """
    try:
        hasil = parse_free_text(req.text)
        data = hasil.to_dict()

        # Field wajib untuk model
        field_wajib = [
            "gcs_total", "pain_score", "mental_status_triage", "systolic_bp",
            "diastolic_bp", "respiratory_rate", "spo2", "heart_rate",
            "temperature_c", "age",
        ]
        field_kurang = [f for f in field_wajib if f not in data["vital_signs"]]

        return ParseTextResponse(
            vital_signs=data["vital_signs"],
            gejala_terdeteksi=data["gejala_terdeteksi"],
            gejala_dinegasikan=data["gejala_dinegasikan"],
            field_masih_kosong=field_kurang,
            siap_kirim_ke_model=len(field_kurang) == 0,
            peringatan=data["peringatan"],
            kategori_gejala=data["kategori_gejala"],
            severity_max=data["severity_max"],
        )

    except Exception as e:
        logger.error(f"Parse text error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Parse failed: {str(e)}")


# ─── Entrypoint ──────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
