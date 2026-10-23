"""Feature extraction shared by preprocessing, training and inference.

This module only depends on NumPy (no MediaPipe / OpenCV), so consumers such
as 2_train_model.py can import the feature layout constants without loading
the whole vision stack.
"""
import numpy as np

# --- Feature layout -------------------------------------------------------
# [  0: 63]  Hand 1 (leftmost on screen): 21 landmarks x (x, y, z), normalized
# [ 63:126]  Hand 2 (rightmost on screen): 21 landmarks x (x, y, z), normalized
# [126:151]  Inter-hand: 25 distance features between 5 fingertips of Hand 1 and 5 fingertips of Hand 2
# [151]      Number of detected hands (n)
NUM_LANDMARKS = 21
HAND_FEATURES = NUM_LANDMARKS * 3
INTER_FEATURES = 25
NUM_FEATURES = 2 * HAND_FEATURES + INTER_FEATURES + 1

# Landmark used as the hand-size reference (wrist -> middle finger MCP).
# This bone is rigid, so its length is a stable proxy for how big the hand
# appears in the frame, regardless of the gesture being made.
SCALE_LANDMARK = 9

# Thumb, index, middle, ring and pinky fingertips.
FINGERTIPS = [4, 8, 12, 16, 20]


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
        results: HandLandmarkerResult (anything with a `hand_landmarks` list
            of 21 landmarks exposing `.x`, `.y`, `.z`).
        image_shape: Shape of the processed image (`image.shape`).

    Returns:
        1-D float array of length NUM_FEATURES (see layout above). All zeros
        when no hand is detected.
    """
    height, width = image_shape[:2]
    hands = [_landmarks_to_pixels(hl, width, height)
             for hl in (results.hand_landmarks or [])[:2]]

    n = len(hands)
    if n == 0:
        return np.zeros(NUM_FEATURES)

    # Sort spatially (left to right in the frame) based on the X coordinate of the wrist (landmark 0)
    hands.sort(key=lambda k: k[0, 0])

    # Calculate the average palm bone size (wrist to middle MCP) as a normalization scale.
    # This solves the "shrinkage" problem if both hands are stretched far apart.
    scales = [np.linalg.norm(k[SCALE_LANDMARK, :2] - k[0, :2]) for k in hands]
    # Avoid division by zero
    valid_scales = [s for s in scales if s > 1e-6]
    global_scale = np.mean(valid_scales) if valid_scales else 1.0

    # Combined centroid of all detected landmarks (origin)
    origin = np.concatenate(hands).mean(axis=0)

    # Container for 2 hands (the second slot stays zero for one-handed signs)
    out = np.zeros((2, NUM_LANDMARKS, 3))
    for i, k in enumerate(hands):
        out[i] = (k - origin) / global_scale

    # 25 pairwise distances between the 5 fingertips of hand 1 and of hand 2
    extra = np.zeros(INTER_FEATURES)
    if n == 2:
        a, b = out[0][FINGERTIPS], out[1][FINGERTIPS]
        extra = np.linalg.norm(a[:, None] - b[None], axis=2).flatten()

    # Concatenate into a single 1-D array (152 features in total)
    return np.concatenate([out.flatten(), extra, [n]])
