/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  CameraOff, 
  Volume2, 
  Copy, 
  RotateCcw, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  Play, 
  Code2,
  Trash2,
  Terminal,
  Activity
} from 'lucide-react';
import { 
  detectSign, 
  API_URL, 
  PRIVACY_STATEMENT, 
  KNOWN_SIGNS, 
  generateDynamicLandmarks 
} from '../services/signDetector';
import { HAND_CONNECTIONS } from './HandSvgIcons';
import { CameraStatus, DetectionResult, HistoryEntry, Language, SignStandard } from '../types';

interface LiveDemoProps {
  lang: Language;
}

export const LiveDemo: React.FC<LiveDemoProps> = ({ lang }) => {
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isHandDetected, setIsHandDetected] = useState<boolean>(true);
  
  const [activeStandard, setActiveStandard] = useState<SignStandard>('BISINDO');
  const [showLandmarkOverlay, setShowLandmarkOverlay] = useState<boolean>(true);
  const [detectionSpeed, setDetectionSpeed] = useState<'normal' | 'fast'>('normal');
  const [showApiGuide, setShowApiGuide] = useState<boolean>(false);

  const [currentResult, setCurrentResult] = useState<DetectionResult>({
    signText: "Menunggu gerakan...",
    signLabel: "STANDBY",
    confidence: 0,
    standard: 'BISINDO',
    handDetected: false,
    timestamp: Date.now()
  });

  const [sentenceHistory, setSentenceHistory] = useState<HistoryEntry[]>([]);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isLoopRunningRef = useRef<boolean>(false);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = useCallback(() => {
    isLoopRunningRef.current = false;
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, []);

const runDetectionLoop = useCallback(async () => {
    if (!isLoopRunningRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      const result = await detectSign(video, activeStandard);

      if (isLoopRunningRef.current) {
        setCurrentResult(result);
        setIsHandDetected(result.handDetected);

        const delay = detectionSpeed === 'fast' ? 700 : 1200;
        setTimeout(() => {
          if (isLoopRunningRef.current) {
            animFrameIdRef.current = requestAnimationFrame(runDetectionLoop);
          }
        }, delay);
      }
    } catch (err) {
      console.error("Kesalahan loop deteksi:", err);
      if (isLoopRunningRef.current) {
        setTimeout(runDetectionLoop, 1500);
      }
    }
  }, [activeStandard, showLandmarkOverlay, detectionSpeed]);

  const startCamera = async () => {
    setCameraStatus('requesting');
    setErrorMessage('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus('error');
      setErrorMessage(
        lang === 'id' 
          ? 'Peramban tidak mendukung akses kamera (getUserMedia). Gunakan peramban yang mendukung.'
          : 'Browser does not support getUserMedia. Use a supported browser.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraStatus('active');
          isLoopRunningRef.current = true;
          runDetectionLoop();
        };
      }
    } catch (err: any) {
      console.warn("Gagal membuka kamera:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
        setErrorMessage(
          lang === 'id'
            ? 'Izin kamera ditolak di peramban Anda. Silakan izinkan akses kamera di ikon gembok URL.'
            : 'Camera permission denied. Please allow camera permissions in browser settings.'
        );
      } else {
        setCameraStatus('error');
        setErrorMessage(
          lang === 'id'
            ? `Tidak dapat membuka perangkat kamera (${err.message || 'Perangkat sedang dipakai'}).`
            : `Could not access camera (${err.message || 'Device busy'}).`
        );
      }
    }
  };

const addCurrentSignToSentence = () => {
    if (!currentResult.signText || currentResult.signText === "Menunggu gerakan...") return;

    const lastWord = sentenceHistory[sentenceHistory.length - 1]?.text;
    if (lastWord === currentResult.signText) return;

    const newEntry: HistoryEntry = {
      id: `${Date.now()}-${Math.random()}`,
      text: currentResult.signText,
      timestamp: Date.now(),
      confidence: currentResult.confidence,
      standard: currentResult.standard,
    };

    setSentenceHistory((prev) => [...prev, newEntry]);
  };

  const removeLastWord = () => {
    setSentenceHistory((prev) => prev.slice(0, -1));
  };

  const clearSentence = () => {
    setSentenceHistory([]);
  };

  const fullSentenceString = sentenceHistory.map((s) => s.text).join(' ');

  const copyToClipboard = async () => {
    const textToCopy = fullSentenceString || currentResult.signText;
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2000);
    } catch (err) {
      console.error("Gagal menyalin:", err);
    }
  };

  const speakText = () => {
    const textToSpeak = fullSentenceString || currentResult.signText;
    if (!textToSpeak || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = lang === 'id' ? 'id-ID' : 'en-US';
    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

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
          
          {/* SISI KIRI: Video Feed Frame (7 Kolom) */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            
            {/* Camera Viewport with Hairline Borders and Crosshair Accents */}
            <div className="relative aspect-4/3 w-full bg-black rounded border border-zinc-800 overflow-hidden flex items-center justify-center">
              
              {/* Corner Indicators */}
              <div className="absolute top-2 left-2 font-mono text-[10px] text-zinc-600 select-none z-20">+</div>
              <div className="absolute top-2 right-2 font-mono text-[10px] text-zinc-600 select-none z-20">+</div>
              <div className="absolute bottom-2 left-2 font-mono text-[10px] text-zinc-600 select-none z-20">+</div>
              <div className="absolute bottom-2 right-2 font-mono text-[10px] text-zinc-600 select-none z-20">+</div>

              {/* Video Element */}
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${
                  cameraStatus === 'active' ? 'block' : 'hidden'
                }`}
                aria-label="Tampilan kamera langsung"
              />

              {/* 2D Canvas Landmark Overlay */}

              {/* State: Idle */}
              {cameraStatus === 'idle' && (
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
                        ? 'Video dianalisis secara lokal di browser Anda. Klik tombol di bawah untuk memulai.'
                        : 'Video is analyzed locally in your browser. Click below to begin.'}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                    <button
                      onClick={startCamera}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-mono font-medium text-zinc-950 bg-zinc-100 hover:bg-white rounded border border-zinc-200 transition-all"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{lang === 'id' ? 'Aktifkan Kamera' : 'Start Camera'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* State: Requesting */}
              {cameraStatus === 'requesting' && (
                <div className="text-center p-6 z-20 space-y-2 font-mono text-zinc-300">
                  <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs uppercase tracking-wider">
                    {lang === 'id' ? 'Meminta izin kamera...' : 'Requesting camera...'}
                  </p>
                </div>
              )}

              {/* State: Denied */}
              {cameraStatus === 'denied' && (
                <div className="p-6 text-center max-w-sm z-20 space-y-3 font-mono">
                  <div className="w-10 h-10 rounded border border-rose-900 bg-rose-950/40 text-rose-400 mx-auto flex items-center justify-center">
                    <CameraOff className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-rose-300 font-sans">
                    {errorMessage}
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={startCamera}
                      className="px-3 py-1.5 text-xs font-mono text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}              {/* Status Header Overlay */}
              {(cameraStatus === 'active') && (
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-20 pointer-events-none text-[10px] font-mono">
                  <div className="flex items-center gap-1.5 bg-black/80 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                    <span className={`w-1.5 h-1.5 rounded-full ${cameraStatus === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span>{cameraStatus === 'active' ? 'LIVE · 30 FPS' : 'VIRTUAL STREAM'}</span>
                  </div>

                  <div className="flex items-center gap-2 bg-black/80 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                    <span>{activeStandard}</span>
                    <span className="text-zinc-600">/</span>
                    <span className={isHandDetected ? 'text-emerald-400 font-bold' : 'text-amber-500'}>
                      {isHandDetected ? 'HAND_DETECTED' : 'SEARCHING'}
                    </span>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded border border-zinc-800 bg-[#0a0a0c] text-xs font-mono">
              <div className="flex items-center gap-2">
                {cameraStatus === 'active' ? (
                  <button
                    onClick={() => {
                      stopCamera();
                      setCameraStatus('idle');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-rose-400 border border-rose-900/60 bg-rose-950/20 hover:bg-rose-950/40 rounded transition-colors"
                  >
                    <CameraOff className="w-3.5 h-3.5" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    onClick={startCamera}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-zinc-950 bg-zinc-100 hover:bg-white rounded transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Start Camera</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
              </div>
            </div>            {/* Privacy note */}
            <div className="flex items-center gap-2 p-2.5 rounded border border-zinc-850 bg-zinc-900/30 text-[11px] font-mono text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{PRIVACY_STATEMENT}</span>
            </div>

          </div>

          {/* SISI KANAN: Inspector Result (5 Kolom) */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            
            {/* Live Detected Token */}
            <div className="p-5 rounded border border-zinc-800 bg-[#0a0a0c] space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-2 text-[11px] font-mono text-zinc-500">
                <span>INFERRED_TOKEN</span>
                <span className="text-zinc-300">{currentResult.standard}</span>
              </div>

              {/* Large Result Display */}
              <div 
                aria-live="polite" 
                aria-atomic="true"
                className="min-h-[80px] flex flex-col justify-center"
              >
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
                  {currentResult.signText}
                </div>
                {currentResult.culturalNote && (
                  <p className="text-xs text-zinc-400 mt-1 italic font-sans">
                    {currentResult.culturalNote}
                  </p>
                )}
              </div>

              {/* Confidence Meter */}
              <div className="space-y-1 pt-1 font-mono text-xs">
                <div className="flex justify-between text-zinc-400 text-[11px]">
                  <span>CONFIDENCE</span>
                  <span className="text-zinc-200 font-bold">
                    {currentResult.confidence > 0 ? `${(currentResult.confidence * 100).toFixed(1)}%` : '0%'}
                  </span>
                </div>
                <div className="w-full bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, currentResult.confidence * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};




