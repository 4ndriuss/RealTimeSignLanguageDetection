import os
import cv2
import numpy as np
from utils.config import (
    ACTIONS_PATH, DATASET_HAND_CONFIDENCE, DATASET_SPLITS, PREPROCESSED_DIR,
    X_PATH, Y_PATH, get_images_dir, list_class_images,
)
from utils.mediapipe_utils import create_landmarker, mediapipe_detection, extract_keypoints

# Download BISINDO (Indonesian Sign Language) dataset from Kaggle
# (automatically cached, will not re-download if already exists)
IMAGES_DIR = get_images_dir()
os.makedirs(PREPROCESSED_DIR, exist_ok=True)

# Class labels A-Z
train_dir = os.path.join(IMAGES_DIR, DATASET_SPLITS[0])
actions = [folder for folder in sorted(os.listdir(train_dir)) if os.path.isdir(os.path.join(train_dir, folder))]
label_map = {label: num for num, label in enumerate(actions)}

print(f"Detected {len(actions)} gesture classes: {actions}")

# Accepted number of detected hands per class (from 0_audit_dataset.py).
# Please adjust according to BISINDO gestures (e.g., 'A' needs 2 hands, 'C' needs 1).
# F, N, P and Y are two-handed signs whose hands touch or overlap, so MediaPipe
# often detects only one of them (audit: P {1: 35, 2: 44}, N {1: 53, 2: 27}).
# Both layouts are accepted, because the live detector produces both too;
# accepting only one would teach the model a layout it rarely sees live.
# If a class is not in this dictionary, any non-zero number of hands is accepted.
EXPECTED_HANDS = {
    'A': 2, 'B': 2, 'C': 1, 'D': 2, 'E': 1,
    'F': (1, 2), 'G': 2, 'H': 2, 'I': 1, 'J': 1,
    'K': 2, 'L': 1, 'M': 2, 'N': (1, 2), 'O': 1,
    'P': (1, 2), 'Q': 2, 'R': 1, 'S': 2, 'T': 2,
    'U': 1, 'V': 1, 'W': 2, 'X': 2, 'Y': (1, 2),
    'Z': 1
}

# Initialize MediaPipe Tasks with a lower confidence for static dataset images
# (see DATASET_HAND_CONFIDENCE in utils/config.py).
landmarker = create_landmarker(min_confidence=DATASET_HAND_CONFIDENCE)

X, y = [], []

total_images = 0
processed_images = 0

for action in actions:
    # Collect images from all splits (train + val)
    image_paths = list_class_images(IMAGES_DIR, action)
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
        expected = EXPECTED_HANDS.get(action, (1, 2))
        if isinstance(expected, int):
            expected = (expected,)
        if detected_hands not in expected:
            continue

        # Extract the 152 normalized features; the image shape is required to
        # correct for MediaPipe's per-axis normalization.
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
np.save(X_PATH, X)
np.save(Y_PATH, y)
np.save(ACTIONS_PATH, np.array(actions))

print(f"\nData successfully saved in '{PREPROCESSED_DIR}' directory!")
