import os
import cv2
import numpy as np
import tensorflow as tf
import collections
import time
from utils.mediapipe_utils import create_landmarker, mediapipe_detection, draw_styled_landmarks, extract_keypoints, NUM_FEATURES

# Path model & actions
MODEL_PATH = os.path.join('models', 'sign_language_model.keras')
ACTIONS_PATH = os.path.join('preprocessed_data', 'actions.npy')

if not os.path.exists(MODEL_PATH) or not os.path.exists(ACTIONS_PATH):
    print("Error: Model atau file actions belum ditemukan!")
    print("Pastikan Anda sudah menjalankan '1_preprocess_dataset.py' dan '2_train_model.py' terlebih dahulu.")
    exit()

# 1. Load Model & Label Actions
model = tf.keras.models.load_model(MODEL_PATH)
actions = np.load(ACTIONS_PATH)

# Fail fast with a clear message if the model was trained on an older feature
# format (e.g. the previous 126-feature version) instead of crashing later
# with a cryptic shape-mismatch error inside the loop.
if model.input_shape[-1] != NUM_FEATURES:
    print(f"Error: Model expects {model.input_shape[-1]} features, but the extractor produces {NUM_FEATURES}.")
    print("Re-run '1_preprocess_dataset.py' and '2_train_model.py' to retrain the model.")
    exit()

print(f"Model berhasil dimuat! Mendeteksi kelas: {actions}")

# 2. Inisialisasi MediaPipe Tasks
landmarker = create_landmarker()

cap = cv2.VideoCapture(0)

print("\n--- Deteksi Bahasa Isyarat Real-Time ---")
print("Buka kamera... Tekan 'q' pada jendela video untuk keluar.\n")

# Variabel smoothing hasil prediksi
threshold = 0.5  # Minimum tingkat keyakinan (confidence threshold)
prediction_history = collections.deque(maxlen=15)
confidence_history = collections.deque(maxlen=15)
pTime = 0
missing_frames = 0

try:
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("Gagal mengambil frame dari webcam.")
            break
            
        # Hitung FPS
        cTime = time.time()
        fps = 1 / (cTime - pTime) if pTime > 0 else 0
        pTime = cTime

        # 1. Deteksi landmark tangan
        image, results = mediapipe_detection(frame, landmarker)
        
        # 2. Gambar garis & titik tangan di layar
        draw_styled_landmarks(image, results)
        
        # 3. Extract NUM_FEATURES (128) normalized features. The frame shape is
        # needed so a 4:3 webcam frame is normalized the same way as the
        # square dataset images.
        keypoints = extract_keypoints(results, image.shape)
        
        # 4. Prediksi per frame
        if np.any(keypoints):
            missing_frames = 0
            
            # Format input shape (1, NUM_FEATURES)
            input_data = np.expand_dims(keypoints, axis=0).astype(np.float32)
            # Calling the model directly avoids the per-call overhead of
            # model.predict(), which is significant when invoked every frame.
            res = model(input_data, training=False).numpy()[0]
            
            predicted_index = np.argmax(res)
            confidence = res[predicted_index]
            
            if confidence > threshold:
                predicted_label = actions[predicted_index]
                prediction_history.append(predicted_label)
                confidence_history.append((predicted_label, confidence))
                
            if len(prediction_history) > 0:
                # Majority voting dari 15 prediksi terakhir
                most_common_label = collections.Counter(prediction_history).most_common(1)[0][0]
                # Average confidence of the frames that voted for the winner.
                avg_conf = np.mean([c for l, c in confidence_history if l == most_common_label])
                text = f"Gestur: {most_common_label} ({avg_conf * 100:.0f}%)"
                
                # Tampilkan teks hasil prediksi di atas layar video
                cv2.rectangle(image, (0, 0), (image.shape[1], 45), (245, 117, 16), -1)
                cv2.putText(
                    image, text, (15, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA
                )
        else:
            missing_frames += 1
            if missing_frames > 15:
                prediction_history.clear()
                confidence_history.clear()

        # Tampilkan FPS
        cv2.putText(image, f"FPS: {int(fps)}", (10, 80), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2, cv2.LINE_AA)
        
        # Tampilkan jendela video
        cv2.imshow('Real-Time Sign Language Detection', image)

        if cv2.waitKey(10) & 0xFF == ord('q'):
            break
finally:
    # Memastikan webcam dilepas walau ada error
    cap.release()
    cv2.destroyAllWindows()
