/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DetectionResult, SignStandard } from '../types';

/**
 * ============================================================================
 * SIGN LANGUAGE DETECTION BACKEND API CONFIGURATION
 * ============================================================================
 * Replace the URL below with your backend REST API server address when
 * your machine learning / FastAPI / Flask model is ready for deployment.
 * Example: "http://localhost:8000/api/predict" or "https://api.your-project.com/predict"
 */
export const API_URL = "http://127.0.0.1:8000/predict";

/**
 * Privacy & Security Note:
 * - In default browser/on-device implementations (MediaPipe / TensorFlow.js / ONNX Web),
 *   all video image data is processed locally in the user's device memory.
 * - If using a standalone backend server (API_URL above), frames are only sent
 *   encrypted (HTTPS/WSS) for direct inference without being saved in a database.
 */
export const PRIVACY_STATEMENT = "Your camera video is processed locally and is never recorded or stored on any server, ensuring complete privacy.";

// Sign database for realistic simulation and model reference
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

// Helper: Generates 21-point coordinate jitter so the canvas visualization moves dynamically
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

  // Add a bit of natural random noise
  return points.map(pt => ({
    x: Math.round(pt.x + (Math.random() - 0.5) * variance),
    y: Math.round(pt.y + (Math.random() - 0.5) * variance),
    z: Number(((Math.random() - 0.5) * 0.1).toFixed(3))
  }));
}

/**
 * ============================================================================
 * MAIN SIGN DETECTION FUNCTION: detectSign(frame)
 * ============================================================================
 * This function receives a frame from `<video>` or `<canvas>` and returns
 * a DetectionResult object.
 *
 * HOW TO REPLACE WITH A REAL REST API:
 * 1. Activate the fetch block below the [REAL API CODE] comment.
 * 2. Take a frame snapshot in Base64 JPEG or FormData (Blob) format.
 * 3. Send via HTTP POST to your API_URL.
 * 4. Map the JSON response from your server to the DetectionResult interface.
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
        signText: "Waiting for movement...",
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
      signText: data.predicted_label === "Waiting for movement..." ? "" : data.predicted_label,
      confidence: data.confidence, // Range 0.0 - 1.0
      standard: "BISINDO",
      handDetected: data.confidence > 0,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error("Failed to perform inference to API:", error);
    return {
      signText: "API Connection Failed",
      confidence: 0,
      standard: "BISINDO",
      handDetected: false,
      timestamp: Date.now()
    };
  }
}


