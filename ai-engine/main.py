from __future__ import annotations

import os
from pathlib import Path
from typing import List

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "xgboost_triage_model.joblib"


class PatientData(BaseModel):
    age: float = Field(..., ge=0, le=130)
    heart_rate: float = Field(..., gt=0, le=300)
    systolic_blood_pressure: float = Field(..., gt=0, le=400)
    oxygen_saturation: float = Field(..., ge=0, le=100)
    body_temperature: float = Field(..., ge=25, le=45)


class PredictionResponse(BaseModel):
    priority_score: int
    urgency_label: str


def load_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model tidak ditemukan: {MODEL_PATH}")
    return joblib.load(MODEL_PATH)


def compute_features(payload: PatientData) -> pd.DataFrame:
    shock_index = payload.heart_rate / payload.systolic_blood_pressure
    temp_flag = int(payload.body_temperature > 38)
    hr_flag = int(payload.heart_rate > 90)
    rr_flag = 0
    wbc_flag = 0
    sirs_alert = int((temp_flag + hr_flag + rr_flag + wbc_flag) >= 2)

    return pd.DataFrame(
        [
            {
                "age": payload.age,
                "heart_rate": payload.heart_rate,
                "systolic_blood_pressure": payload.systolic_blood_pressure,
                "oxygen_saturation": payload.oxygen_saturation,
                "body_temperature": payload.body_temperature,
                "shock_index": shock_index,
                "sirs_alert": sirs_alert,
            }
        ]
    )


app = FastAPI(
    title="Triage Classification API",
    version="1.0.0",
    description="FastAPI service for triage priority prediction using XGBoost.",
)

allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = load_model()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/predict", response_model=PredictionResponse)
def predict(payload: PatientData) -> PredictionResponse:
    try:
        features = compute_features(payload)
        prediction = model.predict(features)[0]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc

    urgency_map = {
        0: "Low",
        1: "Medium",
        2: "Emergency",
    }

    priority_score = int(prediction)
    urgency_label = urgency_map.get(priority_score, "Unknown")
    return PredictionResponse(priority_score=priority_score, urgency_label=urgency_label)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)