/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Building2, Stethoscope, GraduationCap, MessageCircle } from 'lucide-react';
import { Language } from '../types';

interface UseCasesProps {
  lang: Language;
}

export const UseCases: React.FC<UseCasesProps> = ({ lang }) => {
  const cases = [
    {
      code: "CIVIC_SERVICE",
      title: lang === 'id' ? "Loket Layanan Publik & Bank" : "Public Service Desks & Banks",
      desc: lang === 'id'
        ? "Memfasilitasi komunikasi langsung saat mengurus administrasi kependudukan, perbankan, dan tiket transportasi umum tanpa harus menunggu JBI fisik."
        : "Empowers immediate face-to-face assistance for civil documentation, banking, and public transit terminals.",
      metric: "LATENCY: INSTANT"
    },
    {
      code: "HEALTHCARE_TRIAGE",
      title: lang === 'id' ? "Fasilitas Kesehatan & IGD" : "Emergency & Healthcare Clinics",
      desc: lang === 'id'
        ? "Membantu petugas medis memahami keluhan gejala dan instruksi pemakaian obat secara akurat demi keselamatan pasien."
        : "Aids clinical personnel in clarifying patient symptoms and prescription instructions during medical consultations.",
      metric: "CRITICAL: ACCURACY"
    },
    {
      code: "CLASSROOM_INCLUSION",
      title: lang === 'id' ? "Pendidikan & Ruang Belajar" : "Inclusive Educational Spaces",
      desc: lang === 'id'
        ? "Mendukung interaksi dinamis antara siswa Tuli dan guru serta rekan sekelas dalam diskusi kelompok dan presentasi tugas."
        : "Facilitates seamless peer-to-peer discussions, group labs, and presentations between Deaf and hearing students.",
      metric: "COLLABORATION: ACTIVE"
    },
    {
      code: "DAILY_COMMUNICATION",
      title: lang === 'id' ? "Percakapan Sehari-hari" : "Everyday Social Interaction",
      desc: lang === 'id'
        ? "Menghubungkan rekan kerja, keluarga, dan tetangga untuk saling bertukar sapaan hangat dan berdialog tanpa keraguan."
        : "Bridges colleagues, family members, and friends for spontaneous daily greetings and natural conversations.",
      metric: "INTEGRATION: BROWSER"
    }
  ];

  return (
    <section 
      id="kasus-penggunaan"
      className="py-16 sm:py-20 border-b border-zinc-800/80"
      aria-labelledby="use-cases-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="font-mono text-xs text-amber-500 mb-1 tracking-wider uppercase">
              {lang === 'id' ? '// 04. PENERAPAN' : '// 04. APPLICATIONS'}
            </div>
            <h2 
              id="use-cases-heading" 
              className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans"
            >
              {lang === 'id' ? 'Skenario Penerapan Nyata' : 'Real-World Applications'}
            </h2>
          </div>
          <p className="text-xs font-mono text-zinc-400 max-w-sm">
            {lang === 'id'
              ? "Menghubungkan komunikasi di titik-titik krusial kehidupan sehari-hari."
              : "Bridging communication across essential real-world touchpoints."}
          </p>
        </div>

        {/* 2x2 / 4 Grid with ssych Hairlines */}
        <div className="grid grid-cols-1 md:grid-cols-2 border border-zinc-800 rounded-lg overflow-hidden divide-y md:divide-y-0 md:divide-x divide-zinc-800 bg-[#0a0a0c]">
          {cases.map((item, idx) => (
            <div key={idx} className="p-6 flex flex-col justify-between hover:bg-zinc-900/30 transition-colors">
              <div>
                <span className="font-mono text-[10px] text-zinc-500 block mb-3">
                  [{item.code}]
                </span>
                <h3 className="text-base font-bold text-zinc-100 mb-2 font-sans">
                  {item.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {item.desc}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-zinc-850 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span>{item.metric}</span>
                <span className="text-zinc-400">READY</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
