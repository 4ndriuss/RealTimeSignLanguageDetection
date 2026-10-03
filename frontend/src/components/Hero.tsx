/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowRight, Play, Video, Terminal, Shield, Cpu, Activity } from 'lucide-react';
import { HandSkeleton } from './HandSvgIcons';
import { Language } from '../types';

interface HeroProps {
  lang: Language;
}

const DEMO_PHRASES = [
  { text: "Halo, selamat datang!", label: "BISINDO_SALAM", confidence: 97.4, time: "22ms" },
  { text: "Terima kasih banyak.", label: "BISINDO_SOPAN", confidence: 98.6, time: "21ms" },
  { text: "Senang berkenalan.", label: "BISINDO_RAMAH", confidence: 96.2, time: "24ms" },
  { text: "Semoga harimu baik.", label: "BISINDO_DOA", confidence: 95.8, time: "23ms" },
];

export const Hero: React.FC<HeroProps> = ({ lang }) => {
  const [activePhraseIndex, setActivePhraseIndex] = useState(0);
  const [activeNode, setActiveNode] = useState(8);

  useEffect(() => {
    const timer = setInterval(() => {
      setActivePhraseIndex((prev) => (prev + 1) % DEMO_PHRASES.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const nodeTimer = setInterval(() => {
      setActiveNode((prev) => {
        const keyNodes = [4, 8, 12, 16, 20, 0, 9];
        const nextIdx = (keyNodes.indexOf(prev) + 1) % keyNodes.length;
        return keyNodes[nextIdx];
      });
    }, 900);
    return () => clearInterval(nodeTimer);
  }, []);

  const activePhrase = DEMO_PHRASES[activePhraseIndex];

  return (
    <section 
      id="beranda" 
      className="relative pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-zinc-800/80 overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Top Monospace Status Chip (ssych bare style) */}
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-zinc-800 bg-zinc-900/60 font-mono text-[11px] text-zinc-300 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
          <span>{lang === 'id' ? 'INFERENSI REAL-TIME' : 'REAL-TIME INFERENCE'}</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-400">BISINDO & SIBI</span>
          <span className="text-zinc-600">/</span>
          <span className="text-amber-500">&lt;30MS</span>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="max-w-3xl space-y-4">
          <h1 
            id="hero-heading" 
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-100 leading-[1.08] font-sans"
          >
            {lang === 'id' ? (
              <>
                Menerjemahkan Bahasa Isyarat <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400">
                  Secara Real-Time dari Kamera.
                </span>
              </>
            ) : (
              <>
                Translating Sign Language <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400">
                  in Real-Time from Your Camera.
                </span>
              </>
            )}
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl font-sans">
            {lang === 'id' 
              ? "Sistem pengenal gerak tangan berbasis visi komputer yang mengubah gestur BISINDO dan SIBI menjadi teks dan suara seketika, langsung di peramban tanpa mengunggah video ke server."
              : "A browser-native computer vision system translating Indonesian sign gestures into instant text and speech without uploading camera feeds to external servers."}
          </p>
        </div>

        {/* Actions Button Row */}
        <div className="flex flex-wrap items-center gap-3 pt-6 pb-12">
          <a
            href="#demo"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-medium text-zinc-950 bg-zinc-100 hover:bg-white rounded border border-zinc-200 shadow-sm transition-all active:scale-[0.98]"
          >
            <Video className="w-4 h-4" aria-hidden="true" />
            <span>{lang === 'id' ? "Buka Live Demo" : "Launch Live Demo"}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5 text-zinc-700" />
          </a>

          <a
            href="#cara-kerja"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono text-zinc-300 hover:text-white bg-zinc-900/60 hover:bg-zinc-850 rounded border border-zinc-800 hover:border-zinc-700 transition-all"
          >
            <Terminal className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
            <span>{lang === 'id' ? "Lihat Arsitektur" : "View Architecture"}</span>
          </a>
        </div>

        {/* Centerpiece Display Frame with ssych Crosshairs (+) */}
        <div className="relative rounded-lg border border-zinc-800 bg-[#0c0c0e] overflow-hidden shadow-2xl">
          
          {/* Corner Crosshairs */}
          <div className="absolute top-1.5 left-2 font-mono text-[10px] text-zinc-600 select-none pointer-events-none">+</div>
          <div className="absolute top-1.5 right-2 font-mono text-[10px] text-zinc-600 select-none pointer-events-none">+</div>
          <div className="absolute bottom-1.5 left-2 font-mono text-[10px] text-zinc-600 select-none pointer-events-none">+</div>
          <div className="absolute bottom-1.5 right-2 font-mono text-[10px] text-zinc-600 select-none pointer-events-none">+</div>

          {/* Workbench Header Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-900/40 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-zinc-200 font-semibold">FEED_01: WEBCAM_INSPECTOR</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-zinc-400">
              <span className="hidden sm:inline">NODES: 21_LANDMARKS</span>
              <span className="text-zinc-300">FPS: 30</span>
              <span className="text-amber-500 font-bold">{activePhrase.time}</span>
            </div>
          </div>

          {/* Screen Canvas Area */}
          <div className="relative aspect-16/9 sm:aspect-21/9 w-full bg-black flex items-center justify-center overflow-hidden">
            
            {/* Subtle Matrix Grid */}
            <div 
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: "linear-gradient(#52525b 1px, transparent 1px), linear-gradient(90deg, #52525b 1px, transparent 1px)",
                backgroundSize: "32px 32px"
              }}
              aria-hidden="true"
            />

            {/* Corner Alignment Reticles */}
            <div className="absolute top-4 left-4 w-3 h-3 border-t border-l border-zinc-600" />
            <div className="absolute top-4 right-4 w-3 h-3 border-t border-r border-zinc-600" />
            <div className="absolute bottom-4 left-4 w-3 h-3 border-b border-l border-zinc-600" />
            <div className="absolute bottom-4 right-4 w-3 h-3 border-b border-r border-zinc-600" />

            {/* Visual Hand Skeleton with MediaPipe connection lines */}
            <div className="relative w-48 h-48 sm:w-60 sm:h-60 flex items-center justify-center">
              <HandSkeleton 
                className="w-full h-full drop-shadow-[0_0_12px_rgba(245,158,11,0.25)]" 
                activeNodeIndex={activeNode}
                strokeColor="#a1a1aa"
                nodeColor="#d97706"
              />

              {/* Bounding box marker */}
              <div className="absolute inset-2 border border-dashed border-zinc-700/80 rounded pointer-events-none">
                <span className="absolute -top-2.5 left-2 bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 px-1 py-0.2">
                  HAND_BOUNDS [NORM_XYZ]
                </span>
              </div>
            </div>

            {/* Live Translation HUD Panel */}
            <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-md bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded p-3 text-left">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1">
                <span className="text-amber-500 font-semibold flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  {activePhrase.label}
                </span>
                <span className="text-emerald-400 font-mono font-bold">
                  {activePhrase.confidence}% MATCH
                </span>
              </div>
              <div className="text-base sm:text-lg font-bold text-white tracking-tight">
                &ldquo;{activePhrase.text}&rdquo;
              </div>
            </div>

          </div>

          {/* Workbench Footer Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-zinc-800 border-t border-zinc-800 bg-zinc-900/40 text-[11px] font-mono text-zinc-400">
            <div className="px-3 py-2">
              <span className="text-zinc-600 block text-[9px] uppercase">Latency</span>
              <span className="text-zinc-200 font-bold">&lt; 30 ms</span>
            </div>
            <div className="px-3 py-2">
              <span className="text-zinc-600 block text-[9px] uppercase">Landmarks</span>
              <span className="text-zinc-200 font-bold">21 Joint Coordinates</span>
            </div>
            <div className="px-3 py-2">
              <span className="text-zinc-600 block text-[9px] uppercase">Linguistics</span>
              <span className="text-zinc-200 font-bold">BISINDO & SIBI</span>
            </div>
            <div className="px-3 py-2">
              <span className="text-zinc-600 block text-[9px] uppercase">Privacy</span>
              <span className="text-emerald-400 font-bold">100% Client-Side</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
