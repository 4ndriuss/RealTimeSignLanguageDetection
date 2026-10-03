import os
import cv2
import glob
from collections import Counter, defaultdict
import kagglehub
from utils.mediapipe_utils import create_landmarker, mediapipe_detection

print("Auditing Dataset untuk mencari jumlah tangan dominan per kelas...")

# Pastikan dataset sudah terdownload (menggunakan cache jika sudah ada)
path = kagglehub.dataset_download("agungmrf/indonesian-sign-language-bisindo")
IMAGES_DIR = os.path.join(path, 'bisindo', 'images')
SPLITS = ['train', 'val']

landmarker = create_landmarker(min_confidence=0.3)
stats = defaultdict(Counter)

print(f"Mencari gambar di: {IMAGES_DIR}")

# Proses semua gambar di train dan val
for split in SPLITS:
    split_dir = os.path.join(IMAGES_DIR, split)
    if not os.path.isdir(split_dir):
        continue
        
    image_paths = glob.glob(f'{split_dir}/*/*.jpg')
    print(f"Memproses {len(image_paths)} gambar di split '{split}'...")
    
    for path in image_paths:
        label = os.path.basename(os.path.dirname(path))
        img = cv2.imread(path)
        if img is None:
            continue
            
        _, res = mediapipe_detection(img, landmarker)
        
        n_hands = len(res.hand_landmarks) if res.hand_landmarks else 0
        stats[label][n_hands] += 1

print("\n=== HASIL AUDIT JUMLAH TANGAN (EXPECTED_HANDS) ===")
print("Gunakan hasil dominan ini untuk mengisi dictionary di 1_preprocess_dataset.py")
print("Contoh jika 'A': {2: 450, 1: 20} -> Berarti A butuh 2 tangan.\n")

for label in sorted(stats.keys()):
    print(f"'{label}': {dict(stats[label])}")
