# Real-Time Sign Language Detection

This project is a real-time, webcam-based sign language detection system that combines **Google MediaPipe** (for hand landmark tracking) and **TensorFlow/Keras** (for Deep Learning gesture classification).

The model is specifically designed to classify static alphabet gestures (such as the A-Z alphabet in American Sign Language / SIBI). It has been optimized to be lightweight, robust to hand positioning, and completely flicker-free on the camera feed.

---

## ✨ Key Features

1. **Keypoints Normalization (Highly Robust):** The system transforms raw hand landmark coordinates (x, y, z) to be relative to the wrist (the `0, 0, 0` origin). This means the system can accurately predict gestures regardless of how close/far the hand is from the camera or where it is placed on the screen.
2. **Dense Architecture for Static Poses:** Designed with a Feedforward Neural Network (FNN) utilizing `Dense` and `Dropout` layers, which is highly ideal and lightweight for recognizing static alphabet shapes.
3. **Automated Data Augmentation:** Multiplies the training data automatically by injecting variations such as scaling, rotation, and Gaussian noise. The training process is resistant to overfitting thanks to a strict train-test split applied prior to augmentation.
4. **Prediction Smoothing (Majority Voting):** The real-time script maintains a temporary history (the last 15 frames) to stabilize the predicted text on the screen, preventing the text from flickering or jumping around even if MediaPipe mis-tracks a frame or two.
5. **Real-time UI & Error Handling:** Equipped with an FPS (Frames Per Second) indicator and a safety net (`try-finally` block) to ensure your webcam is safely released even if the program crashes or is forcefully closed.

---

## 🛠️ Prerequisites

Make sure you have **Python 3.8 - 3.12** installed on your system.
The main libraries used are:
- `opencv-python`
- `numpy`
- `tensorflow`
- `mediapipe`
- `scikit-learn`

---

## 🚀 Installation Guide

1. **Clone this repository** (or download the ZIP):
   ```bash
   git clone https://github.com/4ndriuss/RealTimeSignLanguageDetection.git
   cd RealTimeSignLanguageDetection
   ```

2. **Create a Virtual Environment (Highly Recommended)**:
   ```bash
   python -m venv venv
   ```
   Activate the Virtual Environment (Windows):
   ```bash
   venv\Scripts\activate
   ```
   Activate the Virtual Environment (Mac/Linux):
   ```bash
   source venv/bin/activate
   ```

3. **Install Requirements**:
   *(If you have a requirements.txt file, run `pip install -r requirements.txt`. Otherwise, run the command below)*
   ```bash
   pip install opencv-python numpy tensorflow mediapipe scikit-learn
   ```

---

## 🏃 Usage Steps

To run this system from scratch (from preprocessing to real-time detection), follow these 3 Python scripts sequentially:

### Step 1: Data Extraction (Preprocessing)
```bash
python 1_preprocess_dataset.py
```
**Function:** This script will read all images from the `Data/` directory (e.g., folders A, B, C, etc.). MediaPipe will track the hand skeletal landmarks and save them as a normalized coordinate matrix (a row vector containing 126 feature values) as a `.npy` file in the `preprocessed_data/` folder.

### Step 2: Model Training
```bash
python 2_train_model.py
```
**Function:** This script loads the `.npy` files extracted previously. It splits the data into testing and training sets, multiplies the training data randomly (augmentation), trains the neural network, evaluates the Test Accuracy score, and finally saves it in the `models/sign_language_model.keras` format.

### Step 3: Real-Time Camera Detection
```bash
python 3_realtime_detection.py
```
**Function:** Turns on your Webcam! The program will match the hand postures captured from the video against the trained `.keras` model in real-time. The predicted text (Gesture) along with its confidence percentage will appear in the top left corner of the frame.
*(Press the **Q key** on your keyboard while the video window is active to exit and turn off the camera.)*

---

## 📁 Core Directory Structure

```
RealTimeSignLanguageDetection/
│
├── Data/                   # Contains sub-folders of raw image datasets (A/, B/, C/)
├── preprocessed_data/      # Destination for extracted coordinate points (.npy)
├── models/                 # Destination for the trained Keras model (.keras)
├── utils/
│   └── mediapipe_utils.py  # MediaPipe tracking utility script
│
├── 1_preprocess_dataset.py # Extracts raw images into NumPy matrices
├── 2_train_model.py        # Builds & trains the Keras Neural Network
├── 3_realtime_detection.py # Displays webcam feed with live predictions
├── test_webcam.py          # (Optional) Tests the MediaPipe tracker without AI
└── README.md
```

---

Built with ❤️ to facilitate Sign Language communication! Feel free to leave a ⭐ (Star) on this repository if you found it helpful.