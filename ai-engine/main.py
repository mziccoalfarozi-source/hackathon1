from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Path Configuration
# ---------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "xgboost_triage_model.joblib"

# ---------------------------------------------------------------------------
# Model Metadata (untuk endpoint /model-info & Blockchain logging)
# ---------------------------------------------------------------------------

MODEL_METADATA = {
    "model_version": "v1.0",
    "model_type": "XGBClassifier",
    "objective": "multi:softprob",
    "n_classes": 3,
    "label_mapping": {
        "0": "Low",
        "1": "Medium",
        "2": "Emergency",
    },
    "training_date": "2026-06-08",
    "input_features": [
        "age",
        "heart_rate",
        "systolic_blood_pressure",
        "oxygen_saturation",
        "body_temperature",
    ],
    "derived_features": {
        "shock_index": "heart_rate / systolic_blood_pressure",
        "sirs_alert": "(body_temperature > 38°C AND heart_rate > 90 bpm) → 1, else 0",
    },
    "sirs_disclaimer": (
        "SIRS alert is a simplified 2-of-4 criteria approximation "
        "(temperature + heart rate only). Respiratory rate and WBC criteria "
        "are unavailable in the current dataset and are hardcoded to 0."
    ),
    "dataset_info": {
        "total_records": 291058,
        "source_types_available": ["synthetic", "real_hospital"],
        "source_type_field": "source_type",
        "blockchain_provenance_ready": True,
        "note": (
            "Each prediction request carries no source_type at inference time. "
            "The 'source_type' field exists in the training dataset and can be "
            "used by the Blockchain layer to log data provenance per training record."
        ),
    },
}

# Clinical Safety Thresholds (business rules — applied AFTER model inference)
HYPOXIA_OVERRIDE_THRESHOLD = 90.0  # SpO2 < 90% → force Emergency (WHO/AHA standard)

# UI color palette per urgency level (hex, ready for Frontend rendering)
URGENCY_COLOR_MAP = {
    0: "#00E5FF",   # Low      — cyan
    1: "#FFB000",   # Medium   — amber
    2: "#FF004D",   # Emergency — vivid red
}


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------

class PatientData(BaseModel):
    """
    Raw vital signs submitted by the Frontend.
    All derived features (shock_index, sirs_alert) are computed server-side.
    Units MUST follow the specifications in each field description.
    """

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "age": 45.0,
                    "heart_rate": 102.0,
                    "systolic_blood_pressure": 88.0,
                    "oxygen_saturation": 91.5,
                    "body_temperature": 38.7,
                }
            ]
        }
    }

    age: float = Field(
        ...,
        ge=0,
        le=130,
        description="Patient age in years (0–130).",
    )
    heart_rate: float = Field(
        ...,
        ge=20,
        le=300,
        description="Heart rate in beats per minute (bpm).",
    )
    systolic_blood_pressure: float = Field(
        ...,
        ge=50,   # AUDIT FIX: was gt=0 — aligns with dataset min (51 mmHg) & clinical safety
        le=300,
        description="Systolic blood pressure in mmHg (50–300).",
    )
    oxygen_saturation: float = Field(
        ...,
        ge=50,
        le=100,
        description="Peripheral oxygen saturation / SpO2 in percent (%).",
    )
    body_temperature: float = Field(
        ...,
        ge=30,
        le=43,
        description=(
            "Body temperature in CELSIUS (°C). "
            "Do NOT send Fahrenheit values. "
            "Normal range: 36.1–37.2 °C."
        ),
    )


class PredictionResponse(BaseModel):
    """
    Enriched prediction response. All fields are UI-ready for direct rendering.
    """

    # Core prediction
    priority_score: int = Field(
        ...,
        description="Triage priority class: 0=Low, 1=Medium, 2=Emergency.",
    )
    urgency_label: str = Field(
        ...,
        description="Human-readable urgency label corresponding to priority_score.",
    )
    confidence: float = Field(
        ...,
        description=(
            "Model confidence for the predicted class (0.0–1.0). "
            "Derived from predict_proba(); reflects probability of the assigned class."
        ),
    )

    # UI/UX helpers (Frontend / Blockchain ready)
    status_color: str = Field(
        ...,
        description="Hex color string for UI badge rendering (#FF004D, #FFB000, #00E5FF).",
    )
    requires_immediate_action: bool = Field(
        ...,
        description="True if priority_score == 2 (Emergency). Intended for alert triggers in UI.",
    )

    # Transparency flags
    safety_override_applied: bool = Field(
        ...,
        description=(
            "True if the clinical safety rule (SpO2 < 90%) overrode the model's raw prediction. "
            "Useful for audit logging in the Blockchain layer."
        ),
    )


# ---------------------------------------------------------------------------
# Model Loading
# ---------------------------------------------------------------------------

def load_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model artifact not found at: {MODEL_PATH}. "
            "Ensure 'xgboost_triage_model.joblib' is present in the ai-engine/ directory."
        )
    return joblib.load(MODEL_PATH)


# ---------------------------------------------------------------------------
# Feature Engineering
# ---------------------------------------------------------------------------

def compute_features(payload: PatientData) -> pd.DataFrame:
    """
    Derives shock_index and sirs_alert from raw vital signs.
    Output column order matches model.feature_names_in_ exactly.

    SIRS Note: Only 2 of 4 clinical SIRS criteria are computable from available
    input (temperature > 38°C and heart_rate > 90 bpm). Respiratory rate (RR)
    and WBC count are not collected at inference time and default to 0.
    """
    shock_index = payload.heart_rate / payload.systolic_blood_pressure

    # SIRS criteria (partial — see docstring)
    temp_flag = int(payload.body_temperature > 38.0)
    hr_flag   = int(payload.heart_rate > 90.0)
    rr_flag   = 0   # not available at inference
    wbc_flag  = 0   # not available at inference
    sirs_alert = int((temp_flag + hr_flag + rr_flag + wbc_flag) >= 2)

    return pd.DataFrame(
        [
            {
                # Feature order MUST match model.feature_names_in_ — verified in audit
                "age":                      payload.age,
                "heart_rate":               payload.heart_rate,
                "systolic_blood_pressure":  payload.systolic_blood_pressure,
                "oxygen_saturation":        payload.oxygen_saturation,
                "body_temperature":         payload.body_temperature,
                "shock_index":              shock_index,
                "sirs_alert":               sirs_alert,
            }
        ]
    )


# ---------------------------------------------------------------------------
# FastAPI Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Triage Classification API",
    version="1.0.0",
    description=(
        "AI-powered triage priority prediction API for the MediChain Hackathon system. "
        "Accepts raw patient vital signs and returns a triage priority classification "
        "with confidence score, UI-ready metadata, and Blockchain-compatible model info."
    ),
    contact={
        "name": "MediChain AI Team",
    },
    license_info={
        "name": "MIT",
    },
)

# CORS — allow all origins for Next.js Frontend integration across all environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,   # must be False when allow_origins=["*"] per CORS spec
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model at startup — fail fast if artifact is missing
model = load_model()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health", tags=["Infrastructure"])
def health() -> dict:
    """Liveness probe. Returns 200 OK when the service is ready."""
    return {"status": "ok", "model_loaded": MODEL_PATH.exists()}


@app.get("/model-info", tags=["Blockchain / Metadata"])
def model_info() -> dict:
    """
    Returns full model metadata for Blockchain logging and Frontend transparency.

    Blockchain team: use the `dataset_info.source_type_field` and
    `label_mapping` values to encode provenance and class enums in your
    smart contract.
    """
    return MODEL_METADATA


@app.post("/predict", response_model=PredictionResponse, tags=["Inference"])
def predict(payload: PatientData) -> PredictionResponse:
    """
    Classifies patient triage priority from raw vital signs.

    **Input:** 5 raw vital sign fields (age, HR, SBP, SpO2, temperature in °C).  
    **Output:** Priority class (0/1/2), urgency label, confidence score, UI hex color,
    immediate-action flag, and a transparency flag indicating if the clinical
    safety override was triggered.

    **Clinical Safety Override:**  
    If `oxygen_saturation < 90%`, the response is forced to `priority_score=2`
    (Emergency) regardless of model output, per WHO/AHA hypoxia guidelines.
    """
    # --- Model Inference ---
    try:
        features = compute_features(payload)
        raw_prediction  = int(model.predict(features)[0])
        probabilities   = model.predict_proba(features)[0].tolist()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Model inference failed: {exc}",
        ) from exc

    # --- Clinical Safety Override (post-inference business rule) ---
    safety_override_applied = False
    if payload.oxygen_saturation < HYPOXIA_OVERRIDE_THRESHOLD:
        priority_score          = 2
        safety_override_applied = True
    else:
        priority_score = raw_prediction

    # --- Resolve Labels & UI Metadata ---
    urgency_map = {0: "Low", 1: "Medium", 2: "Emergency"}
    urgency_label = urgency_map.get(priority_score, "Unknown")

    # Confidence reflects the model's probability for the FINAL assigned class
    confidence      = round(probabilities[priority_score], 4)
    status_color    = URGENCY_COLOR_MAP[priority_score]
    requires_immediate_action = priority_score == 2

    return PredictionResponse(
        priority_score=priority_score,
        urgency_label=urgency_label,
        confidence=confidence,
        status_color=status_color,
        requires_immediate_action=requires_immediate_action,
        safety_override_applied=safety_override_applied,
    )


# ---------------------------------------------------------------------------
# Dev Server Entry Point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)