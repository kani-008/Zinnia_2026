import React, { useState } from 'react';
import { EventMission, EventType } from '@packages/types/src';
import { store } from '../../../../../src/services/store';
import { Zap, Edit, CheckCircle2, AlertCircle, Plus, Search, Filter } from 'lucide-react';

export interface EventManagementProps {
  events?: EventMission[];
}

export const EventManagement: React.FC<EventManagementProps> = ({ events: propEvents }) => {
  const [filterType, setFilterType] = useState<'ALL' | EventType>('ALL');
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState<EventMission[]>(propEvents || store.getEvents());

  const filtered = events.filter(e => {
    const matchType = filterType === 'ALL' || e.event_type === filterType;
    const matchSearch = e.mission_name.toLowerCase().includes(search.toLowerCase()) ||
      e.code.toLowerCase().includes(search.toLowerCase()) ||
      e.title.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-heading font-black text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            MISSION CONFIGURATION MATRIX (TECH & NON-TECH)
          </h2>
          <p className="text-slate-400 text-[11px] mt-0.5">
            Single events table with strict TECH / NON_TECH classification and result controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(['ALL', 'TECH', 'NON_TECH'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              className={`px-3 py-1.5 rounded font-bold transition-all ${
                filterType === tab
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {tab === 'ALL' ? 'ALL MISSIONS' : tab === 'TECH' ? 'TECH ONLY' : 'NON-TECH ONLY'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Missions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((evt) => (
          <div key={evt.id} className="classified-card p-5 tech-bracket border-slate-800 space-y-3 bg-[#070b14]/90 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-bold border border-cyan-500/30">
                  {evt.code}
                </span>
                <span className={`px-2 py-0.5 rounded font-bold ${
                  evt.event_type === 'TECH' 
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' 
                    : 'bg-violet-950 text-violet-300 border border-violet-500/40'
                }`}>
                  {evt.event_type}
                </span>
              </div>

              <div>
                <h3 className="text-white font-heading font-bold text-sm font-sans">{evt.mission_name}</h3>
                <div className="text-slate-400 text-xs mt-0.5 font-sans">Designation: {evt.title}</div>
              </div>

              <p className="text-slate-300 text-[11px] font-sans line-clamp-2">
                {evt.description}
              </p>

              <div className="text-[10px] text-slate-400 space-y-1 pt-2 border-t border-slate-900">
                <div className="flex justify-between">
                  <span>VENUE:</span>
                  <strong className="text-slate-200">{evt.venue}</strong>
                </div>
                <div className="flex justify-between">
                  <span>SCHEDULE:</span>
                  <strong className="text-slate-200">{evt.schedule_time}</strong>
                </div>
                <div className="flex justify-between">
                  <span>TEAM SIZE:</span>
                  <strong className="text-slate-200">{evt.team_size_min}-{evt.team_size_max} Agents</strong>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-900 flex justify-between items-center text-[10px]">
              <span className={`flex items-center gap-1 font-bold ${
                evt.results_finalized ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {evt.results_finalized ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {evt.results_finalized ? 'RESULTS FINALIZED' : 'IN PROGRESS'}
              </span>

              <span className="text-slate-500 uppercase">{evt.clearance_level}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventManagement;
