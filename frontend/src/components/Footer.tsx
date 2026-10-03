/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Github, Mail, Video, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { Language } from '../types';

interface FooterProps {
  lang: Language;
}

export const Footer: React.FC<FooterProps> = ({ lang }) => {
  const currentYear = new Date().getFullYear();

  return (
    <>
      {/* Minimalist Closing CTA Panel */}
      <section className="py-14 sm:py-16 border-b border-zinc-800 bg-[#09090b]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="p-8 sm:p-10 rounded-lg border border-zinc-800 bg-[#0c0c0e] relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            {/* Corner Crosshairs */}
            <div className="absolute top-1.5 left-2 font-mono text-[10px] text-zinc-600 select-none">+</div>
            <div className="absolute top-1.5 right-2 font-mono text-[10px] text-zinc-600 select-none">+</div>
            <div className="absolute bottom-1.5 left-2 font-mono text-[10px] text-zinc-600 select-none">+</div>
            <div className="absolute bottom-1.5 right-2 font-mono text-[10px] text-zinc-600 select-none">+</div>

            <div className="space-y-2 max-w-xl">
              <div className="font-mono text-[11px] text-amber-500 uppercase tracking-wider">
                {lang === 'id' ? '// MULAI PENGUJIAN' : '// START TESTING'}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
                {lang === 'id' 
                  ? 'Coba Langsung Penerjemah Isyarat Real-Time' 
                  : 'Test Real-Time Sign Translation Instantly'}
              </h2>
              <p className="text-xs text-zinc-400 font-sans">
                {lang === 'id'
                  ? 'Aktifkan kamera peramban Anda untuk menguji ekstraksi 21 titik sendi dan translasi teks instan.'
                  : 'Enable your camera to test 21-joint landmark extraction and instant text translation.'}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <a
                href="#demo"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium text-zinc-950 bg-zinc-100 hover:bg-white rounded border border-zinc-200 transition-all active:scale-[0.98]"
              >
                <Video className="w-4 h-4" />
                <span>{lang === 'id' ? 'Buka Demo' : 'Launch Demo'}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* Semantic Minimalist Footer */}
      <footer className="bg-[#09090b] text-zinc-400 py-10 text-xs font-mono" role="contentinfo">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-zinc-850 pb-8">
            
            {/* Brand Logo & Tag */}
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded border border-zinc-750 bg-zinc-900 flex items-center justify-center text-amber-500 text-xs font-bold">
                IK
              </div>
              <span className="font-sans font-bold text-white text-sm">
                isyaratkita
              </span>
              <span className="text-zinc-600">/</span>
              <span className="text-[11px] text-zinc-500">
                BISINDO & SIBI Computer Vision Engine
              </span>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
              <a href="#beranda" className="hover:text-white transition-colors">Overview</a>
              <a href="#cara-kerja" className="hover:text-white transition-colors">Pipeline</a>
              <a href="#demo" className="hover:text-white transition-colors">Live Demo</a>
              <a href="#teknologi" className="hover:text-white transition-colors">Specifications</a>
              <a href="#kasus-penggunaan" className="hover:text-white transition-colors">Applications</a>
            </div>

          </div>

          {/* Bottom Bar: Operational Status & Copyright */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[11px] text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-zinc-400">SYSTEM: ALL SERVICES OPERATIONAL</span>
              <span className="text-zinc-700">·</span>
              <span>100% CLIENT ON-DEVICE PRIVACY</span>
            </div>

            <div className="flex items-center gap-4">
              <span>&copy; {currentYear} IsyaratKita. Open-source research.</span>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
                aria-label="GitHub"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub</span>
              </a>
            </div>
          </div>

        </div>
      </footer>
    </>
  );
};
