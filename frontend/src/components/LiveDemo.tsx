/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Camera,
  CameraOff,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useSignDetection, DetectionError } from '../hooks/useSignDetection';
import { Language } from '../types';

interface LiveDemoProps {
  lang: Language;
}

const PRIVACY_TEXT: Record<Language, string> = {
  id: 'Video kamera diproses langsung di browser menggunakan MediaPipe. Hanya 152 angka koordinat fitur yang dikirim ke server lokal untuk klasifikasi.',
  en: 'Camera video is processed locally in your browser via MediaPipe. Only 152 numeric feature coordinates are sent to the local server for classification.',
};

function getErrorMessage(error: DetectionError | null, lang: Language): string {
  switch (error) {
    case 'unsupported':
      return lang === 'id'
        ? 'Peramban tidak mendukung akses kamera (getUserMedia). Gunakan peramban modern.'
        : 'Browser does not support camera access (getUserMedia). Please use a modern browser.';
    case 'denied':
      return lang === 'id'
        ? 'Izin kamera ditolak di peramban Anda. Silakan izinkan akses kamera di ikon gembok URL.'
        : 'Camera permission denied. Please allow camera access in your browser address bar.';
    case 'model':
      return lang === 'id'
        ? 'Gagal memuat model pelacak tangan MediaPipe. Pastikan aset telah disiapkan (npm run setup:assets).'
        : 'Failed to load MediaPipe hand landmarker model. Make sure assets are prepared (npm run setup:assets).';
    case 'camera':
    default:
      return lang === 'id'
        ? 'Tidak dapat membuka perangkat kamera. Pastikan kamera tidak sedang dipakai aplikasi lain.'
        : 'Could not access camera device. Make sure it is not in use by another application.';
  }
}

export const LiveDemo: React.FC<LiveDemoProps> = ({ lang }) => {
  const [showLandmarkOverlay, setShowLandmarkOverlay] = useState<boolean>(true);

  const {
    videoRef,
    canvasRef,
    status,
    error,
    apiStatus,
    result,
    handDetected,
    fps,
    start,
    stop,
  } = useSignDetection(showLandmarkOverlay);

  const isActive = status === 'active';
  const confidencePct = result ? Math.max(0, Math.min(100, result.confidence * 100)) : 0;

  let displayToken: string;
  if (!isActive) {
    displayToken = lang === 'id' ? 'Menunggu kamera...' : 'Waiting for camera...';
  } else if (apiStatus === 'offline') {
    displayToken = lang === 'id' ? 'API Offline' : 'API Offline';
  } else if (result) {
    displayToken = result.label;
  } else if (handDetected) {
    displayToken = lang === 'id' ? 'Menganalisis...' : 'Analyzing...';
  } else {
    displayToken = lang === 'id' ? 'Menunggu gerakan...' : 'Waiting for hand...';
  }

  return (
    <section
      id="demo"
      className="py-16 sm:py-20 border-b border-zinc-800/80 bg-[#09090b]"
      aria-labelledby="live-demo-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="font-mono text-xs text-amber-500 mb-1 tracking-wider uppercase">
              {lang === 'id' ? '// 02. WORKBENCH INFERENSI' : '// 02. INFERENCE WORKBENCH'}
            </div>
            <h2
              id="live-demo-heading"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans"
            >
              {lang === 'id' ? 'Live Demo Kamera & Deteksi Isyarat' : 'Live Camera & Gesture Demo'}
            </h2>
          </div>
        </div>

        {/* Workbench Layout: Video Canvas + Inspector Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT PANEL: Video Feed Frame (7 Columns) */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            {/* Camera Viewport with Hairline Borders and Crosshair Accents */}
            <div className="relative aspect-4/3 w-full bg-black rounded border border-zinc-800 overflow-hidden flex items-center justify-center">
              {/* Corner Indicators */}
              <div className="absolute top-2 left-2 font-mono text-[10px] text-zinc-600 select-none z-20">+</div>
              <div className="absolute top-2 right-2 font-mono text-[10px] text-zinc-600 select-none z-20">+</div>
              <div className="absolute bottom-2 left-2 font-mono text-[10px] text-zinc-600 select-none z-20">+</div>
              <div className="absolute bottom-2 right-2 font-mono text-[10px] text-zinc-600 select-none z-20">+</div>

              {/* Video Element (mirrored horizontally for natural webcam feel) */}
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${
                  isActive ? 'block' : 'hidden'
                }`}
                aria-label={lang === 'id' ? 'Tampilan kamera langsung' : 'Live camera feed'}
              />

              {/* 2D Canvas Landmark Overlay (mirrored to match video) */}
              <canvas
                ref={canvasRef}
                className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none z-10 ${
                  isActive && showLandmarkOverlay ? 'block' : 'hidden'
                }`}
              />

              {/* State: Idle */}
              {status === 'idle' && (
                <div className="p-6 text-center max-w-sm z-20 space-y-3 font-mono">
                  <div className="w-12 h-12 rounded border border-zinc-800 bg-zinc-900/80 text-zinc-400 mx-auto flex items-center justify-center">
                    <Camera className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white uppercase tracking-wider">
                      {lang === 'id' ? 'KAMERA BELUM AKTIF' : 'CAMERA STANDBY'}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 font-sans">
                      {lang === 'id'
                        ? 'Pelacakan tangan berjalan langsung di browser Anda. Klik tombol di bawah untuk memulai.'
                        : 'Hand tracking runs directly in your browser. Click below to begin.'}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                    <button
                      onClick={start}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-mono font-medium text-zinc-950 bg-zinc-100 hover:bg-white rounded border border-zinc-200 transition-all"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{lang === 'id' ? 'Aktifkan Kamera' : 'Start Camera'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* State: Loading (Camera permission + MediaPipe initialization) */}
              {status === 'loading' && (
                <div className="text-center p-6 z-20 space-y-2 font-mono text-zinc-300">
                  <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs uppercase tracking-wider">
                    {lang === 'id'
                      ? 'Menyiapkan kamera & model MediaPipe...'
                      : 'Initializing camera & MediaPipe model...'}
                  </p>
                </div>
              )}

              {/* State: Denied or Error */}
              {(status === 'denied' || status === 'error') && (
                <div className="p-6 text-center max-w-sm z-20 space-y-3 font-mono">
                  <div className="w-10 h-10 rounded border border-rose-900 bg-rose-950/40 text-rose-400 mx-auto flex items-center justify-center">
                    <CameraOff className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-rose-300 font-sans">
                    {getErrorMessage(error, lang)}
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={start}
                      className="px-3 py-1.5 text-xs font-mono text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700"
                    >
                      {lang === 'id' ? 'Coba Lagi' : 'Retry'}
                    </button>
                  </div>
                </div>
              )}

              {/* Status Header Overlay */}
              {isActive && (
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-20 pointer-events-none text-[10px] font-mono">
                  <div className="flex items-center gap-1.5 bg-black/80 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{`LIVE · ${fps} FPS`}</span>
                  </div>

                  <div className="flex items-center gap-2 bg-black/80 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                    <span>BISINDO</span>
                    <span className="text-zinc-600">/</span>
                    <span className={handDetected ? 'text-emerald-400 font-bold' : 'text-amber-500'}>
                      {handDetected ? 'HAND_DETECTED' : 'SEARCHING'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded border border-zinc-800 bg-[#0a0a0c] text-xs font-mono">
              <div className="flex items-center gap-2">
                {isActive ? (
                  <button
                    onClick={stop}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-rose-400 border border-rose-900/60 bg-rose-950/20 hover:bg-rose-950/40 rounded transition-colors"
                  >
                    <CameraOff className="w-3.5 h-3.5" />
                    <span>{lang === 'id' ? 'Matikan' : 'Stop'}</span>
                  </button>
                ) : (
                  <button
                    onClick={start}
                    disabled={status === 'loading'}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-zinc-950 bg-zinc-100 hover:bg-white disabled:opacity-50 rounded transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{lang === 'id' ? 'Aktifkan Kamera' : 'Start Camera'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLandmarkOverlay((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                    showLandmarkOverlay
                      ? 'text-emerald-400 border-emerald-900/60 bg-emerald-950/20 hover:bg-emerald-950/40'
                      : 'text-zinc-400 border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/60'
                  }`}
                >
                  {showLandmarkOverlay ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{lang === 'id' ? 'Kerangka Tangan' : 'Hand Skeleton'}</span>
                </button>
              </div>
            </div>

            {/* Privacy note */}
            <div className="flex items-center gap-2 p-2.5 rounded border border-zinc-850 bg-zinc-900/30 text-[11px] font-mono text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{PRIVACY_TEXT[lang]}</span>
            </div>
          </div>

          {/* RIGHT PANEL: Inspector Result (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            {/* Live Detected Token */}
            <div className="p-5 rounded border border-zinc-800 bg-[#0a0a0c] space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-2 text-[11px] font-mono text-zinc-500">
                <span>INFERRED_TOKEN</span>
                <span className="text-zinc-300">BISINDO</span>
              </div>

              {/* Large Result Display */}
              <div
                aria-live="polite"
                aria-atomic="true"
                className="min-h-[80px] flex flex-col justify-center"
              >
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
                  {displayToken}
                </div>
              </div>

              {/* Confidence Meter */}
              <div className="space-y-1 pt-1 font-mono text-xs">
                <div className="flex justify-between text-zinc-400 text-[11px]">
                  <span>CONFIDENCE</span>
                  <span className="text-zinc-200 font-bold">
                    {confidencePct > 0 ? `${confidencePct.toFixed(1)}%` : '0%'}
                  </span>
                </div>
                <div className="w-full bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-150"
                    style={{ width: `${confidencePct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Backend API connection alert when offline or mismatched */}
            {(apiStatus === 'offline' || apiStatus === 'mismatch') && (
              <div className="flex items-start gap-2.5 p-3 rounded border border-amber-900/60 bg-amber-950/20 text-xs text-amber-300 font-mono">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  {apiStatus === 'offline'
                    ? lang === 'id'
                      ? 'Server FastAPI belum terhubung. Jalankan `python 4_api.py` (atau `start_api.bat`) agar prediksi huruf aktif.'
                      : 'FastAPI server is offline. Run `python 4_api.py` (or `start_api.bat`) to enable sign predictions.'
                    : lang === 'id'
                      ? 'Jumlah fitur model pada server tidak cocok dengan ekstraktor frontend.'
                      : 'Server model feature count does not match the frontend extractor.'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
