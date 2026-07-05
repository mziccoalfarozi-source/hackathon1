import sys
sys.path.insert(0, '.')
from main import _build_feature_vector, PredictRequest, model

# Test prediction
req = PredictRequest(
    systolic_bp=90, diastolic_bp=60, heart_rate=120,
    respiratory_rate=28, spo2=89, temperature_c=37.5,
    gcs_total=14, pain_score=8, mental_status_triage='alert',
    age=55, chief_complaint='nyeri dada hebat, sesak napas',
    riwayat_kronis_berulang=False
)

fv = _build_feature_vector(req)
print('Feature vector shape:', fv.shape)
print('Features:', list(fv.columns))

pred = model.predict(fv)[0]
proba = model.predict_proba(fv)[0]
print(f'Predicted class: {int(pred)} (ESI {int(pred)+1})')
print(f'Probabilities: {[f"{p:.3f}" for p in proba]}')
print(f'Confidence: {proba[int(pred)]:.3f}')
