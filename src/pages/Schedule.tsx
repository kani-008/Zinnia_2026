import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Calendar, Shield, MapPin, ChevronRight, Zap } from 'lucide-react';
import { store } from '../services/store';

export const SchedulePage: React.FC = () => {
  const [tab, setTab] = useState<'TECHNICAL' | 'NON_TECHNICAL' | 'ALL'>('ALL');
  const events = store.getEvents();

  const scheduleList = [
    // Technical
    { time: '10:00 AM - 10:45 AM', duration: '1 hr', event: 'Debugging', mission: 'Operation: System Recovery', category: 'TECHNICAL', venue: 'Cyber Lab 01', track: 'Short Session' },
    { time: '11:15 AM - 12:15 PM', duration: '1 hr', event: 'AI Event', mission: 'Operation: ORACLE', category: 'TECHNICAL', venue: 'AI Research Arena', track: 'Short Session' },
    { time: '12:30 PM - 01:30 PM', duration: '1 hr', event: 'Lost in SQL', mission: 'Operation: Broken Records', category: 'TECHNICAL', venue: 'Database Lab', track: 'Short Session' },
    { time: '10:00 AM - 01:30 PM', duration: '3 hrs 30 mins', event: 'Infinity Challenge (Single event)', mission: 'Operation: Infinity Protocol', category: 'TECHNICAL', venue: 'Main Innovation Center', track: 'Marathon' },
    { time: '10:30 AM - 01:00 PM', duration: '2 hr 30 mins', event: 'UI/UX Design (Single event)', mission: 'Operation: Mission Control', category: 'TECHNICAL', venue: 'Design Studio', track: 'Marathon' },
    
    // Non-Technical
    { time: '10:45 AM - 01:00 PM', duration: '2 hrs 15 minutes', event: 'Borderland at Gce', mission: 'Borderland at Gce', category: 'NON_TECHNICAL', venue: 'Campus Quadrangle', track: 'Campus Event' },
    { time: '11:00 AM - 12:00 PM', duration: '1 hr', event: 'Think, Strike and Win', mission: 'Think, Strike and Win', category: 'NON_TECHNICAL', venue: 'Seminar Hall B', track: 'Stage Event' },
    { time: '12:00 PM - 01:00 PM', duration: '1 hr', event: 'Plot twist', mission: 'Plot twist', category: 'NON_TECHNICAL', venue: 'Media Studio', track: 'Creative Event' },
    { time: '12:30 PM - 01:00 PM', duration: '30 minutes', event: 'Short film', mission: 'Short film', category: 'NON_TECHNICAL', venue: 'Main Auditorium Screen 01', track: 'Screening' }
  ];

  const filtered = scheduleList.filter(s => {
    if (tab === 'ALL') return true;
    return s.category === tab;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 text-xs font-mono tracking-widest uppercase">
          <Calendar className="w-3.5 h-3.5" />
          OFFICIAL SYMPOSIUM TIMETABLE // 17 SEPTEMBER 2026
        </div>
        <h1 className="text-4xl sm:text-5xl font-heading font-black text-white">
          OPERATION <span className="text-cyan-400">SCHEDULE</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto font-mono text-xs sm:text-sm">
          Coordinated timing for technical operations, non-technical missions, and symposium milestones.
        </p>
      </div>

      {/* Track filter */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
          {(['ALL', 'TECHNICAL', 'NON_TECHNICAL'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg font-bold transition-all ${
                tab === t
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t === 'ALL' ? 'COMPLETE SCHEDULE' : `${t.replace('_', ' ')} TRACK`}
            </button>
          ))}
        </div>
      </div>

      {/* Main Schedule Table / Cards */}
      <div className="glass-panel p-6 sm:p-8 tech-bracket border-cyan-500/30 overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-cyan-500/30 text-cyan-400 pb-3">
              <th className="pb-3 px-3 font-bold">TIME</th>
              <th className="pb-3 px-3 font-bold">DURATION</th>
              <th className="pb-3 px-3 font-bold">MISSION / EVENT</th>
              <th className="pb-3 px-3 font-bold">CATEGORY</th>
              <th className="pb-3 px-3 font-bold">VENUE</th>
              <th className="pb-3 px-3 font-bold text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filtered.map((item, idx) => (
              <tr key={idx} className="hover:bg-cyan-950/20 transition-colors group">
                <td className="py-4 px-3 text-white font-bold whitespace-nowrap flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{item.time}</span>
                </td>
                <td className="py-4 px-3 text-slate-400 whitespace-nowrap">
                  {item.duration}
                </td>
                <td className="py-4 px-3">
                  <div className="font-heading font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                    {item.mission}
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans">
                    {item.event}
                  </div>
                </td>
                <td className="py-4 px-3 whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.category === 'TECHNICAL'
                      ? 'bg-blue-950 text-blue-400 border border-blue-500/30'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {item.category}
                  </span>
                </td>
                <td className="py-4 px-3 text-slate-300 flex items-center gap-1.5 mt-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{item.venue}</span>
                </td>
                <td className="py-4 px-3 text-right whitespace-nowrap">
                  <Link
                    to="/register"
                    className="px-3 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-950/50 transition-colors font-bold text-[11px] inline-flex items-center gap-1"
                  >
                    <span>ENROLL</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Timeline note */}
      <div className="p-4 rounded bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
        <span>* Gates open for check-in at 08:45 AM. Lunch distribution commences at 12:30 PM.</span>
        <Link to="/register" className="text-cyan-400 hover:underline">Register to receive Digital Passport &rarr;</Link>
      </div>
    </div>
  );
};
