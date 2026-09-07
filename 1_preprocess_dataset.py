import os
import cv2
import numpy as np
from utils.mediapipe_utils import create_landmarker, mediapipe_detection, extract_keypoints

# Path folder dataset
DATA_DIR = 'Data'
OUTPUT_DIR = 'preprocessed_data'

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

# Label kelas A-Z
actions = [folder for folder in sorted(os.listdir(DATA_DIR)) if os.path.isdir(os.path.join(DATA_DIR, folder))]
label_map = {label: num for num, label in enumerate(actions)}

print(f"Mendeteksi {len(actions)} kelas gestur: {actions}")

# Inisialisasi MediaPipe Tasks
landmarker = create_landmarker()

X, y = [], []

total_images = 0
processed_images = 0

for action in actions:
    action_dir = os.path.join(DATA_DIR, action)
    image_files = [f for f in os.listdir(action_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    
    print(f"Memproses kelas '{action}' ({len(image_files)} gambar)...")
    
    for img_file in image_files:
        total_images += 1
        img_path = os.path.join(action_dir, img_file)
        image = cv2.imread(img_path)
        
        if image is None:
            continue
            
        # Deteksi landmark tangan
        _, results = mediapipe_detection(image, landmarker)
        
        # Ekstrak keypoints (126 koordinat)
        keypoints = extract_keypoints(results)
        
        # Simpan jika ada tangan terdeteksi (keypoints tidak bernilai 0 semua)
        if np.any(keypoints):
            X.append(keypoints)
            y.append(label_map[action])
            processed_images += 1

X = np.array(X)
y = np.array(y)

print("\n--- Hasil Preprocessing ---")
print(f"Total gambar diproses : {total_images}")
print(f"Berhasil diekstrak    : {processed_images} sampel")
print(f"Shape fitur (X)       : {X.shape}")
print(f"Shape label (y)       : {y.shape}")

# Simpan hasil ekstraksi keypoints ke file .npy
np.save(os.path.join(OUTPUT_DIR, 'X.npy'), X)
np.save(os.path.join(OUTPUT_DIR, 'y.npy'), y)
np.save(os.path.join(OUTPUT_DIR, 'actions.npy'), np.array(actions))

print(f"\nData berhasil disimpan di folder '{OUTPUT_DIR}'!")
