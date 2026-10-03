import os
import cv2
import numpy as np
import kagglehub
from utils.mediapipe_utils import create_landmarker, mediapipe_detection, extract_keypoints

# Download BISINDO (Indonesian Sign Language) dataset from Kaggle
# (automatically cached, will not re-download if already exists)
path = kagglehub.dataset_download("agungmrf/indonesian-sign-language-bisindo")
print("Path to dataset files:", path)

# Dataset structure: bisindo/images/{train,val}/{A..Z}/*.jpg
IMAGES_DIR = os.path.join(path, 'bisindo', 'images')
SPLITS = ['train', 'val']  # Merged, because splitting is handled in 2_train_model.py
OUTPUT_DIR = 'preprocessed_data'

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

# Class labels A-Z
train_dir = os.path.join(IMAGES_DIR, SPLITS[0])
actions = [folder for folder in sorted(os.listdir(train_dir)) if os.path.isdir(os.path.join(train_dir, folder))]
label_map = {label: num for num, label in enumerate(actions)}

print(f"Detected {len(actions)} gesture classes: {actions}")

# Configuration for the expected number of hands per class.
# Please adjust according to BISINDO gestures (e.g., 'A' needs 2 hands, 'B' needs 1).
# If a class is not in this dictionary, any number of detected hands will be accepted.
EXPECTED_HANDS = {
    'A': 2, 'B': 2, 'C': 1, 'D': 2, 'E': 1,
    'F': 1, 'G': 2, 'H': 2, 'I': 1, 'J': 1,
    'K': 2, 'L': 1, 'M': 2, 'N': 1, 'O': 1,
    'P': 1, 'Q': 2, 'R': 1, 'S': 2, 'T': 2,
    'U': 1, 'V': 1, 'W': 2, 'X': 2, 'Y': 1,
    'Z': 1
}

# Initialize MediaPipe Tasks
# A lower confidence (0.3) is used for static dataset images: on a sample of
# 400 images it raised the hand detection rate from ~80% to ~84%, recovering
# training samples that the default 0.5 threshold would discard.
landmarker = create_landmarker(min_confidence=0.3)

X, y = [], []

total_images = 0
processed_images = 0

for action in actions:
    # Collect images from all splits (train + val)
    image_paths = []
    for split in SPLITS:
        action_dir = os.path.join(IMAGES_DIR, split, action)
        if not os.path.isdir(action_dir):
            continue
        image_paths += [os.path.join(action_dir, f) for f in os.listdir(action_dir)
                        if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    
    print(f"Processing class '{action}' ({len(image_paths)} images)...")
    
    for img_path in image_paths:
        total_images += 1
        image = cv2.imread(img_path)
        
        if image is None:
            continue
            
        # Hand landmark detection
        _, results = mediapipe_detection(image, landmarker)
        
        # Filter based on the number of detected hands vs expected hands
        detected_hands = len(results.hand_landmarks) if results.hand_landmarks else 0
        expected = EXPECTED_HANDS.get(action, detected_hands)
        
        if detected_hands == 0 or detected_hands != expected:
            continue
            
        # Extract NUM_FEATURES (128) normalized features; the image shape is
        # required to correct for MediaPipe's per-axis normalization.
        keypoints = extract_keypoints(results, image.shape)
        
        # Save if keypoints are successfully extracted
        if np.any(keypoints):
            X.append(keypoints)
            y.append(label_map[action])
            processed_images += 1

X = np.array(X)
y = np.array(y)

print("\n--- Preprocessing Results ---")
print(f"Total images processed : {total_images}")
print(f"Successfully extracted : {processed_images} samples")
print(f"Feature shape (X)      : {X.shape}")
print(f"Label shape (y)        : {y.shape}")

# Save extracted keypoints to .npy files
np.save(os.path.join(OUTPUT_DIR, 'X.npy'), X)
np.save(os.path.join(OUTPUT_DIR, 'y.npy'), y)
np.save(os.path.join(OUTPUT_DIR, 'actions.npy'), np.array(actions))

print(f"\nData successfully saved in '{OUTPUT_DIR}' directory!")
