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

def create_landmarker():
    """Membuat objek HandLandmarker MediaPipe Tasks."""
    download_model_if_needed()
    options = HandLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=MODEL_PATH),
        running_mode=VisionRunningMode.IMAGE,
        num_hands=2
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

def extract_keypoints(results):
    """Mengekstrak 126 koordinat (x, y, z) tangan kiri & kanan."""
    lh = np.zeros(21 * 3)
    rh = np.zeros(21 * 3)

    if results.hand_landmarks and results.handedness:
        for hand_landmarks, handedness in zip(results.hand_landmarks, results.handedness):
            label = handedness[0].category_name
            keypoints = np.array([[lm.x, lm.y, lm.z] for lm in hand_landmarks]).flatten()
            
            if label == 'Left':
                lh = keypoints
            elif label == 'Right':
                rh = keypoints
                
    return np.concatenate([lh, rh])