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

def augment_keypoints_static(X_data, y_data, copies=15):
    X_aug, y_aug = [], []
    for keypoints, label in zip(X_data, y_data):
        # Tambahkan data asli
        X_aug.append(keypoints)
        y_aug.append(label)
        
        # Buat variasi augmented
        for i in range(copies):
            pts = keypoints.copy().reshape(-1, 3)
            mask = np.any(pts != 0, axis=1)
            
            if np.any(mask):
                # Rotasi acak
                theta = np.random.uniform(-np.pi/12, np.pi/12)
                c, s = np.cos(theta), np.sin(theta)
                R = np.array(((c, -s, 0), (s, c, 0), (0, 0, 1)))
                
                # Scaling acak
                scale = np.random.uniform(0.85, 1.15)
                
                pts[mask] = pts[mask] * scale
                pts[mask] = np.dot(pts[mask], R.T)
                
                # Noise Gaussian ringan
                noise = np.random.normal(0, 0.003, size=pts[mask].shape)
                pts[mask] += noise
                
            X_aug.append(pts.flatten())
            y_aug.append(label)
            
    return np.array(X_aug), np.array(y_aug)

# 2. Train-Test Split (SEBELUM augmentasi untuk cegah kebocoran data)
X_train_raw, X_test_raw, y_train_raw, y_test_raw = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print("Melakukan Data Augmentation...")
# Kita perbanyak data training secara signifikan
X_train, y_train_aug = augment_keypoints_static(X_train_raw, y_train_raw, copies=20)
# Data testing tidak di-augment
X_test, y_test_aug = augment_keypoints_static(X_test_raw, y_test_raw, copies=0)

print(f"Jumlah sampel latih setelah Augmentation: {len(X_train)}")
print(f"Jumlah sampel uji: {len(X_test)}")

# 3. One-hot encoding
y_train = to_categorical(y_train_aug, num_classes=num_classes)
y_test = to_categorical(y_test_aug, num_classes=num_classes)

# 4. Bangun Arsitektur Model (Dense/Statis)
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
print("\nMemulai Pelatihan Model...")
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
