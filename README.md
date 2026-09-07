# Real-Time Sign Language Detection (A-Z) 🤟📷

A **real-time sign language alphabet recognition system** (A-Z hand gestures) built using **OpenCV**, **MediaPipe Tasks API**, and **TensorFlow / Keras** in Python 3.12.

---

## 🌟 Key Features
- **Modern MediaPipe Tasks API**: Tracks 21 3D hand landmark coordinates $(x, y, z)$ per hand for fast, lightweight CPU tracking.
- **Deep Learning Classification**: 26-class (A-Z) gesture classification powered by a TensorFlow / Keras Dense Neural Network with *Batch Normalization* & *Dropout*.
- **Keypoint Data Augmentation**: Synthetic coordinate jittering/augmentation to maximize model accuracy even on smaller initial datasets.
- **High-Performance Real-Time Inference**: Smooth, low-latency prediction overlay directly on OpenCV webcam video feed.

---

## 📁 Project Structure

```text
RealTimeSignLanguageDetection/
├── Data/                      # Image dataset subfolders (A through Z)
├── preprocessed_data/         # Extracted MediaPipe landmark coordinates (.npy)
├── models/                    # Saved TensorFlow trained model (sign_language_model.keras)
├── utils/
│   ├── mediapipe_utils.py     # MediaPipe Tasks API helper & landmark drawing functions
│   └── hand_landmarker.task   # Official MediaPipe model bundle
├── 1_preprocess_dataset.py    # Script to extract landmark coordinates from dataset
├── 2_train_model.py           # Script to train TensorFlow model with Data Augmentation
├── 3_realtime_detection.py    # Main real-time webcam detection application
├── test_webcam.py             # Utility script to test camera & MediaPipe pipeline
├── requirements.txt           # Python dependencies
├── .gitignore                 # Git ignore configuration
└── README.md                  # Project documentation
```

---

## 🚀 Quick Start Guide

### 1. Environment Setup
Create and activate a Python virtual environment (Python 3.10 - 3.12 recommended):

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Install all required dependencies:
```powershell
pip install -r requirements.txt
```

### 2. Preprocess Dataset
Extract landmark coordinates from the `Data/` folder:
```powershell
python 1_preprocess_dataset.py
```

### 3. Train Model
Train the TensorFlow Neural Network:
```powershell
python 2_train_model.py
```

### 4. Run Real-Time Detection
Launch your webcam for real-time sign language prediction:
```powershell
python 3_realtime_detection.py
```
*(Press **'q'** on the video window to quit)*.

---

## 🛠️ Tech Stack
- **Python 3.12**
- **OpenCV** (`opencv-python`)
- **MediaPipe Tasks API** (`mediapipe`)
- **TensorFlow & Keras** (`tensorflow`, `keras`)
- **NumPy & Scikit-Learn** (`numpy`, `scikit-learn`)