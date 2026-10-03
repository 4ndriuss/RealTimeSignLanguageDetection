from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
import cv2
import numpy as np
import base64
import tensorflow as tf
import os
import collections

from utils.mediapipe_utils import create_landmarker, mediapipe_detection, extract_keypoints, NUM_FEATURES

app = FastAPI(title="BISINDO Sign Language API")

# [SECURITY FIX] 1. Restrict CORS (Cross-Origin Resource Sharing)
# Allow all localhost ports to prevent 400 Bad Request (Preflight) errors
# when Vite changes ports or when the browser sends an "Accept" header.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Model & Labels globally
MODEL_PATH = os.path.join('models', 'sign_language_model.keras')
ACTIONS_PATH = os.path.join('preprocessed_data', 'actions.npy')

if not os.path.exists(MODEL_PATH) or not os.path.exists(ACTIONS_PATH):
    raise RuntimeError("Model or actions.npy not found. Run training first.")

model = tf.keras.models.load_model(MODEL_PATH)
actions = np.load(ACTIONS_PATH)
landmarker = create_landmarker()

# API Configuration
CONFIDENCE_THRESHOLD = 0.5

class ImagePayload(BaseModel):
    # [SECURITY FIX] 2. Payload Size Limit (Prevent Denial of Service / DoS)
    # Limit the base64 string length to a maximum of approximately 5 MB (around 7 million characters)
    # If an attacker sends a 1GB string, the server will reject it before running out of RAM.
    image: str = Field(..., max_length=7000000)

@app.post("/predict")
def predict(payload: ImagePayload):
    try:
        # Decode base64 image (validate=True ensures proper base64 format)
        img_data = base64.b64decode(payload.image, validate=True)
        np_arr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise ValueError("Invalid image")

        # 1. Detect hand landmarks
        _, results = mediapipe_detection(frame, landmarker)
        
        # 2. Extract features
        keypoints = extract_keypoints(results, frame.shape)
        
        # 3. Predict per frame
        if np.any(keypoints):
            input_data = np.expand_dims(keypoints, axis=0).astype(np.float32)
            res = model(input_data, training=False).numpy()[0]
            
            predicted_index = np.argmax(res)
            confidence = float(res[predicted_index])
            
            if confidence > CONFIDENCE_THRESHOLD:
                return {
                    "status": "ok",
                    "predicted_label": str(actions[predicted_index]),
                    "confidence": confidence
                }
            else:
                return {
                    "status": "uncertain",
                    "predicted_label": None,
                    "confidence": confidence
                }
                
        return {
            "status": "no_hand",
            "predicted_label": None,
            "confidence": 0.0
        }

    except Exception as e:
        # [SECURITY FIX] 3. Prevent Information Leakage
        # Avoid sending detailed Python error messages (str(e)) to the client-side 
        # as it could leak folder structures / paths / variable names on the server.
        print(f"Error during prediction: {e}")
        raise HTTPException(status_code=400, detail="An error occurred while processing the image.")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)

