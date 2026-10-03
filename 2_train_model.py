import os
import numpy as np
import tensorflow as tf
from keras.models import Sequential
from keras.layers import Input, Dense, Dropout, BatchNormalization
from keras.utils import to_categorical
from keras.callbacks import EarlyStopping, ReduceLROnPlateau
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import classification_report
from utils.mediapipe_utils import HAND_FEATURES, NUM_FEATURES

# Data & model paths
INPUT_DIR = 'preprocessed_data'
MODEL_DIR = 'models'

# Fixed seed so that splits and augmentation are reproducible between runs.
SEED = 42
np.random.seed(SEED)
tf.random.set_seed(SEED)

if not os.path.exists(MODEL_DIR):
    os.makedirs(MODEL_DIR)

# 1. Load Data
X = np.load(os.path.join(INPUT_DIR, 'X.npy'))
y = np.load(os.path.join(INPUT_DIR, 'y.npy'))
actions = np.load(os.path.join(INPUT_DIR, 'actions.npy'))

# Guard against stale preprocessed data from the old 126-feature format.
if X.shape[1] != NUM_FEATURES:
    raise ValueError(
        f"X.npy has {X.shape[1]} features but {NUM_FEATURES} are expected. "
        "Re-run '1_preprocess_dataset.py' first."
    )

num_classes = len(actions)
print(f"Loaded {len(X)} raw samples from {num_classes} classes.")


def mirror_keypoints(features):
    """Return the horizontally mirrored version of one feature vector.

    Mirroring turns a left hand into a right hand, so the two hand slots are
    swapped and every x coordinate is negated. For the inter-hand vector
    (left wrist -> right wrist) the swap cancels the x negation but flips the
    sign of y.

    Why: for one-handed BISINDO letters (C, E, I, L, O, R, U, V, Z) the
    dataset is split roughly 50/50 between left and right hands, which land in
    different feature slots. Mirroring lets every sample teach both slots,
    effectively doubling the data per letter and supporting left-handed users.
    """
    lh = features[:HAND_FEATURES].reshape(-1, 3).copy()
    rh = features[HAND_FEATURES:2 * HAND_FEATURES].reshape(-1, 3).copy()
    inter = features[2 * HAND_FEATURES:].copy()

    lh[:, 0] *= -1
    rh[:, 0] *= -1
    inter[1] *= -1

    # Old right hand becomes the new left hand and vice versa.
    return np.concatenate([rh.flatten(), lh.flatten(), inter])


def augment_keypoints_static(X_data, y_data, copies=20):
    """Augment wrist-relative, scale-normalized keypoints.

    Each copy gets: an optional mirror (50%), a random in-plane rotation, a
    small scale jitter and Gaussian noise. The same rotation/scale is applied
    to both hands and to the inter-hand vector so the gesture stays coherent.
    Missing hands (all-zero rows) are left untouched.
    """
    X_aug, y_aug = [], []
    for keypoints, label in zip(X_data, y_data):
        # Add original data
        X_aug.append(keypoints)
        y_aug.append(label)
        
        # Create augmented variations
        for _ in range(copies):
            features = keypoints.copy()
            if np.random.rand() < 0.5:
                features = mirror_keypoints(features)

            pts = features[:2 * HAND_FEATURES].reshape(-1, 3)
            inter = features[2 * HAND_FEATURES:]
            mask = np.any(pts != 0, axis=1)
            
            # Random rotation (+/- 15 degrees around the camera axis)
            theta = np.random.uniform(-np.pi/12, np.pi/12)
            c, s = np.cos(theta), np.sin(theta)
            R = np.array(((c, -s, 0), (s, c, 0), (0, 0, 1)))
            
            # Small scale jitter. Large scale changes are no longer needed
            # because features are already normalized by hand size; this only
            # simulates landmark-estimation wobble in bone proportions.
            scale = np.random.uniform(0.9, 1.1)
            
            if np.any(mask):
                pts[mask] = np.dot(pts[mask] * scale, R.T)
                
                # Light Gaussian noise. Units are now "hand sizes"
                # (wrist -> middle MCP = 1.0), so 0.015 is roughly the old
                # 0.003 in normalized image units for a typical hand.
                pts[mask] += np.random.normal(0, 0.015, size=pts[mask].shape)

            if np.any(inter):
                inter = np.dot(inter * scale, R[:2, :2].T)
                
            X_aug.append(np.concatenate([pts.flatten(), inter]))
            y_aug.append(label)
            
    return np.array(X_aug), np.array(y_aug)


# 2. Train / Validation / Test split (70 / 15 / 15), BEFORE augmentation to
# prevent data leakage. A separate validation set drives EarlyStopping and
# ReduceLROnPlateau so that the test set stays completely unseen until the
# final evaluation; previously the test set doubled as validation data, which
# made the reported test accuracy optimistic.
X_train_raw, X_temp, y_train_raw, y_temp = train_test_split(
    X, y, test_size=0.3, random_state=SEED, stratify=y
)
X_val, X_test, y_val_raw, y_test_raw = train_test_split(
    X_temp, y_temp, test_size=0.5, random_state=SEED, stratify=y_temp
)

print("Performing Data Augmentation...")
# Significantly multiply the training data
X_train, y_train_aug = augment_keypoints_static(X_train_raw, y_train_raw, copies=20)
# Validation & testing data remain unaugmented

print(f"Training samples after Augmentation: {len(X_train)}")
print(f"Validation samples: {len(X_val)}")
print(f"Testing samples: {len(X_test)}")

# 3. One-hot encoding
y_train = to_categorical(y_train_aug, num_classes=num_classes)
y_val = to_categorical(y_val_raw, num_classes=num_classes)
y_test = to_categorical(y_test_raw, num_classes=num_classes)

# Class weights compensate for the mild imbalance in extracted samples
# (e.g. 'Y' has ~230 samples vs. ~440 for 'M') so rare letters are not
# under-predicted. Augmentation multiplies every class equally, so weights
# computed on the raw training labels remain valid.
weights = compute_class_weight('balanced', classes=np.arange(num_classes), y=y_train_raw)
class_weight = dict(enumerate(weights))

# 4. Build Model Architecture (Dense/Static)
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

# Callbacks (monitor the validation set, never the test set)
callbacks = [
    ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5, min_lr=0.00001, verbose=1),
    EarlyStopping(monitor='val_loss', patience=15, restore_best_weights=True, verbose=1)
]

# 5. Train Model
print("\nStarting Model Training...")
history = model.fit(
    X_train, y_train,
    epochs=120,
    # Larger batch: with ~130k augmented samples, 32 makes each epoch slow
    # without a meaningful accuracy benefit.
    batch_size=128,
    validation_data=(X_val, y_val),
    class_weight=class_weight,
    callbacks=callbacks,
    verbose=1
)

# 6. Evaluate Model (on the held-out test set, untouched during training)
test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
print(f"\n--- Final Evaluation (Optimized Model) ---")
print(f"Test Accuracy: {test_acc * 100:.2f}%")
print(f"Test Loss    : {test_loss:.4f}")

# Per-class precision/recall to spot letters that are frequently confused.
y_pred = np.argmax(model.predict(X_test, verbose=0), axis=1)
print("\nPer-class report (test set):")
print(classification_report(y_test_raw, y_pred, target_names=[str(a) for a in actions], digits=3))

# 7. Save Model
model_save_path = os.path.join(MODEL_DIR, 'sign_language_model.keras')
model.save(model_save_path)
print(f"\nOptimized model successfully saved at: '{model_save_path}'!")
