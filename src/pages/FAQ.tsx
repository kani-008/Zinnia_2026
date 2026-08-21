import React, { useState } from 'react';
import { sound } from '../services/sound';
import { PageHeader } from '../components/ui/PageHeader';
import { HelpCircle, Search, ChevronDown, ChevronUp, Zap, Sparkles } from 'lucide-react';

export const FAQPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'EVENTS' | 'REGISTRATION' | 'PASS' | 'LOGISTICS'>('ALL');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      category: 'REGISTRATION',
      q: 'Who is eligible to participate in ZINNIA 2026?',
      a: 'All engineering students (B.E / B.Tech / M.E / M.Tech / MCA / B.Sc CS / BCA) across any college and department are eligible to participate.'
    },
    {
      category: 'EVENTS',
      q: 'Can I register for both Technical and Non-Technical events?',
      a: 'Yes! You can register for multiple technical and non-technical tracks, provided their schedule times do not overlap. However, single marathon events (like Infinity Protocol or UI/UX Design) run continuously and cannot be combined with other parallel tracks.'
    },
    {
      category: 'PASS',
      q: 'What is the Digital Cyber Pass and how do I use it on symposium day?',
      a: 'Your Digital Cyber Pass contains your unique Agent ID (e.g. ZIN26-A8F41C) and a verified QR token. Simply show this QR code on your phone at the campus entrance and lunch counters.'
    },
    {
      category: 'LOGISTICS',
      q: 'Is food and lunch provided for all registered participants?',
      a: 'Yes! A complimentary lunch and morning refreshments are provided to all verified registered participants upon scanning their Cyber Pass at the food counter.'
    },
    {
      category: 'EVENTS',
      q: 'Are certificates provided for all participants?',
      a: 'Yes. Official digitally signed e-certificates with instant QR verification are issued to all attendees who attend their registered events. 1st, 2nd, and 3rd place winners also receive cash rewards and trophies.'
    },
    {
      category: 'LOGISTICS',
      q: 'What is the exact venue for ZINNIA 2026?',
      a: 'The symposium takes place on 17 September 2026 across the Department of Computer Science & Engineering and Main Auditorium, Government College of Engineering (GCE), Salem - 636 011.'
    }
  ];

  const filtered = faqs.filter(item => {
    const matchesCat = activeCategory === 'ALL' || item.category === activeCategory;
    const matchesSearch = 
      item.q.toLowerCase().includes(search.toLowerCase()) || 
      item.a.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="page-container py-12 space-y-10 font-mono text-xs">
      {/* Header */}
      <PageHeader
        badgeText="SYMPOSIUM KNOWLEDGE BASE"
        badgeIcon={<HelpCircle className="w-3.5 h-3.5 text-cyan-400" />}
        title="FREQUENTLY ASKED"
        glitchWord="QUESTIONS"
        description="Official guidance regarding event registrations, team participation, food tokens, and certificates."
        highlightTag="HELP DESK"
      />

      {/* Search & Category Tabs */}
      <div className="cyber-card p-4 cyber-bracket border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-[#070c1b]/95 max-w-3xl mx-auto">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search inquiries..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded bg-[#040711] border border-slate-700 text-white font-sans text-xs focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 font-bold">
          {(['ALL', 'EVENTS', 'REGISTRATION', 'PASS', 'LOGISTICS'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => {
                sound.playKeyClick();
                setActiveCategory(cat);
              }}
              className={`px-2.5 py-1.5 rounded text-[10px] transition-all ${
                activeCategory === cat
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                  : 'bg-[#040711] text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="max-w-3xl mx-auto space-y-3">
        {filtered.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="cyber-card cyber-bracket border-slate-800 overflow-hidden bg-[#070c1b]/90 transition-all hover:border-cyan-400"
            >
              <button
                onClick={() => {
                  sound.playKeyClick();
                  setOpenIndex(isOpen ? null : idx);
                }}
                className="w-full p-4 text-left flex justify-between items-center gap-4 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-cyan-400 font-bold">Q{idx + 1}.</span>
                  <span className="font-heading font-bold text-white text-xs font-sans">
                    {item.q}
                  </span>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="p-4 pt-0 border-t border-slate-800/80 text-slate-300 font-sans text-xs leading-relaxed bg-[#040711]/60">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FAQPage;
