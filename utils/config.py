"""Shared project configuration (paths and constants).

All paths are absolute and anchored to the project root, so every script
works regardless of the current working directory it is launched from.
"""
import os

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# --- Artifacts produced by the pipeline -----------------------------------
PREPROCESSED_DIR = os.path.join(PROJECT_ROOT, 'preprocessed_data')
MODELS_DIR = os.path.join(PROJECT_ROOT, 'models')

X_PATH = os.path.join(PREPROCESSED_DIR, 'X.npy')
Y_PATH = os.path.join(PREPROCESSED_DIR, 'y.npy')
ACTIONS_PATH = os.path.join(PREPROCESSED_DIR, 'actions.npy')
MODEL_PATH = os.path.join(MODELS_DIR, 'sign_language_model.keras')
# Plain NumPy weights exported from MODEL_PATH (see utils/export.py). The
# real-time script runs on these, so it does not need TensorFlow at all.
WEIGHTS_PATH = os.path.join(MODELS_DIR, 'sign_language_model.npz')

# --- Dataset ---------------------------------------------------------------
KAGGLE_DATASET = 'agungmrf/indonesian-sign-language-bisindo'
# Merged, because splitting is handled in 2_train_model.py
DATASET_SPLITS = ['train', 'val']
IMAGE_EXTENSIONS = ('.jpg', '.jpeg', '.png')

# --- Inference -------------------------------------------------------------
# Minimum softmax confidence for a per-frame prediction to count.
CONFIDENCE_THRESHOLD = 0.5
# MediaPipe hand confidence for static dataset images. On a sample of 400
# images it raised the hand detection rate from ~80% to ~84% compared with
# the default 0.5, recovering training samples that would be discarded.
DATASET_HAND_CONFIDENCE = 0.3


def get_images_dir():
    """Download the BISINDO dataset (cached by kagglehub) and return its image root.

    Dataset structure: bisindo/images/{train,val}/{A..Z}/*.jpg
    """
    import kagglehub  # Imported lazily: only the dataset scripts need it.

    path = kagglehub.dataset_download(KAGGLE_DATASET)
    print("Path to dataset files:", path)
    return os.path.join(path, 'bisindo', 'images')


def list_class_images(images_dir, label):
    """Return all image paths of one class across every dataset split.

    The `os.listdir` order is kept on purpose: it determines the sample order
    in X.npy, which the de-duplication and split in 2_train_model.py depend on.
    """
    paths = []
    for split in DATASET_SPLITS:
        class_dir = os.path.join(images_dir, split, label)
        if not os.path.isdir(class_dir):
            continue
        paths += [os.path.join(class_dir, f) for f in os.listdir(class_dir)
                  if f.lower().endswith(IMAGE_EXTENSIONS)]
    return paths
