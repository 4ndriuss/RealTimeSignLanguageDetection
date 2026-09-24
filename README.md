# Real-Time Sign Language Detection

Proyek ini adalah sistem deteksi bahasa isyarat (Sign Language) secara *real-time* berbasis webcam menggunakan perpaduan **Google MediaPipe** (untuk melacak *landmark* tangan) dan **TensorFlow/Keras** (untuk klasifikasi gestur *Deep Learning*).

Model ini didesain khusus untuk mengklasifikasikan huruf-huruf abjad statis (seperti huruf abjad A-Z pada American Sign Language / SIBI) dan telah dioptimalkan agar ringan, tangguh terhadap posisi tangan, serta bebas berkedip (*flicker-free*) pada *frame* kamera.

---

## ✨ Fitur Unggulan

1. **Keypoints Normalization (Sangat Tangguh):** Sistem mengubah titik *landmark* tangan (x, y, z) menjadi relatif terhadap pergelangan tangan (titik `0, 0, 0`). Ini berarti sistem bisa menebak gestur dengan jitu tidak peduli seberapa dekat/jauh jarak tangan dari kamera atau ditaruh di pojok layar sekalipun.
2. **Dense Architecture for Static Poses:** Dirancang dengan arsitektur FNN (Feedforward Neural Network) berlapis `Dense` dan `Dropout` yang sangat ideal serta ringan untuk mengenali bentuk huruf abjad yang diam (statis). 
3. **Data Augmentation Mandiri:** Memperbanyak (*multiply*) data pelatihan secara otomatis dengan menyuntikkan variasi ukuran (scaling), rotasi, dan *noise* Gaussian. Pelatihan tidak rentan terhadap kelebihan porsi belajar (*overfitting*) berkat skema pembagian data (*train-test split*) di awal eksekusi.
4. **Prediction Smoothing (Majority Voting):** Program *real-time* menyimpan histori sementara (15 *frame* terakhir) untuk menstabilkan teks tebakan di layar, mencegah teks loncat-loncat/berkedip walau pendeteksian Mendiapipe meleset satu-dua *frame*.
5. **Real-time UI & Error Handling:** Dilengkapi indikator FPS (Frames Per Second) dan penutup jaring (*try-finally*) agar kamera Anda dirilis aman walau program tiba-tiba ditutup (*force close*).

---

## 🛠️ Persyaratan Sistem (Prerequisites)

Pastikan Anda memiliki **Python 3.8 - 3.12** terinstal di komputer.
Library utama yang digunakan:
- `opencv-python`
- `numpy`
- `tensorflow`
- `mediapipe`
- `scikit-learn`

---

## 🚀 Cara Instalasi

1. **Clone repositori ini** (atau unduh zip-nya):
   ```bash
   git clone https://github.com/USERNAME_ANDA/RealTimeSignLanguageDetection.git
   cd RealTimeSignLanguageDetection
   ```

2. **Buat Virtual Environment (Sangat Direkomendasikan)**:
   ```bash
   python -m venv venv
   ```
   Aktivasi Virtual Environment (Windows):
   ```bash
   venv\Scripts\activate
   ```
   Aktivasi Virtual Environment (Mac/Linux):
   ```bash
   source venv/bin/activate
   ```

3. **Install Requirements**:
   *(Jika Anda memiliki file requirements.txt, jalankan `pip install -r requirements.txt`. Jika tidak, jalankan perintah di bawah)*
   ```bash
   pip install opencv-python numpy tensorflow mediapipe scikit-learn
   ```

---

## 🏃 Langkah-Langkah Penggunaan

Untuk menjalankan sistem ini dari awal (melatih hingga menggunakan), ikuti 3 tahapan skrip Python berikut secara berurutan:

### Langkah 1: Ekstraksi Data (Preprocessing)
```bash
python 1_preprocess_dataset.py
```
**Fungsi:** Skrip ini akan membaca semua foto/gambar dari direktori `Data/` (misalnya folder A, B, C, dst.). MediaPipe akan melacak letak tulang tangan dan menyimpannya sebagai matriks koordinat ternormalisasi (vektor baris berisi 126 nilai fitur) dalam bentuk file `.npy` di folder `preprocessed_data/`.

### Langkah 2: Pelatihan Model (Training)
```bash
python 2_train_model.py
```
**Fungsi:** Skrip ini akan memuat file data `.npy` hasil ekstraksi. Skrip akan memisahkan data menjadi porsi ujian dan latihan, menggandakan data latihan secara acak (augmentasi), melatih *neural network*, mengevaluasi skor akurasi (Test Accuracy), lalu menyimpannya dalam format `models/sign_language_model.keras`.

### Langkah 3: Deteksi Real-Time di Kamera
```bash
python 3_realtime_detection.py
```
**Fungsi:** Menyalakan Webcam/Kamera! Program akan mencocokkan postur tangan yang ditangkap dari video ke dalam model `.keras` yang telah dilatih secara spontan. Teks hasil tebakan (Gestur) beserta persentasenya akan muncul pada bingkai kiri atas.
*(Tekan **tombol Q** di *keyboard* Anda saat jendela rekaman/kamera aktif untuk keluar dan mematikan kamera.)*

---

## 📁 Struktur Direktori Utama

```
RealTimeSignLanguageDetection/
│
├── Data/                   # Berisi sub-folder raw dataset gambar (A/, B/, C/)
├── preprocessed_data/      # Tempat hasil esktraksi titik koordinat (.npy)
├── models/                 # Tempat hasil pelatihan Keras (.keras)
├── utils/
│   └── mediapipe_utils.py  # Skrip utilitas pelacakan MediaPipe
│
├── 1_preprocess_dataset.py # Ekstrak raw gambar jadi matriks NumPy
├── 2_train_model.py        # Bangun & latih Neural Network Keras
├── 3_realtime_detection.py # Tampilkan webcam dengan prediksi langsung
├── test_webcam.py          # (Opsional) Uji coba pelacak MediaPipe tanpa AI
└── README.md
```

---

Dibuat dengan ❤️ untuk kemudahan komunikasi Bahasa Isyarat! Jangan ragu untuk klik ⭐ (Star) pada repositori ini jika bermanfaat.