import os

replacements = {
    "Jarak tidak bisa dirotasi dengan matriks 2D, hanya bisa diskala.": "Distances cannot be rotated with a 2D matrix, only scaled.",
    "Jika berada di ujung array, ambil sisanya dengan me-loop dari depan": "If at the end of the array, take the remainder by looping from the beginning",
    "[  0: 63]  Tangan 1 (paling kiri di layar): 21 landmarks x (x, y, z), dinormalisasi": "[  0: 63]  Hand 1 (leftmost on screen): 21 landmarks x (x, y, z), normalized",
    "[ 63:126]  Tangan 2 (paling kanan di layar): 21 landmarks x (x, y, z), dinormalisasi": "[ 63:126]  Hand 2 (rightmost on screen): 21 landmarks x (x, y, z), normalized",
    "[126:151]  Inter-hand: 25 fitur jarak antar 5 ujung jari tangan 1 ke 5 ujung jari tangan 2": "[126:151]  Inter-hand: 25 distance features between 5 fingertips of Hand 1 and 5 fingertips of Hand 2",
    "[151]      Jumlah tangan yang terdeteksi (n)": "[151]      Number of detected hands (n)",
    "Urutkan secara spasial (kiri ke kanan di frame) berdasarkan X pergelangan tangan (landmark 0)": "Sort spatially (left to right in the frame) based on the X coordinate of the wrist (landmark 0)",
    "Hitung rata-rata ukuran tulang telapak (wrist ke middle MCP) sebagai skala penormal": "Calculate the average palm bone size (wrist to middle MCP) as a normalization scale",
    "Ini menyelesaikan masalah \"shrinkage\" jika kedua tangan direntangkan jauh.": "This solves the \"shrinkage\" problem if both hands are stretched far apart.",
    "Buat wadah untuk 2 tangan": "Create a container for 2 hands",
    "Pad dengan nol jika kurang dari 2 tangan": "Pad with zeros if there are less than 2 hands"
}

files_to_translate = ['2_train_model.py', 'utils/mediapipe_utils.py']

for filepath in files_to_translate:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        for k, v in replacements.items():
            content = content.replace(k, v)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
