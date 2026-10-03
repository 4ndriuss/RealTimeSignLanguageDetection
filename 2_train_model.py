import os
import numpy as np
import tensorflow as tf
from keras.models import Sequential
from keras.layers import Input, Dense, Dropout, BatchNormalization
from keras.utils import to_categorical
from keras.callbacks import EarlyStopping, ReduceLROnPlateau
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import classification_report
from scipy.sparse.csgraph import connected_components
from scipy.spatial.distance import cdist
from utils.mediapipe_utils import HAND_FEATURES, INTER_FEATURES, NUM_FEATURES

# Data & model paths
INPUT_DIR = 'preprocessed_data'
MODEL_DIR = 'models'

# Fixed seed so that splits and augmentation are reproducible between runs.
SEED = 42
np.random.seed(SEED)
tf.random.set_seed(SEED)

# Two samples of the same class whose hand coordinates differ by less than
# this RMS distance (in palm-length units, i.e. < 2% of the palm length) are
# treated as copies of the same source photo. The Kaggle dataset is already
# augmented (augmented_image_*.jpg), so such copies must never be split
# between train and test, otherwise the test accuracy is inflated.
NEAR_DUP_THRESHOLD = 0.02

if not os.path.exists(MODEL_DIR):
    os.makedirs(MODEL_DIR)

# 1. Load Data
X = np.load(os.path.join(INPUT_DIR, 'X.npy'))
y = np.load(os.path.join(INPUT_DIR, 'y.npy'))
actions = np.load(os.path.join(INPUT_DIR, 'actions.npy'))

if X.shape[1] != NUM_FEATURES:
    raise ValueError(
        f"X.npy has {X.shape[1]} features but {NUM_FEATURES} are expected. "
        "Re-run '1_preprocess_dataset.py' first."
    )

num_classes = len(actions)
print(f"Loaded {len(X)} raw samples from {num_classes} classes.")


def remove_exact_duplicates(X, y, decimals=6):
    """Drop identical feature vectors.

    Photometric-only augmentations (brightness, blur, ...) produce identical
    landmarks, which overweight some photos. Identical vectors that carry
    *different* labels are ambiguous and are dropped entirely.
    """
    key = np.round(X, decimals)
    _, first_idx = np.unique(np.column_stack([key, y]), axis=0, return_index=True)
    first_idx = np.sort(first_idx)
    X, y, key = X[first_idx], y[first_idx], key[first_idx]

    # After the (X, y) dedupe, any remaining repeated X has conflicting labels.
    _, inverse, counts = np.unique(key, axis=0, return_inverse=True, return_counts=True)
    conflict = counts[inverse.ravel()] > 1
    return X[~conflict], y[~conflict], int(conflict.sum())


def near_duplicate_groups(X, y, threshold):
    """Assign a group id to every sample; near-identical samples share an id.

    Samples of the same class are linked when the RMS distance between their
    hand coordinates is below `threshold`; each connected component becomes
    one group, so chains of near-copies stay together.
    """
    coords = X[:, :2 * HAND_FEATURES]
    groups = np.empty(len(X), dtype=int)
    next_id = 0
    for c in np.unique(y):
        idx = np.where(y == c)[0]
        dist = cdist(coords[idx], coords[idx]) / np.sqrt(coords.shape[1])
        n_groups, labels = connected_components(dist < threshold, directed=False)
        groups[idx] = labels + next_id
        next_id += n_groups
    return groups


n_raw = len(X)
X, y, n_conflicts = remove_exact_duplicates(X, y)
print(f"Removed {n_raw - len(X)} exact duplicates "
      f"({n_conflicts} of them had conflicting labels). Remaining: {len(X)} samples.")

groups = near_duplicate_groups(X, y, NEAR_DUP_THRESHOLD)
group_sizes = np.bincount(groups)
print(f"Near-duplicate groups: {len(group_sizes)} "
      f"(largest: {group_sizes.max()}, singletons: {(group_sizes == 1).sum()})")


def mirror_keypoints(features):
    """Return the horizontally mirrored version of one feature vector."""
    h1 = features[:HAND_FEATURES].reshape(-1, 3).copy()
    h2 = features[HAND_FEATURES:2 * HAND_FEATURES].reshape(-1, 3).copy()
    inter = features[2 * HAND_FEATURES:2 * HAND_FEATURES + INTER_FEATURES].reshape(5, 5).copy()
    n_hands = features[-1]

    # Negasi X (karena dicerminkan secara horizontal)
    h1[:, 0] *= -1
    h2[:, 0] *= -1

    # Slots are ordered left-to-right on screen. Mirroring only swaps them
    # when two hands are present; a single hand must stay in slot 1, because
    # that is the only layout `extract_keypoints` ever produces at inference.
    if n_hands == 2:
        # inter adalah flattened 5x5 matriks jarak antar ujung jari.
        # Jika tangan kiri dan kanan ditukar, matriks jarak harus di-transpose.
        h1, h2 = h2, h1
        inter = inter.T

    return np.concatenate([h1.flatten(), h2.flatten(), inter.flatten(), [n_hands]])


def augment_single(features):
    """Augment a single feature vector."""
    # Mirroring (50% probabilitas)
    if np.random.rand() < 0.5:
        features = mirror_keypoints(features)

    pts = features[:2 * HAND_FEATURES].reshape(-1, 3).copy()
    inter = features[2 * HAND_FEATURES:2 * HAND_FEATURES + 25].copy()
    n_hands = features[-1]
    
    mask = np.any(pts != 0, axis=1)
    
    # Random rotasi 2D (+/- 15 derajat)
    theta = np.random.uniform(-np.pi/12, np.pi/12)
    c, s = np.cos(theta), np.sin(theta)
    R = np.array(((c, -s, 0), (s, c, 0), (0, 0, 1)))
    
    scale = np.random.uniform(0.9, 1.1)
    
    if np.any(mask):
        # Rotasi dan Skala diterapkan pada koordinat titik
        pts[mask] = np.dot(pts[mask] * scale, R.T)
        # Noise Gaussian kecil
        pts[mask] += np.random.normal(0, 0.015, size=pts[mask].shape)

    # BUG DIPERBAIKI: inter adalah jarak skalar (distance), bukan vektor.
    # Jarak tidak bisa dirotasi dengan matriks 2D, hanya bisa diskala.
    if np.any(inter):
        inter = inter * scale
        
    return np.concatenate([pts.flatten(), inter, [n_hands]])


# Custom Keras Sequence untuk Augmentasi On-The-Fly (Hemat RAM & Dinamis)
class AugmentDataGenerator(tf.keras.utils.Sequence):
    def __init__(self, X, y, batch_size=128, copies_per_epoch=20, **kwargs):
        super().__init__(**kwargs)
        self.X = X
        self.y = y
        self.batch_size = batch_size
        self.copies = copies_per_epoch
        # Memperpanjang epoch secara virtual agar setara dengan dataset statis sebelumnya
        self.virtual_length = len(self.X) * self.copies
        self.indices = np.arange(len(self.X))
        np.random.shuffle(self.indices)
    def __len__(self):
        return int(np.ceil(self.virtual_length / self.batch_size))
        
    def __getitem__(self, index):
        # Ambil sampel (mengulang dataset jika indeks melebihi jumlah asli)
        real_index = (index * self.batch_size) % len(self.X)
        
        batch_indices = self.indices[real_index:real_index+self.batch_size]
        # Jika berada di ujung array, ambil sisanya dengan me-loop dari depan
        if len(batch_indices) < self.batch_size:
            diff = self.batch_size - len(batch_indices)
            batch_indices = np.concatenate([batch_indices, self.indices[:diff]])
            
        X_batch = self.X[batch_indices].copy()
        y_batch = self.y[batch_indices]
        
        # Terapkan augmentasi secara online per sampel dalam batch
        for i in range(len(X_batch)):
            X_batch[i] = augment_single(X_batch[i])
            
        return X_batch, y_batch
        
    def on_epoch_end(self):
        np.random.shuffle(self.indices)


# 2. Train / Validation / Test split (~71 / 14 / 14) based on near-duplicate groups
sgkf = StratifiedGroupKFold(n_splits=7, shuffle=True, random_state=SEED)
folds = list(sgkf.split(X, y, groups=groups))

test_idx = folds[0][1]
val_idx = folds[1][1]
train_idx = np.concatenate([folds[i][1] for i in range(2, 7)])

X_train_raw, y_train_raw = X[train_idx], y[train_idx]
X_val, y_val_raw = X[val_idx], y[val_idx]
X_test, y_test_raw = X[test_idx], y[test_idx]

# 3. One-hot encoding
y_train_raw_cat = to_categorical(y_train_raw, num_classes=num_classes)
y_val = to_categorical(y_val_raw, num_classes=num_classes)
y_test = to_categorical(y_test_raw, num_classes=num_classes)

print("Preparing Data Generators (Online Augmentation)...")
train_generator = AugmentDataGenerator(X_train_raw, y_train_raw_cat, batch_size=128, copies_per_epoch=20)

print(f"Base Training samples (will be augmented on-the-fly): {len(X_train_raw)}")
print(f"Validation samples: {len(X_val)}")
print(f"Testing samples: {len(X_test)}")

weights = compute_class_weight('balanced', classes=np.arange(num_classes), y=y_train_raw)
class_weight = dict(enumerate(weights))

# 4. Build Model Architecture
model = Sequential([
    Input(shape=(NUM_FEATURES,)),
    Dense(256, activation='relu'),
    BatchNormalization(),
    Dropout(0.3),
    
    Dense(128, activation='relu'),
    BatchNormalization(),
    Dropout(0.3),
    
    Dense(64, activation='relu'),
    BatchNormalization(),
    Dropout(0.2),
    
    Dense(num_classes, activation='softmax')
])

optimizer = tf.keras.optimizers.Adam(learning_rate=0.001)

model.compile(
    optimizer=optimizer,
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

callbacks = [
    ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5, min_lr=0.00001, verbose=1),
    EarlyStopping(monitor='val_loss', patience=15, restore_best_weights=True, verbose=1)
]

# 5. Train Model
print("\nStarting Model Training...")
history = model.fit(
    train_generator,
    epochs=120,
    validation_data=(X_val, y_val),
    class_weight=class_weight,
    callbacks=callbacks,
    verbose=1
)

# 6. Evaluate Model
test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
print(f"\n--- Final Evaluation ---")
print(f"Test Accuracy: {test_acc * 100:.2f}%")
print(f"Test Loss    : {test_loss:.4f}")

y_pred = np.argmax(model.predict(X_test, verbose=0), axis=1)
print("\nPer-class report (test set):")
print(classification_report(y_test_raw, y_pred, target_names=[str(a) for a in actions], digits=3))

# 7. Save Model
model_save_path = os.path.join(MODEL_DIR, 'sign_language_model.keras')
model.save(model_save_path)
print(f"\nOptimized model successfully saved at: '{model_save_path}'!")
