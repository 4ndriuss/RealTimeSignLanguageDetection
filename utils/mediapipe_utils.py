import os
import cv2
import numpy as np
import urllib.request
import mediapipe as mp

# Path to save the hand landmarker model file
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, 'hand_landmarker.task')
MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

def download_model_if_needed():
    """Download the hand_landmarker.task model file automatically if it doesn't exist."""
    if not os.path.exists(MODEL_PATH):
        print("Downloading hand_landmarker.task model (approx. 9 MB)...")
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
        print("Model download complete!")

# Initialize MediaPipe Tasks API
BaseOptions = mp.tasks.BaseOptions
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

# Connection lines between the 21 hand landmarks
HAND_CONNECTIONS = [
    (0,1), (1,2), (2,3), (3,4),          # Thumb
    (0,5), (5,6), (6,7), (7,8),          # Index finger
    (5,9), (9,10), (10,11), (11,12),     # Middle finger
    (9,13), (13,14), (14,15), (15,16),   # Ring finger
    (13,17), (17,18), (18,19), (19,20),  # Pinky
    (0,17)                               # Wrist to pinky
]

def create_landmarker(min_confidence=0.5):
    """Creates a MediaPipe Tasks HandLandmarker object.

    Args:
        min_confidence: Minimum hand detection/presence confidence. A lower
            value (e.g. 0.3) recovers more hands from static dataset images,
            while the default 0.5 is safer against false positives on a
            live webcam feed.
    """
    download_model_if_needed()
    options = HandLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=MODEL_PATH),
        running_mode=VisionRunningMode.IMAGE,
        num_hands=2,
        min_hand_detection_confidence=min_confidence,
        min_hand_presence_confidence=min_confidence
    )
    return HandLandmarker.create_from_options(options)

def mediapipe_detection(image, landmarker):
    """Process image frame detection using the MediaPipe Tasks API."""
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
    results = landmarker.detect(mp_image)
    return image, results

def draw_styled_landmarks(image, results):
    """Manually draw hand points and lines on the OpenCV frame."""
    if results.hand_landmarks:
        h, w, _ = image.shape
        for hand_landmarks in results.hand_landmarks:
            # 1. Draw joint connection lines
            for p1, p2 in HAND_CONNECTIONS:
                x1, y1 = int(hand_landmarks[p1].x * w), int(hand_landmarks[p1].y * h)
                x2, y2 = int(hand_landmarks[p2].x * w), int(hand_landmarks[p2].y * h)
                cv2.line(image, (x1, y1), (x2, y2), (255, 0, 0), 2)
                
            # 2. Draw joint point circles
            for lm in hand_landmarks:
                cx, cy = int(lm.x * w), int(lm.y * h)
                cv2.circle(image, (cx, cy), 4, (0, 255, 0), -1)

# --- Feature layout -------------------------------------------------------
# [  0: 63]  Tangan 1 (paling kiri di layar): 21 landmarks x (x, y, z), dinormalisasi
# [ 63:126]  Tangan 2 (paling kanan di layar): 21 landmarks x (x, y, z), dinormalisasi
# [126:151]  Inter-hand: 25 fitur jarak antar 5 ujung jari tangan 1 ke 5 ujung jari tangan 2
# [151]      Jumlah tangan yang terdeteksi (n)
HAND_FEATURES = 21 * 3
INTER_FEATURES = 25
NUM_FEATURES = 2 * HAND_FEATURES + INTER_FEATURES + 1

# Landmark used as the hand-size reference (wrist -> middle finger MCP).
# This bone is rigid, so its length is a stable proxy for how big the hand
# appears in the frame, regardless of the gesture being made.
SCALE_LANDMARK = 9


def _landmarks_to_pixels(hand_landmarks, width, height):
    """Convert MediaPipe normalized landmarks to an aspect-correct (21, 3) array.

    MediaPipe normalizes x by image width and y by image height, so on a
    non-square frame (e.g. a 640x480 webcam vs. the 640x640 dataset images)
    the same hand pose would yield different numbers. Scaling back to pixels
    removes that distortion. z uses roughly the same scale as x per the
    MediaPipe docs, so it is scaled by the width as well.
    """
    return np.array([[lm.x * width, lm.y * height, lm.z * width] for lm in hand_landmarks])


def extract_keypoints(results, image_shape):
    """Extract NUM_FEATURES (152) spatial (left-to-right) features.

    Args:
        results: HandLandmarkerResult returned by `mediapipe_detection`.
        image_shape: Shape of the processed image (`image.shape`).

    Returns:
        1-D float array of length NUM_FEATURES (see layout above).
    """
    height, width = image_shape[:2]
    hands = []
    
    if results.hand_landmarks:
        for hl in results.hand_landmarks[:2]:
            hands.append(_landmarks_to_pixels(hl, width, height))
            
    n = len(hands)
    if n == 0:
        return np.zeros(NUM_FEATURES)
        
    # Urutkan secara spasial (kiri ke kanan di frame) berdasarkan X pergelangan tangan (landmark 0)
    hands.sort(key=lambda k: k[0, 0])
    
    # Hitung rata-rata ukuran tulang telapak (wrist ke middle MCP) sebagai skala penormal
    # Ini menyelesaikan masalah "shrinkage" jika kedua tangan direntangkan jauh.
    scales = [np.linalg.norm(k[SCALE_LANDMARK, :2] - k[0, :2]) for k in hands]
    # Hindari division by zero
    valid_scales = [s for s in scales if s > 1e-6]
    global_scale = np.mean(valid_scales) if valid_scales else 1.0
    
    # Hitung titik tengah gabungan (origin)
    pts = np.concatenate(hands)
    origin = pts.mean(axis=0)
    
    # Buat wadah untuk 2 tangan
    out = np.zeros((2, 21, 3))
    for i, k in enumerate(hands):
        out[i] = (k - origin) / global_scale
        
    # 25 Fitur Jarak Antar Ujung Jari
    extra = []
    if n == 2:
        tips = [4, 8, 12, 16, 20]
        a, b = out[0][tips], out[1][tips]
        # Jarak pairwise antara 5 ujung jari tangan 1 dengan 5 ujung jari tangan 2
        extra = np.linalg.norm(a[:, None] - b[None], axis=2).flatten()
    
    # Pad dengan nol jika kurang dari 2 tangan
    extra = np.pad(extra, (0, 25 - len(extra)))
    
    # Gabungkan menjadi 1D array (total 152 fitur)
    return np.concatenate([out.flatten(), extra, [n]])