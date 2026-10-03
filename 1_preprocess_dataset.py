import os
import cv2
import numpy as np
import kagglehub
from utils.mediapipe_utils import create_landmarker, mediapipe_detection, extract_keypoints

# Download dataset BISINDO (Indonesian Sign Language) dari Kaggle
# (otomatis di-cache, tidak diunduh ulang jika sudah ada)
path = kagglehub.dataset_download("agungmrf/indonesian-sign-language-bisindo")
print("Path to dataset files:", path)

# Struktur dataset: bisindo/images/{train,val}/{A..Z}/*.jpg
IMAGES_DIR = os.path.join(path, 'bisindo', 'images')
SPLITS = ['train', 'val']  # Digabung, karena split dilakukan di 2_train_model.py
OUTPUT_DIR = 'preprocessed_data'

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

# Label kelas A-Z
train_dir = os.path.join(IMAGES_DIR, SPLITS[0])
actions = [folder for folder in sorted(os.listdir(train_dir)) if os.path.isdir(os.path.join(train_dir, folder))]
label_map = {label: num for num, label in enumerate(actions)}

print(f"Mendeteksi {len(actions)} kelas gestur: {actions}")

# Inisialisasi MediaPipe Tasks
landmarker = create_landmarker()

X, y = [], []

total_images = 0
processed_images = 0

for action in actions:
    # Kumpulkan gambar dari semua split (train + val)
    image_paths = []
    for split in SPLITS:
        action_dir = os.path.join(IMAGES_DIR, split, action)
        if not os.path.isdir(action_dir):
            continue
        image_paths += [os.path.join(action_dir, f) for f in os.listdir(action_dir)
                        if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    
    print(f"Memproses kelas '{action}' ({len(image_paths)} gambar)...")
    
    for img_path in image_paths:
        total_images += 1
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
