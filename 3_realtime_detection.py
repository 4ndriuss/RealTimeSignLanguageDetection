import os
import cv2
import numpy as np
import tensorflow as tf
import collections
import time
from utils.mediapipe_utils import create_landmarker, mediapipe_detection, draw_styled_landmarks, extract_keypoints

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

print(f"Model berhasil dimuat! Mendeteksi kelas: {actions}")

# 2. Inisialisasi MediaPipe Tasks
landmarker = create_landmarker()

cap = cv2.VideoCapture(0)

print("\n--- Deteksi Bahasa Isyarat Real-Time ---")
print("Buka kamera... Tekan 'q' pada jendela video untuk keluar.\n")

# Variabel smoothing hasil prediksi
threshold = 0.5  # Minimum tingkat keyakinan (confidence threshold)
prediction_history = collections.deque(maxlen=15)
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
        
        # 3. Ekstrak keypoints koordinat (126 nilai)
        keypoints = extract_keypoints(results)
        
        # 4. Prediksi per frame
        if np.any(keypoints):
            missing_frames = 0
            
            # Format input shape (1, 126)
            input_data = np.expand_dims(keypoints, axis=0)
            res = model.predict(input_data, verbose=0)[0]
            
            predicted_index = np.argmax(res)
            confidence = res[predicted_index]
            
            if confidence > threshold:
                predicted_label = actions[predicted_index]
                prediction_history.append(predicted_label)
                
            if len(prediction_history) > 0:
                # Majority voting dari 15 prediksi terakhir
                most_common_label = collections.Counter(prediction_history).most_common(1)[0][0]
                text = f"Gestur: {most_common_label}"
                
                # Tampilkan teks hasil prediksi di atas layar video
                cv2.rectangle(image, (0, 0), (640, 45), (245, 117, 16), -1)
                cv2.putText(
                    image, text, (15, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA
                )
        else:
            missing_frames += 1
            if missing_frames > 15:
                prediction_history.clear()

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
