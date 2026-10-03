import os
import re

files_to_translate = [
    '0_audit_dataset.py',
    '1_preprocess_dataset.py',
    '2_train_model.py',
    '3_realtime_detection.py',
    '4_api.py',
    'test_webcam.py',
    'utils/mediapipe_utils.py'
]

replacements = {
    "Auditing Dataset untuk mencari jumlah tangan dominan per kelas...": "Auditing Dataset to find the dominant number of hands per class...",
    "Pastikan dataset sudah terdownload (menggunakan cache jika sudah ada)": "Ensure the dataset is downloaded (uses cache if already present)",
    "Mencari gambar di:": "Searching for images in:",
    "Proses semua gambar di train dan val": "Process all images in train and val splits",
    "Memproses ": "Processing ",
    " gambar di split ": " images in split ",
    "=== HASIL AUDIT JUMLAH TANGAN (EXPECTED_HANDS) ===": "=== AUDIT RESULTS: NUMBER OF HANDS (EXPECTED_HANDS) ===",
    "Gunakan hasil dominan ini untuk mengisi dictionary di 1_preprocess_dataset.py": "Use the dominant results below to fill the dictionary in 1_preprocess_dataset.py",
    "Contoh jika 'A': {2: 450, 1: 20} -> Berarti A butuh 2 tangan.": "Example if 'A': {2: 450, 1: 20} -> It means class A expects 2 hands.",
    "Filter berdasarkan jumlah tangan yang terdeteksi vs yang diharapkan": "Filter based on the number of detected hands vs expected hands",
    "Konfigurasi jumlah tangan yang diharapkan untuk tiap kelas.": "Configuration for the expected number of hands per class.",
    "Silakan sesuaikan dengan isyarat BISINDO (contoh: 'A' butuh 2 tangan, 'B' butuh 1).": "Please adjust according to BISINDO gestures (e.g., 'A' needs 2 hands, 'B' needs 1).",
    "Jika kelas tidak ada di dictionary ini, semua jumlah deteksi tangan akan diterima.": "If a class is not in this dictionary, any number of detected hands will be accepted.",
    
    "Negasi X (karena dicerminkan secara horizontal)": "Negate X (because it is horizontally mirrored)",
    "Tukar slot tangan 1 dan tangan 2": "Swap hand slot 1 and hand slot 2",
    "inter adalah flattened 5x5 matriks jarak antar ujung jari.": "'inter' is the flattened 5x5 distance matrix between fingertips.",
    "Jika tangan kiri dan kanan ditukar, matriks jarak harus di-transpose.": "If left and right hands are swapped, the distance matrix must be transposed.",
    "Memberikan rotasi acak kecil (di bidang XY), scaling, dan Gaussian noise.": "Applies small random rotations (in the XY plane), scaling, and Gaussian noise.",
    "Mirroring (50% probabilitas)": "Mirroring (50% probability)",
    "Random rotasi 2D (+/- 15 derajat)": "Random 2D rotation (+/- 15 degrees)",
    "Rotasi dan Skala diterapkan pada koordinat titik": "Rotation and Scaling are applied to point coordinates",
    "Noise Gaussian kecil": "Small Gaussian noise",
    "BUG DIPERBAIKI: inter adalah jarak skalar (distance), bukan vektor.": "FIX: 'inter' are scalar distances, not vectors.",
    "Kita tidak merotasi atau menambahkan noise pada variabel inter karena": "We do not rotate or add noise to the inter variable because",
    "jaraknya sudah relatif (invariant terhadap translasi dan rotasi),": "its distance is already relative (invariant to translation and rotation),",
    "jika diubah malah merusak strukturnya.": "modifying it would destroy its structure.",
    "Custom Keras Sequence untuk Augmentasi On-The-Fly (Hemat RAM & Dinamis)": "Custom Keras Sequence for On-The-Fly Augmentation (RAM Efficient & Dynamic)",
    "Memperpanjang epoch secara virtual agar setara dengan dataset statis sebelumnya": "Extend epoch virtually to match the previous static dataset size",
}

for filepath in files_to_translate:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        for k, v in replacements.items():
            content = content.replace(k, v)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
