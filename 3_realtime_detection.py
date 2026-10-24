import time

import cv2

from utils.camera import LatestFrameCapture
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
    # 1. Load model & labels (validates the feature count)
    try:
        predictor = SignPredictor()
    except (FileNotFoundError, ValueError) as e:
        print(f"Error: {e}")
        return
    print(f"Model successfully loaded! Detecting classes: {predictor.actions}")

    # 2. Initialize MediaPipe Tasks in VIDEO mode (tracks hands between frames)
    landmarker = create_landmarker(video=True)
    smoother = MajorityVoteSmoother(history=15)

    cap = LatestFrameCapture(0)
    print("\n--- Real-Time Sign Language Detection ---")
    print("Starting camera... Press 'q' on the video window to exit.\n")

    prev_time = 0.0
    prev_timestamp_ms = -1
    try:
        while cap.is_opened():
            frame = cap.read()
            if frame is None:
                print("Failed to grab frame from webcam.")
                break

            now = time.monotonic()
            fps = 1 / (now - prev_time) if prev_time > 0 else 0
            prev_time = now

            # VIDEO mode rejects a timestamp that is not strictly increasing
            timestamp_ms = max(int(now * 1000), prev_timestamp_ms + 1)
            prev_timestamp_ms = timestamp_ms

            # Detect hand landmarks and draw them
            image, results = mediapipe_detection(frame, landmarker, timestamp_ms)
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

            # waitKey(1): on Windows waitKey(10) blocks ~15 ms per frame
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
    finally:
        # Ensure webcam is released even if there's an error
        cap.release()
        cv2.destroyAllWindows()


if __name__ == '__main__':
    main()
