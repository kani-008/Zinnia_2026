import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ChevronDown, ChevronUp, Shield, Terminal, ArrowRight } from 'lucide-react';
import { GlitchText } from '../components/hero/GlitchText';

interface FAQItem {
  q: string;
  a: string;
  category: string;
}

export const FAQPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      category: 'GENERAL & PASSPORT',
      q: 'What is ZINNIA 2026 and how is it structured?',
      a: 'ZINNIA 2026 is the annual flagship technical symposium hosted by the Department of Computer Science & Engineering. The event is framed within a classified sci-fi theme where every participant acts as a Temporal Agent investigating the disappearance of Black Cipher. Participants receive a Digital Symposium Passport for campus check-in, food distribution, and mission verification.'
    },
    {
      category: 'GENERAL & PASSPORT',
      q: 'How does the single QR code system work?',
      a: 'After completing your online registration, a unique Participant ID (e.g. ZIN26-A8F41C) and Digital Passport with an encrypted QR code is generated. You can present this single QR code on your mobile device at the Main Gate for campus entry, at the Food Station for lunch/refreshments, and at specific event halls for mission check-ins.'
    },
    {
      category: 'MISSIONS & RULES',
      q: 'Can I register for multiple events?',
      a: 'Yes! You can select multiple short technical and non-technical missions as long as their timings do not directly conflict. Note that single-event marathon tracks (like Operation: Infinity Protocol or UI/UX Design) run for the full duration and are mutually exclusive.'
    },
    {
      category: 'MISSIONS & RULES',
      q: 'What if my phone battery dies or the camera fails to scan my QR code?',
      a: 'All CHRONOS verification stations are equipped with a Manual Agent ID Fallback lookup. Simply state or show your 6-character Agent ID (e.g. ZIN26-XXXXXX) to staff to verify your attendance and claim meals.'
    },
    {
      category: 'FOOD & CERTIFICATES',
      q: 'Will participants receive food and certificates?',
      a: 'Yes. All registered attendees receive lunch and refreshments (token verified via your Digital Passport). E-certificates of participation and winner merit awards will be issued and directly accessible from your Digital Passport portal.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 text-xs font-mono tracking-widest uppercase">
          <HelpCircle className="w-3.5 h-3.5" />
          CHRONOS SECURITY BRIEFING // FAQ
        </div>
        <h1 className="text-3xl sm:text-5xl font-heading font-black text-white">
          FREQUENTLY ASKED <GlitchText text="QUESTIONS" />
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto font-mono text-xs sm:text-sm">
          Clearance protocols, passport guidelines, and symposium rules.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="glass-panel tech-bracket border-slate-800 hover:border-cyan-500/40 transition-all overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full p-5 text-left flex justify-between items-center gap-4 focus:outline-none"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-wider">
                  {faq.category}
                </span>
                <h3 className="text-base font-heading font-bold text-white">
                  {faq.q}
                </h3>
              </div>
              <div className="p-1.5 rounded-full bg-slate-900 border border-slate-700 text-cyan-400 shrink-0">
                {openIndex === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {openIndex === idx && (
              <div className="px-5 pb-5 pt-1 text-sm text-slate-300 font-sans leading-relaxed border-t border-slate-800/60">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 text-center font-mono text-xs text-slate-400 space-y-2">
        <div>Have further inquiries about registration or event venues?</div>
        <Link to="/contact" className="text-cyan-400 hover:underline font-bold inline-flex items-center gap-1">
          <span>Contact CHRONOS Command Desk</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
