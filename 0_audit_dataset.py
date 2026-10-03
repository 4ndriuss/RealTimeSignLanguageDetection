import os
import cv2
import glob
from collections import Counter, defaultdict
import kagglehub
from utils.mediapipe_utils import create_landmarker, mediapipe_detection

print("Auditing Dataset to find the dominant number of hands per class...")

# Ensure the dataset is downloaded (uses cache if already present)
path = kagglehub.dataset_download("agungmrf/indonesian-sign-language-bisindo")
IMAGES_DIR = os.path.join(path, 'bisindo', 'images')
SPLITS = ['train', 'val']

landmarker = create_landmarker(min_confidence=0.3)
stats = defaultdict(Counter)

print(f"Searching for images in: {IMAGES_DIR}")

# Process all images in train and val splits
for split in SPLITS:
    split_dir = os.path.join(IMAGES_DIR, split)
    if not os.path.isdir(split_dir):
        continue
        
    image_paths = glob.glob(f'{split_dir}/*/*.jpg')
    print(f"Processing {len(image_paths)} images in '{split}' split...")
    
    for path in image_paths:
        label = os.path.basename(os.path.dirname(path))
        img = cv2.imread(path)
        if img is None:
            continue
            
        _, res = mediapipe_detection(img, landmarker)
        
        n_hands = len(res.hand_landmarks) if res.hand_landmarks else 0
        stats[label][n_hands] += 1

print("\n=== AUDIT RESULTS: NUMBER OF HANDS (EXPECTED_HANDS) ===")
print("Use the dominant results below to fill the dictionary in 1_preprocess_dataset.py")
print("Example if 'A': {2: 450, 1: 20} -> It means class A expects 2 hands.\n")

for label in sorted(stats.keys()):
    print(f"'{label}': {dict(stats[label])}")
