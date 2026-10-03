/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Camera, Cpu, MessageSquareText, Terminal, ArrowRight } from 'lucide-react';
import { HandSkeleton } from './HandSvgIcons';
import { Language } from '../types';

interface HowItWorksProps {
  lang: Language;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ lang }) => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      index: "01",
      tag: "INPUT_STREAM",
      title: lang === 'id' ? "Ekstraksi 128 Fitur Spasial" : "128 Spatial Feature Extraction",
      desc: lang === 'id' 
        ? "Video streaming dari kamera dikirim ke API untuk mengekstrak koordinat tangan \(Kiri & Kanan\) yang dinormalisasi dengan vektor jarak antar-tangan."
        : "Video feed is sent to the API to extract normalized hand coordinates \(Left & Right\) along with an inter-hand distance vector.",
      sub: "OpenCV | MediaPipe Tasks API"
    },
    {
      index: "02",
      tag: "TEMPORAL_MODEL",
      title: lang === 'id' ? "Inferensi Keras Dense Network" : "Keras Dense Network Inference",
      desc: lang === 'id'
        ? "Matriks koordinat diproses oleh model Feedforward Neural Network \(FNN\) yang dilatih dengan ~130.000 sampel augmentasi BISINDO."
        : "The coordinate matrix is processed by a Feedforward Neural Network \(FNN\) trained on ~130,000 augmented BISINDO samples.",
      sub: "TensorFlow | Keras | FastAPI"
    },
    {
      index: "03",
      tag: "OUTPUT_PIPELINE",
      title: lang === 'id' ? "Smoothing & Sintesis Suara" : "Smoothing & Audio Synthesis",
      desc: lang === 'id'
        ? "Prediksi dikumpulkan \(Majority Voting dari 15 frame\) untuk menghindari kedipan, lalu diubah menjadi teks dan suara oleh web."
        : "Predictions are aggregated \(Majority Voting over 15 frames\) to prevent flickering, then synthesized to text and speech by the web.",
      sub: "Majority Voting | Web Speech API"
    }
  ];

  return (
    <section 
      id="cara-kerja" 
      className="py-16 sm:py-20 border-b border-zinc-800/80"
      aria-labelledby="how-it-works-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="font-mono text-xs text-amber-500 mb-1 tracking-wider uppercase">
              {lang === 'id' ? '// 01. ALUR ARSITEKTUR' : '// 01. ARCHITECTURE PIPELINE'}
            </div>
            <h2 
              id="how-it-works-heading" 
              className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans"
            >
              {lang === 'id' ? 'Cara Kerja Sistem Pipeline' : 'How the System Operates'}
            </h2>
          </div>
          <p className="text-xs font-mono text-zinc-400 max-w-sm">
            {lang === 'id' 
              ? "Dari tangkapan citra kamera hingga teks berstruktur dalam hitungan milidetik." 
              : "From raw video frames to synthesized language in milliseconds."}
          </p>
        </div>

        {/* 3-Column Bordered Grid (ssych minimalist style) */}
        <div className="grid grid-cols-1 md:grid-cols-3 border border-zinc-800 rounded-lg overflow-hidden divide-y md:divide-y-0 md:divide-x divide-zinc-800 bg-[#0a0a0c]">
          {steps.map((step, idx) => {
            const isCurrent = activeStep === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={`text-left p-6 transition-colors flex flex-col justify-between group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 ${
                  isCurrent 
                    ? 'bg-zinc-900/60' 
                    : 'hover:bg-zinc-900/30'
                }`}
                aria-pressed={isCurrent}
              >
                <div>
                  {/* Step Monospace Tag */}
                  <div className="flex items-center justify-between text-xs font-mono mb-4">
                    <span className="font-bold text-zinc-500 group-hover:text-zinc-300">
                      [{step.index}]
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {step.tag}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-zinc-100 mb-2 font-sans group-hover:text-white">
                    {step.title}
                  </h3>

                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-zinc-850 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>{step.sub}</span>
                  {isCurrent && <span className="text-amber-500">ACTIVE</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Technical Drilldown Panel */}
        <div className="mt-4 p-4 rounded-lg border border-zinc-800 bg-[#0a0a0c] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2 text-zinc-200">
            <Terminal className="w-4 h-4 text-amber-500" />
            <span className="font-bold">INSPECTOR:</span>
            <span>{steps[activeStep].title}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-zinc-500">
            <span>PIPELINE: WEBRTC &gt; WASM &gt; MODEL</span>
            <span className="text-zinc-400">FORMAT: 21_LANDMARKS_JSON</span>
          </div>
        </div>

      </div>
    </section>
  );
};

