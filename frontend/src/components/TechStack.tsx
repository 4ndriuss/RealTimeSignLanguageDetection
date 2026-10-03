/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Cpu, Terminal, Binary, Check } from 'lucide-react';
import { Language } from '../types';

interface TechStackProps {
  lang: Language;
}

export const TechStack: React.FC<TechStackProps> = ({ lang }) => {
  const specs = [
    { label: "EXTRACTION_PIPELINE", value: "MediaPipe (128 Features: L+R Hands & Inter-Hand Vector)" },
    { label: "SPATIAL_NORMALIZATION", value: "Wrist-Relative Translation & Scale Invariance" },
    { label: "CLASSIFIER_MODEL", value: "Dense Neural Network (FNN) w/ BatchNormalization" },
    { label: "DATA_AUGMENTATION", value: "Rotation, Jitter, and Mirror Augmentation (~130k samples)" },
    { label: "EXECUTION_RUNTIME", value: "Python / Keras / FastAPI Backend" },
    { label: "MODEL_ACCURACY", value: "97.96% Test Accuracy (Held-out Set)" },
  ];

  const techCards = [
    {
      code: "VISION / ML",
      name: "Google MediaPipe",
      desc: lang === 'id' 
        ? "Mengekstrak 42 titik spasial 3D secara kontinu dari tangan kiri dan kanan melalui OpenCV/Python." 
        : "Extracts 42 3D joint landmarks continuously from left and right hands via OpenCV/Python."
    },
    {
      code: "MODEL / TRAIN",
      name: "TensorFlow & Keras",
      desc: lang === 'id'
        ? "Arsitektur Dense Network berbobot ringan yang di-training menggunakan dataset Kaggle BISINDO."
        : "Lightweight Dense Network architecture trained on the BISINDO Kaggle dataset."
    },
    {
      code: "SERVER / REST",
      name: "Python FastAPI",
      desc: lang === 'id'
        ? "API server asinkron yang menerima frame kamera (Base64) dan membalas prediksi secara real-time."
        : "Asynchronous API server receiving camera frames (Base64) and returning real-time predictions."
    },
    {
      code: "A11Y / SPEECH",
      name: "Web Speech & ARIA",
      desc: lang === 'id'
        ? "Membacakan hasil teks menjadi suara dan menyiarkannya ke pembaca layar (screen reader)."
        : "Synthesizes translated tokens into speech audio and broadcasts to assistive screen readers."
    }
  ];

  return (
    <section 
      id="teknologi" 
      className="py-16 sm:py-20 border-b border-zinc-800/80"
      aria-labelledby="tech-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="font-mono text-xs text-amber-500 mb-1 tracking-wider uppercase">
              {lang === 'id' ? '// 03. SPESIFIKASI & ENGINE' : '// 03. ENGINE SPECS'}
            </div>
            <h2 
              id="tech-heading" 
              className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans"
            >
              {lang === 'id' ? 'Tumpukan Teknologi & Spesifikasi' : 'Technology Stack & Specifications'}
            </h2>
          </div>
          <p className="text-xs font-mono text-zinc-400 max-w-sm">
            {lang === 'id'
              ? "Arsitektur client-first berorientasi latensi rendah dan perlindungan data lokal."
              : "Client-first architecture engineered for sub-30ms latency and strict local privacy."}
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-zinc-800 rounded-lg overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-zinc-800 bg-[#0a0a0c] mb-6">
          {techCards.map((tech, idx) => (
            <div key={idx} className="p-5 flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] text-zinc-500 block mb-2">
                  {tech.code}
                </span>
                <h3 className="text-sm font-bold text-zinc-100 mb-1 font-sans">
                  {tech.name}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {tech.desc}
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-zinc-850 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                <Check className="w-3 h-3" />
                <span>SUPPORTED</span>
              </div>
            </div>
          ))}
        </div>

        {/* Technical Data Specification Sheet (ssych developer table style) */}
        <div className="rounded-lg border border-zinc-800 bg-[#0a0a0c] overflow-hidden font-mono text-xs">
          <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/40 text-[11px] text-zinc-400 flex items-center justify-between">
            <span className="text-zinc-200 font-bold">SYSTEM_BENCHMARKS & PARAMETERS</span>
            <span className="text-amber-500">FORMAT: V1.0_SPECS</span>
          </div>

          <div className="divide-y divide-zinc-850">
            {specs.map((item, idx) => (
              <div key={idx} className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                <span className="text-zinc-500">{item.label}</span>
                <span className="text-zinc-200 font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
