# Real-Time Sign Language Detection (A-Z) 🤟📷

Aplikasi deteksi bahasa isyarat (gestur tangan alfabet A-Z) secara **real-time** menggunakan webcam dengan kombinasi **OpenCV**, **MediaPipe Tasks API**, dan **TensorFlow / Keras**.

---

## 🌟 Fitur Utama
- **MediaPipe Tasks API (Modern)**: Menggunakan 21 titik koordinat *keypoints* 3D $(x, y, z)$ untuk pelacakan tangan yang presisi & sangat ringan di CPU.
- **Deep Learning TensorFlow / Keras**: Klasifikasi gestur tangan 26 kelas (A-Z) menggunakan arsitektur *Dense Neural Network* dengan *Batch Normalization* & *Dropout*.
- **Data Augmentation**: Teknik augmentasi koordinat sintetis untuk melatih model secara maksimal meskipun dataset awal terbatas.
- **Real-Time FPS High Performance**: Prediksi secepat kilat di atas feed webcam OpenCV tanpa *lag*.

---

## 📁 Struktur Proyek

```text
RealTimeSignLanguageDetection/
├── Data/                      # Dataset gambar (folder A-Z)
├── preprocessed_data/         # Hasil ekstraksi koordinat landmark (.npy)
├── models/                    # Model terlatih TensorFlow (sign_language_model.keras)
├── utils/
│   ├── mediapipe_utils.py     # Modul pembantu MediaPipe Tasks API & Gambar Landmark
│   └── hand_landmarker.task   # File model resmi MediaPipe
├── 1_preprocess_dataset.py    # Script mengekstrak koordinat landmark dari dataset
├── 2_train_model.py           # Script melatih model TensorFlow dengan Augmentasi
├── 3_realtime_detection.py    # Aplikasi utama deteksi real-time webcam
├── test_webcam.py             # Script uji coba kamera & MediaPipe
├── requirements.txt           # Daftar dependensi Python
├── .gitignore                 # Konfigurasi pengabaian file berukuran besar
└── README.md                  # Dokumentasi proyek
```

---

## 🚀 Cara Penggunaan

### 1. Persiapan Environment
Buat dan aktifkan virtual environment Python (3.10 - 3.12):

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Install seluruh dependensi:
```powershell
pip install -r requirements.txt
```

### 2. Preprocessing Dataset
Ekstrak fitur koordinat dari folder dataset `Data/`:
```powershell
python 1_preprocess_dataset.py
```

### 3. Melatih Model
Latih model Neural Network TensorFlow:
```powershell
python 2_train_model.py
```

### 4. Jalankan Deteksi Real-Time
Buka kamera webcam untuk mendeteksi bahasa isyarat secara langsung:
```powershell
python 3_realtime_detection.py
```
*(Tekan **'q'** pada jendela video untuk keluar)*.

---

## 🛠️ Teknologi yang Digunakan
- **Python 3.12**
- **OpenCV** (`opencv-python`)
- **MediaPipe Tasks API** (`mediapipe`)
- **TensorFlow & Keras** (`tensorflow`, `keras`)
- **NumPy & Scikit-Learn** (`numpy`, `scikit-learn`)