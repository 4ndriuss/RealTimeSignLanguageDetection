import os
import cv2
from collections import Counter, defaultdict
from utils.config import DATASET_HAND_CONFIDENCE, DATASET_SPLITS, get_images_dir, list_class_images
from utils.mediapipe_utils import create_landmarker, mediapipe_detection

print("Auditing Dataset to find the dominant number of hands per class...")

# Ensure the dataset is downloaded (uses cache if already present)
IMAGES_DIR = get_images_dir()
print(f"Searching for images in: {IMAGES_DIR}")

# Same detector settings as 1_preprocess_dataset.py, so the audit reflects
# exactly what preprocessing will see.
landmarker = create_landmarker(min_confidence=DATASET_HAND_CONFIDENCE)
stats = defaultdict(Counter)

# Classes are the sub-folders of the train split (A-Z)
train_dir = os.path.join(IMAGES_DIR, DATASET_SPLITS[0])
labels = sorted(f for f in os.listdir(train_dir) if os.path.isdir(os.path.join(train_dir, f)))

# Process all images of every class across the train and val splits
for label in labels:
    image_paths = list_class_images(IMAGES_DIR, label)
    print(f"Processing class '{label}' ({len(image_paths)} images)...")

    for img_path in image_paths:
        img = cv2.imread(img_path)
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
