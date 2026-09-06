import cv2
from utils.mediapipe_utils import (
    create_landmarker, 
    mediapipe_detection, 
    draw_styled_landmarks, 
    extract_keypoints
)

# Inisialisasi HandLandmarker (Otomatis download model jika belum ada)
landmarker = create_landmarker()

cap = cv2.VideoCapture(0)

print("Kamera dinyalakan... Tekan 'q' pada jendela video untuk keluar.")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        print("Gagal mengambil frame dari webcam.")
        break

    # 1. Deteksi tangan
    image, results = mediapipe_detection(frame, landmarker)
    
    # 2. Gambar titik & garis di layar
    draw_styled_landmarks(image, results)
    
    # 3. Ekstrak keypoints
    keypoints = extract_keypoints(results)
    print("Ukuran Keypoints:", keypoints.shape)

    cv2.imshow('Uji Coba MediaPipe Tasks (Python 3.12)', image)

    if cv2.waitKey(10) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()