/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { LiveDemo } from './components/LiveDemo';
import { TechStack } from './components/TechStack';
import { UseCases } from './components/UseCases';
import { Footer } from './components/Footer';
import { Language } from './types';

export default function App() {
  const [lang, setLang] = useState<Language>('id');

  // Pastikan selalu dalam mode gelap secara permanen
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'id' ? 'en' : 'id'));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-zinc-100 selection:bg-amber-600/30 selection:text-amber-200">
      
      {/* Skip to Main Content Link for Keyboard / Screen Reader Accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none"
      >
        {lang === 'id' ? 'Loncat ke konten utama' : 'Skip to main content'}
      </a>

      {/* Sticky Header / Navbar */}
      <Navbar
        lang={lang}
        onToggleLang={handleToggleLang}
      />

      {/* Main Landmark */}
      <main id="main-content" className="flex-1">
        
        {/* 1. Hero Section */}
        <Hero lang={lang} />

        {/* 2. Cara Kerja (3 Langkah Interaktif) */}
        <HowItWorks lang={lang} />

        {/* 3. Live Demo (Kamera, Canvas Landmark, Hasil, API Integration) */}
        <LiveDemo lang={lang} />

        {/* 4. Tumpukan Teknologi & Arsitektur Pipeline */}
        <TechStack lang={lang} />

        {/* 5. Penerapan / Kasus Penggunaan */}
        <UseCases lang={lang} />

      </main>

      {/* Footer & Closing CTA */}
      <Footer lang={lang} />

    </div>
  );
}
