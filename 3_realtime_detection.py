import time

import cv2

from utils.mediapipe_utils import create_landmarker, mediapipe_detection, draw_styled_landmarks, extract_keypoints
from utils.predictor import MajorityVoteSmoother, SignPredictor

WINDOW_NAME = 'Real-Time Sign Language Detection'


def draw_prediction(image, label, confidence):
    """Draw the smoothed gesture on an orange banner at the top of the frame."""
    cv2.rectangle(image, (0, 0), (image.shape[1], 45), (245, 117, 16), -1)
    cv2.putText(
        image, f"Gesture: {label} ({confidence * 100:.0f}%)", (15, 30),
        cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA
    )


def main():
    # 1. Load model & labels (validates the feature count and warms up the model)
    try:
        predictor = SignPredictor()
    except (FileNotFoundError, ValueError) as e:
        print(f"Error: {e}")
        return
    print(f"Model successfully loaded! Detecting classes: {predictor.actions}")

    # 2. Initialize MediaPipe Tasks
    landmarker = create_landmarker()
    smoother = MajorityVoteSmoother(history=15)

    cap = cv2.VideoCapture(0)
    print("\n--- Real-Time Sign Language Detection ---")
    print("Starting camera... Press 'q' on the video window to exit.\n")

    prev_time = 0.0
    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                print("Failed to grab frame from webcam.")
                break

            now = time.time()
            fps = 1 / (now - prev_time) if prev_time > 0 else 0
            prev_time = now

            # Detect hand landmarks and draw them
            image, results = mediapipe_detection(frame, landmarker)
            draw_styled_landmarks(image, results)

            # Extract the 152 normalized features. The frame shape is needed so
            # a 4:3 webcam frame is normalized the same way as the square
            # dataset images.
            keypoints = extract_keypoints(results, image.shape)

            if keypoints.any():
                smoothed = smoother.update(predictor.predict(keypoints))
                if smoothed is not None:
                    draw_prediction(image, *smoothed)
            else:
                smoother.mark_missing()

            cv2.putText(image, f"FPS: {int(fps)}", (10, 80), cv2.FONT_HERSHEY_SIMPLEX,
                        1, (0, 255, 0), 2, cv2.LINE_AA)
            cv2.imshow(WINDOW_NAME, image)

            if cv2.waitKey(10) & 0xFF == ord('q'):
                break
    finally:
        # Ensure webcam is released even if there's an error
        cap.release()
        cv2.destroyAllWindows()


if __name__ == '__main__':
    main()
