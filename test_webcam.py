import cv2
from utils.mediapipe_utils import (
    create_landmarker, 
    mediapipe_detection, 
    draw_styled_landmarks, 
    extract_keypoints
)

# Initialize HandLandmarker (automatically downloads the model if missing)
landmarker = create_landmarker()

cap = cv2.VideoCapture(0)

print("Camera started... Press 'q' on the video window to exit.")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame from webcam.")
        break

    # 1. Hand detection
    image, results = mediapipe_detection(frame, landmarker)
    
    # 2. Draw points & lines on the screen
    draw_styled_landmarks(image, results)
    
    # 3. Extract keypoints (the frame shape is required by the extractor)
    keypoints = extract_keypoints(results, image.shape)
    print("Keypoints shape:", keypoints.shape)

    cv2.imshow('MediaPipe Tasks Test (Python 3.12)', image)

    if cv2.waitKey(10) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()