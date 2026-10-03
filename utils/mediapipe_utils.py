import os
import cv2
import numpy as np
import urllib.request
import mediapipe as mp

# Path penyimpanan file model hand landmarker
MODEL_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(MODEL_DIR, 'hand_landmarker.task')
MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

def download_model_if_needed():
    """Mengunduh file model hand_landmarker.task jika belum ada secara otomatis."""
    if not os.path.exists(MODEL_PATH):
        print("Mengunduh model hand_landmarker.task (sekitar 9 MB)...")
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
        print("Selesai mengunduh model!")

# Inisialisasi MediaPipe Tasks API
BaseOptions = mp.tasks.BaseOptions
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

# Koneksi garis antar 21 titik sendi jari
HAND_CONNECTIONS = [
    (0,1), (1,2), (2,3), (3,4),          # Ibu jari
    (0,5), (5,6), (6,7), (7,8),          # Telunjuk
    (5,9), (9,10), (10,11), (11,12),     # Jari Tengah
    (9,13), (13,14), (14,15), (15,16),   # Jari Manis
    (13,17), (17,18), (18,19), (19,20),  # Kelingking
    (0,17)                               # Pergelangan tangan ke kelingking
]

def create_landmarker(min_confidence=0.5):
    """Membuat objek HandLandmarker MediaPipe Tasks.

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
    """Proses deteksi frame gambar menggunakan MediaPipe Tasks API."""
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
    results = landmarker.detect(mp_image)
    return image, results

def draw_styled_landmarks(image, results):
    """Menggambar titik dan garis tangan secara manual pada frame OpenCV."""
    if results.hand_landmarks:
        h, w, _ = image.shape
        for hand_landmarks in results.hand_landmarks:
            # 1. Gambar garis koneksi sendi
            for p1, p2 in HAND_CONNECTIONS:
                x1, y1 = int(hand_landmarks[p1].x * w), int(hand_landmarks[p1].y * h)
                x2, y2 = int(hand_landmarks[p2].x * w), int(hand_landmarks[p2].y * h)
                cv2.line(image, (x1, y1), (x2, y2), (255, 0, 0), 2)
                
            # 2. Gambar lingkaran titik sendi
            for lm in hand_landmarks:
                cx, cy = int(lm.x * w), int(lm.y * h)
                cv2.circle(image, (cx, cy), 4, (0, 255, 0), -1)

# --- Feature layout -------------------------------------------------------
# [  0: 63]  left hand  : 21 landmarks x (x, y, z), wrist-relative, scale-normalized
# [ 63:126]  right hand : 21 landmarks x (x, y, z), wrist-relative, scale-normalized
# [126:128]  inter-hand : (dx, dy) vector from left wrist to right wrist,
#                         normalized by the mean hand size (zeros unless both
#                         hands are visible)
# Any missing hand is encoded as zeros.
HAND_FEATURES = 21 * 3
INTER_FEATURES = 2
NUM_FEATURES = 2 * HAND_FEATURES + INTER_FEATURES

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
    """Mengekstrak NUM_FEATURES (128) fitur tangan kiri & kanan.

    Args:
        results: HandLandmarkerResult returned by `mediapipe_detection`.
        image_shape: Shape of the processed image (`image.shape`), needed to
            undo MediaPipe's per-axis normalization.

    Returns:
        1-D float array of length NUM_FEATURES (see layout above).
    """
    height, width = image_shape[:2]
    hands = {}  # 'Left' / 'Right' -> (normalized keypoints, wrist position, hand size)

    if results.hand_landmarks and results.handedness:
        for hand_landmarks, handedness in zip(results.hand_landmarks, results.handedness):
            label = handedness[0].category_name
            if label in hands:
                # Rare case (~0.5% of the dataset): MediaPipe labels both hands
                # with the same side. Keep the first one instead of silently
                # overwriting it.
                continue

            pts = _landmarks_to_pixels(hand_landmarks, width, height)

            # Translation invariance: make the wrist (landmark 0) the origin.
            wrist = pts[0].copy()
            pts -= wrist

            # Scale invariance: divide by the wrist -> middle-MCP distance so
            # the features no longer depend on how close the hand is to the
            # camera or on the image resolution.
            hand_size = np.linalg.norm(pts[SCALE_LANDMARK, :2])
            if hand_size < 1e-6:
                continue
            pts /= hand_size

            hands[label] = (pts.flatten(), wrist, hand_size)

    lh = hands['Left'][0] if 'Left' in hands else np.zeros(HAND_FEATURES)
    rh = hands['Right'][0] if 'Right' in hands else np.zeros(HAND_FEATURES)

    # Relative position between the two hands. Each hand above is centered on
    # its own wrist, which throws away where the hands are relative to each
    # other -- important for two-handed BISINDO letters (A, D, G, K, Q, ...).
    inter = np.zeros(INTER_FEATURES)
    if 'Left' in hands and 'Right' in hands:
        mean_size = (hands['Left'][2] + hands['Right'][2]) / 2
        inter = (hands['Right'][1][:2] - hands['Left'][1][:2]) / mean_size

    return np.concatenate([lh, rh, inter])