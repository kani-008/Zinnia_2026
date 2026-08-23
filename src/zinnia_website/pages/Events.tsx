import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { store } from '../../services/store';
import { audioManager } from '../core/AudioManager';
import { Trophy, Users, Clock, MapPin, ArrowRight } from 'lucide-react';

export const WebsiteEventsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'TECH' | 'NON_TECH'>('TECH');
  const allEvents = store.getEvents();

  const techEvents = allEvents.filter((e) => e.event_type === 'TECH');
  const nonTechEvents = allEvents.filter((e) => e.event_type === 'NON_TECH');
  const currentEvents = activeTab === 'TECH' ? techEvents : nonTechEvents;

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8 select-none">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-cyan-500/30 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
            // ZINNIA '26 BATTLEGROUNDS
          </div>
          <h1 className="text-3xl font-black text-white font-mono">SYMPOSIUM EVENTS</h1>
          <p className="text-xs text-slate-400 font-light">
            9 National-Level Competitions across Technical Innovation and Strategy
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
          <button
            onClick={() => {
              setActiveTab('TECH');
              audioManager.playNodeEngage();
            }}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'TECH'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            TECHNICAL ({techEvents.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('NON_TECH');
              audioManager.playNodeEngage();
            }}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'NON_TECH'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            NON-TECHNICAL ({nonTechEvents.length})
          </button>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentEvents.map((e) => (
          <div
            key={e.id}
            className="p-6 rounded-2xl bg-slate-950/80 border border-slate-850 backdrop-blur-xl hover:border-cyan-500/40 transition-all duration-200 space-y-4 flex flex-col justify-between group shadow-xl"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                  {e.code}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    Team: {e.team_size_min}-{e.team_size_max}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white font-mono group-hover:text-cyan-300 transition-colors">
                  {e.mission_name}
                </h3>
                <div className="text-xs font-mono text-cyan-400 font-medium">{e.title}</div>
              </div>

              <p className="text-xs text-slate-300 font-light leading-relaxed">{e.description}</p>
            </div>

            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-cyan-500" />
                  <span className="truncate">{e.venue}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{e.schedule_time}</span>
                </div>
              </div>

              <Link
                to={`/register?mission=${e.id}`}
                onClick={() => audioManager.playNodeEngage()}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-black border border-slate-800 hover:border-amber-500 text-slate-200 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                <span>REGISTER FOR {e.code}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WebsiteEventsPage;
