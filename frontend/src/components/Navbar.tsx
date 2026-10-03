/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  Video, 
  Globe2,
  Terminal,
  Activity
} from 'lucide-react';
import { Language } from '../types';

interface NavbarProps {
  lang: Language;
  onToggleLang: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onToggleLang,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "#beranda", label: lang === 'id' ? "Beranda" : "Overview" },
    { href: "#cara-kerja", label: lang === 'id' ? "Cara Kerja" : "Architecture" },
    { href: "#demo", label: lang === 'id' ? "Live Demo" : "Live Demo" },
    { href: "#teknologi", label: lang === 'id' ? "Spesifikasi" : "Specs" },
    { href: "#kasus-penggunaan", label: lang === 'id' ? "Penerapan" : "Use Cases" },
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#09090b]/90 border-b border-zinc-800/80 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Logo Brand in ssych minimal developer style */}
          <a 
            href="#beranda" 
            className="flex items-center gap-2.5 group focus-visible:ring-1 focus-visible:ring-zinc-400 rounded p-1"
            aria-label="IsyaratKita - Beranda"
          >
            <div className="w-7 h-7 rounded border border-zinc-700 bg-zinc-900 flex items-center justify-center text-amber-500 font-mono text-xs font-bold group-hover:border-amber-500/60 transition-colors">
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-4 h-4"
                aria-hidden="true"
              >
                <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
              </svg>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-zinc-100 font-sans">
                isyarat<span className="text-zinc-400">kita</span>
              </span>
              <span className="hidden sm:inline-block font-mono text-[10px] text-zinc-500 border border-zinc-800 bg-zinc-900/80 px-1.5 py-0.5 rounded">
                v1.0
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-5" aria-label="Navigasi Utama">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs font-mono text-zinc-400 hover:text-zinc-100 focus-visible:ring-1 focus-visible:ring-zinc-400 rounded px-1.5 py-0.5 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action Bar */}
          <div className="hidden sm:flex items-center gap-2.5">
            
            {/* Language Switch */}
            <button
              onClick={onToggleLang}
              className="p-1.5 rounded border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5 text-xs font-mono"
              aria-label={lang === 'id' ? "Ganti ke Bahasa Inggris" : "Switch to Indonesian"}
              title={lang === 'id' ? "Bahasa: Indonesia" : "Language: English"}
            >
              <Globe2 className="w-3.5 h-3.5 text-amber-500/80" aria-hidden="true" />
              <span>{lang.toUpperCase()}</span>
            </button>

            {/* Primary CTA */}
            <a
              href="#demo"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-zinc-900 bg-zinc-100 hover:bg-white rounded border border-zinc-200 shadow-sm transition-all active:scale-[0.98]"
            >
              <Video className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{lang === 'id' ? "Jalankan Demo" : "Run Demo"}</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded border border-zinc-800 text-zinc-300 hover:bg-zinc-800 focus-visible:ring-1 focus-visible:ring-zinc-400"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-zinc-800 bg-[#09090b] px-4 pt-3 pb-5 space-y-2">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={handleLinkClick}
                className="px-3 py-2 rounded text-sm font-mono text-zinc-300 hover:bg-zinc-900 hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="pt-3 border-t border-zinc-850 flex items-center justify-between">
            <button
              onClick={onToggleLang}
              className="px-2.5 py-1 text-xs font-mono rounded border border-zinc-800 bg-zinc-900 text-zinc-300 flex items-center gap-1.5"
            >
              <Globe2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Lang: {lang.toUpperCase()}</span>
            </button>
            <a
              href="#demo"
              onClick={handleLinkClick}
              className="px-3 py-1.5 text-xs font-mono font-medium text-zinc-900 bg-zinc-100 rounded inline-flex items-center gap-1.5"
            >
              <Video className="w-3.5 h-3.5" />
              Demo
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
