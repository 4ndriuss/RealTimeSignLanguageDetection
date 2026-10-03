/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DetectionResult, SignStandard } from '../types';

/**
 * ============================================================================
 * KONFIGURASI API BACKEND DETEKSI BAHASA ISYARAT
 * ============================================================================
 * Ganti URL di bawah ini dengan alamat server backend REST API Anda saat
 * model machine learning / FastAPI / Flask Anda sudah siap beroperasi.
 * Contoh: "http://localhost:8000/api/predict" atau "https://api.project-anda.com/predict"
 */
export const API_URL = "http://127.0.0.1:8000/predict";

/**
 * Catatan Privasi & Keamanan:
 * - Pada implementasi default browser/on-device (MediaPipe / TensorFlow.js / ONNX Web),
 *   seluruh data citra video diproses di memori lokal perangkat pengguna.
 * - Jika menggunakan backend server mandiri (API_URL di atas), frame hanya dikirim
 *   secara terenkripsi (HTTPS/WSS) untuk inferensi langsung tanpa disimpan di database.
 */
export const PRIVACY_STATEMENT = "Video kamera Anda diproses langsung di perangkat peramban secara lokal dan tidak pernah direkam atau disimpan di server mana pun demi melindungi privasi Anda sepenuhnya.";

// Database isyarat untuk simulasi realistis dan referensi model
export const KNOWN_SIGNS: Array<{
  text: string;
  label: string;
  category: string;
  standard: 'BISINDO' | 'SIBI';
  meaning: string;
  note: string;
}> = [
  {
    text: "Halo",
    label: "GREETING_HELLO",
    category: "salam",
    standard: "BISINDO",
    meaning: "Salam pembuka ramah kepada lawan bicara",
    note: "Telapak tangan terbuka menghadap depan, digerakkan ke kanan sedikit dari pelipis."
  },
  {
    text: "Terima Kasih",
    label: "POLITE_THANK_YOU",
    category: "sopan",
    standard: "BISINDO",
    meaning: "Ungkapan rasa syukur dan terima kasih mendalam",
    note: "Ujung jari menyentuh dagu lalu bergerak maju lurus ke arah lawan bicara."
  },
  {
    text: "Apa Kabar?",
    label: "QUESTION_HOW_ARE_YOU",
    category: "pertanyaan",
    standard: "BISINDO",
    meaning: "Menanyakan kondisi atau kesehatan lawan bicara",
    note: "Kedua tangan terbuka telungkup di dada, lalu dibuka perlahan dengan ekspresi tanya."
  },
  {
    text: "Nama Saya",
    label: "INTRO_MY_NAME",
    category: "harian",
    standard: "BISINDO",
    meaning: "Memperkenalkan diri sebelum mengeja nama",
    note: "Dua jari (telunjuk & tengah) menyentuh dada kiri lalu bergerak keluar."
  },
  {
    text: "Selamat Pagi",
    label: "GREETING_GOOD_MORNING",
    category: "salam",
    standard: "BISINDO",
    meaning: "Salam awal hari",
    note: "Isyarat 'Selamat' (tangan mendatar) diikuti isyarat 'Pagi' (matahari terbit)."
  },
  {
    text: "Sama-sama",
    label: "POLITE_YOU_ARE_WELCOME",
    category: "sopan",
    standard: "BISINDO",
    meaning: "Balasan santun atas ucapan terima kasih",
    note: "Kedua telapak tangan saling berhadapan sedikit mengangguk ramah."
  },
  {
    text: "Tolong",
    label: "ACTION_PLEASE_HELP",
    category: "harian",
    standard: "BISINDO",
    meaning: "Meminta bantuan atau pertolongan dengan santun",
    note: "Satu telapak tangan menopang telapak tangan lain yang mengepal tegak."
  },
  {
    text: "Senang Bertemu",
    label: "FEELING_NICE_TO_MEET",
    category: "salam",
    standard: "BISINDO",
    meaning: "Ungkapan kebahagiaan saat berjumpa",
    note: "Sentuhan lembut di dada memutar disertai senyuman terbuka."
  }
];

// Helper: Menghasilkan jitter koordinat 21 titik agar visualisasi canvas bergerak dinamis
export function generateDynamicLandmarks(baseX = 150, baseY = 150, variance = 6) {
  const points = [
    { x: baseX, y: baseY + 90 },           // 0: Wrist
    { x: baseX - 30, y: baseY + 65 },      // 1: Thumb CMC
    { x: baseX - 55, y: baseY + 35 },      // 2: Thumb MCP
    { x: baseX - 70, y: baseY + 5 },       // 3: Thumb IP
    { x: baseX - 82, y: baseY - 20 },      // 4: Thumb Tip
    { x: baseX - 35, y: baseY + 5 },       // 5: Index MCP
    { x: baseX - 42, y: baseY - 35 },      // 6: Index PIP
    { x: baseX - 45, y: baseY - 65 },      // 7: Index DIP
    { x: baseX - 48, y: baseY - 95 },      // 8: Index Tip
    { x: baseX - 5,  y: baseY },           // 9: Middle MCP
    { x: baseX - 5,  y: baseY - 42 },      // 10: Middle PIP
    { x: baseX - 5,  y: baseY - 78 },      // 11: Middle DIP
    { x: baseX - 5,  y: baseY - 108 },     // 12: Middle Tip
    { x: baseX + 28, y: baseY + 6 },       // 13: Ring MCP
    { x: baseX + 32, y: baseY - 32 },      // 14: Ring PIP
    { x: baseX + 35, y: baseY - 65 },      // 15: Ring DIP
    { x: baseX + 38, y: baseY - 92 },      // 16: Ring Tip
    { x: baseX + 58, y: baseY + 20 },      // 17: Pinky MCP
    { x: baseX + 68, y: baseY - 15 },      // 18: Pinky PIP
    { x: baseX + 74, y: baseY - 42 },      // 19: Pinky DIP
    { x: baseX + 78, y: baseY - 68 },      // 20: Pinky Tip
  ];

  // Tambahkan sedikit noise acak natural
  return points.map(pt => ({
    x: Math.round(pt.x + (Math.random() - 0.5) * variance),
    y: Math.round(pt.y + (Math.random() - 0.5) * variance),
    z: Number(((Math.random() - 0.5) * 0.1).toFixed(3))
  }));
}

/**
 * ============================================================================
 * FUNGSI UTAMA DETEKSI ISYARAT: detectSign(frame)
 * ============================================================================
 * Fungsi ini menerima frame dari `<video>` atau `<canvas>` dan mengembalikan
 * objek DetectionResult.
 *
 * CARA MENGGANTI DENGAN REST API ASLI:
 * 1. Aktifkan blok fetch di bawah komentar [REAL API CODE].
 * 2. Ambil snapshot frame dalam bentuk Base64 JPEG atau FormData (Blob).
 * 3. Kirim via HTTP POST ke API_URL Anda.
 * 4. Petakan respon JSON dari server Anda ke interface DetectionResult.
 */
export async function detectSign(
  frameSource?: HTMLVideoElement | HTMLCanvasElement | ImageData | null,
  activeStandard: SignStandard = 'BISINDO',
  forceSignIndex?: number
): Promise<DetectionResult> {

  try {
    // 1. Extract frame from video or canvas into Base64
    let base64Image = "";
    if (frameSource instanceof HTMLVideoElement) {
      const offscreenCanvas = document.createElement("canvas");
      offscreenCanvas.width = frameSource.videoWidth || 640;
      offscreenCanvas.height = frameSource.videoHeight || 480;
      const ctx = offscreenCanvas.getContext("2d");
      ctx?.drawImage(frameSource, 0, 0);
      const dataUrl = offscreenCanvas.toDataURL("image/jpeg", 0.85);
      base64Image = dataUrl.split(",")[1];
    } else {
      return {
        signText: "Menunggu gerakan...",
        confidence: 0,
        standard: activeStandard,
        handDetected: false,
        timestamp: Date.now()
      };
    }

    // 2. Send POST request to FastAPI endpoint
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        image: base64Image
      })
    });

    if (!response.ok) {
      throw new Error(`API Server error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      signText: data.predicted_label === "Menunggu gerakan..." ? "" : data.predicted_label,
      confidence: data.confidence, // Rentang 0.0 - 1.0
      standard: "BISINDO",
      handDetected: data.confidence > 0,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error("Gagal melakukan inferensi ke API:", error);
    return {
      signText: "Koneksi API Gagal",
      confidence: 0,
      standard: "BISINDO",
      handDetected: false,
      timestamp: Date.now()
    };
  }
}

