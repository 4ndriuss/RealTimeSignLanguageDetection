import os
import cv2
import numpy as np
import tensorflow as tf
import collections
import time
from utils.mediapipe_utils import create_landmarker, mediapipe_detection, draw_styled_landmarks, extract_keypoints, NUM_FEATURES

# Model & actions paths
MODEL_PATH = os.path.join('models', 'sign_language_model.keras')
ACTIONS_PATH = os.path.join('preprocessed_data', 'actions.npy')

if not os.path.exists(MODEL_PATH) or not os.path.exists(ACTIONS_PATH):
    print("Error: Model or actions file not found!")
    print("Make sure you have run '1_preprocess_dataset.py' and '2_train_model.py' first.")
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

print(f"Model successfully loaded! Detecting classes: {actions}")

# 2. Initialize MediaPipe Tasks
landmarker = create_landmarker()

cap = cv2.VideoCapture(0)

print("\n--- Real-Time Sign Language Detection ---")
print("Starting camera... Press 'q' on the video window to exit.\n")

# Prediction smoothing variables
threshold = 0.5  # Minimum confidence threshold
prediction_history = collections.deque(maxlen=15)
confidence_history = collections.deque(maxlen=15)
pTime = 0
missing_frames = 0

try:
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame from webcam.")
            break
            
        # Calculate FPS
        cTime = time.time()
        fps = 1 / (cTime - pTime) if pTime > 0 else 0
        pTime = cTime

        # 1. Detect hand landmarks
        image, results = mediapipe_detection(frame, landmarker)
        
        # 2. Draw lines & points on the screen
        draw_styled_landmarks(image, results)
        
        # 3. Extract NUM_FEATURES (128) normalized features. The frame shape is
        # needed so a 4:3 webcam frame is normalized the same way as the
        # square dataset images.
        keypoints = extract_keypoints(results, image.shape)
        
        # 4. Predict per frame
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
                # Majority voting from the last 15 predictions
                most_common_label = collections.Counter(prediction_history).most_common(1)[0][0]
                # Average confidence of the frames that voted for the winner.
                avg_conf = np.mean([c for l, c in confidence_history if l == most_common_label])
                text = f"Gesture: {most_common_label} ({avg_conf * 100:.0f}%)"
                
                # Display predicted text on top of the video screen
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

        # Display FPS
        cv2.putText(image, f"FPS: {int(fps)}", (10, 80), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2, cv2.LINE_AA)
        
        # Show video window
        cv2.imshow('Real-Time Sign Language Detection', image)

        if cv2.waitKey(10) & 0xFF == ord('q'):
            break
finally:
    # Ensure webcam is released even if there's an error
    cap.release()
    cv2.destroyAllWindows()
