import os
import numpy as np
import tensorflow as tf
from keras.models import Sequential
from keras.layers import Dense, Dropout, BatchNormalization
from keras.utils import to_categorical
from keras.callbacks import EarlyStopping, ReduceLROnPlateau
from sklearn.model_selection import train_test_split

# Path data & model
INPUT_DIR = 'preprocessed_data'
MODEL_DIR = 'models'

if not os.path.exists(MODEL_DIR):
    os.makedirs(MODEL_DIR)

# 1. Load Data
X = np.load(os.path.join(INPUT_DIR, 'X.npy'))
y = np.load(os.path.join(INPUT_DIR, 'y.npy'))
actions = np.load(os.path.join(INPUT_DIR, 'actions.npy'))

num_classes = len(actions)
print(f"Memuat {len(X)} sampel asli dari {num_classes} kelas.")

# 2. Keypoint Data Augmentation (Perbanyak data 10x lipat dengan noise sintetis)
def augment_keypoints(X_data, y_data, copies=9):
    X_augmented, y_augmented = [], []
    for keypoints, label in zip(X_data, y_data):
        X_augmented.append(keypoints)
        y_augmented.append(label)
        
        for _ in range(copies):
            noise = np.random.normal(0, 0.006, size=keypoints.shape)
            augmented = keypoints.copy()
            
            mask = augmented != 0
            augmented[mask] += noise[mask]
            
            X_augmented.append(augmented)
            y_augmented.append(label)
            
    return np.array(X_augmented), np.array(y_augmented)

print("Melakukan Data Augmentation untuk memperbanyak sampel...")
X_aug, y_aug = augment_keypoints(X, y, copies=9)
print(f"Jumlah sampel setelah Augmentation: {len(X_aug)} data!")

# 3. One-hot encoding & Train-Test Split (80% train, 20% test)
y_cat = to_categorical(y_aug, num_classes=num_classes)
X_train, X_test, y_train, y_test = train_test_split(
    X_aug, y_cat, test_size=0.2, random_state=42, stratify=y_aug
)

# 4. Bangun Arsitektur Model
model = Sequential([
    Dense(256, activation='relu', input_shape=(126,)),
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

# Callbacks
callbacks = [
    ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5, min_lr=0.00001, verbose=1),
    EarlyStopping(monitor='val_loss', patience=15, restore_best_weights=True, verbose=1)
]

# 5. Latih Model
print("\nMemulai Pelatihan Model (dengan Augmentasi)...")
history = model.fit(
    X_train, y_train,
    epochs=120,
    batch_size=32,
    validation_data=(X_test, y_test),
    callbacks=callbacks,
    verbose=1
)

# 6. Evaluasi Model
test_loss, test_acc = model.evaluate(X_test, y_test)
print(f"\n--- Evaluasi Akhir (Setelah Dioptimasi) ---")
print(f"Test Accuracy: {test_acc * 100:.2f}%")
print(f"Test Loss    : {test_loss:.4f}")

# 7. Simpan Model
model_save_path = os.path.join(MODEL_DIR, 'sign_language_model.keras')
model.save(model_save_path)
print(f"\nModel teroptimasi berhasil disimpan di: '{model_save_path}'!")
