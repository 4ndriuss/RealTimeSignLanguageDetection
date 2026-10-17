"""FastAPI backend for the web frontend.

The browser runs MediaPipe itself and only sends the 152 extracted features
(~1 KB) per frame, so this server never receives camera images. It only runs
the small Keras classifier, which keeps each request in the low-millisecond
range.
"""
import logging
import math
from typing import List, Literal, Optional

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from utils.features import NUM_FEATURES
from utils.predictor import SignPredictor

logger = logging.getLogger("bisindo_api")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="BISINDO Sign Language API")

# Restrict CORS to localhost on any port (Vite may change ports).
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Loaded once at startup (also validates the feature count and warms up the model).
predictor = SignPredictor()

# The last feature is the number of detected hands.
MAX_HANDS = 2


class FeaturesPayload(BaseModel):
    # A fixed-length list doubles as a payload-size limit (DoS protection).
    features: List[float] = Field(..., min_length=NUM_FEATURES, max_length=NUM_FEATURES)

    @field_validator("features")
    @classmethod
    def validate_features(cls, values):
        if not all(math.isfinite(v) for v in values):
            raise ValueError("features must be finite numbers")
        if values[-1] not in range(MAX_HANDS + 1):
            raise ValueError(f"the last feature (hand count) must be 0..{MAX_HANDS}")
        return values


class PredictionResponse(BaseModel):
    status: Literal["ok", "uncertain", "no_hand"]
    predicted_label: Optional[str]
    confidence: float


@app.get("/health")
def health():
    """Lets the frontend verify the backend is up and speaks the same feature format."""
    return {"status": "ok", "num_features": NUM_FEATURES, "classes": predictor.actions}


@app.post("/predict/features", response_model=PredictionResponse)
def predict_features(payload: FeaturesPayload):
    if payload.features[-1] == 0:
        return PredictionResponse(status="no_hand", predicted_label=None, confidence=0.0)

    try:
        prediction = predictor.predict(payload.features)
    except Exception:
        # Log details server-side only; never leak internals to the client.
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail="Prediction failed.")

    return PredictionResponse(
        status="ok" if prediction.label is not None else "uncertain",
        predicted_label=prediction.label,
        confidence=prediction.confidence,
    )


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
