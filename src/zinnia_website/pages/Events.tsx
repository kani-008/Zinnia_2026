import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { store } from '../../services/store';
import { EventMission } from '@packages/types/src';
import { audioManager } from '../core/AudioManager';
import { WebsiteNavbar } from '../components/Navbar';
import { Users, Clock, MapPin, ArrowRight, ArrowLeft, Trophy, Sparkles, Shield, Zap } from 'lucide-react';

export const WebsiteEventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'TECH' | 'NON_TECH'>('TECH');
  const [events, setEvents] = useState<EventMission[]>(() => store.getEvents());

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setEvents(store.getEvents());
    });
    store.syncFromSupabase();
    return () => unsub();
  }, []);

  const techEvents = events.filter((e) => e.event_type === 'TECH');
  const nonTechEvents = events.filter((e) => e.event_type === 'NON_TECH');
  const currentEvents = activeTab === 'TECH' ? techEvents : nonTechEvents;

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-[#F2F2F0] select-none">
      {/* Top Navbar */}
      <WebsiteNavbar />

      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
        {/* Back Link */}
        <div>
          <Link
            to="/"
            onClick={() => audioManager.playNodeEngage()}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1A1A1D] border border-[#3A3A3E] text-xs font-mono text-[#A8A8AC] hover:text-white hover:border-[#F5D90A] transition-all shadow-[2px_2px_0px_#000000]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>RETURN TO TIMELINE</span>
          </Link>
        </div>

        {/* Header Panel */}
        <div className="p-6 sm:p-8 bg-[#1A1A1D] border-[3px] border-[#3A3A3E] shadow-[5px_5px_0px_#000000] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-block px-3 py-0.5 bg-[#F5D90A] text-[#0D0D0F] font-comic text-xs font-black uppercase tracking-wider -rotate-1 shadow-[2px_2px_0px_#8A7400]">
              // SYMPOSIUM BATTLEGROUNDS
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display text-white tracking-tight uppercase">
              WARZONE DIRECTORY
            </h1>
            <p className="text-xs sm:text-sm font-comic text-[#A8A8AC] font-medium">
              9 National-Level Competitions across Technical Breakthroughs & Tactical Mastery
            </p>
          </div>

          {/* Tab Selector Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setActiveTab('TECH');
                audioManager.playNodeEngage();
              }}
              className={`px-4 sm:px-5 py-2.5 font-comic text-xs sm:text-sm uppercase tracking-wider font-extrabold transition-all border-[2.5px] cursor-pointer flex items-center gap-2 ${
                activeTab === 'TECH'
                  ? 'bg-[#3CE7FF] text-[#0D0D0F] border-[#3CE7FF] shadow-[4px_4px_0px_#1E8FA3] -rotate-1'
                  : 'bg-[#141417] text-[#A8A8AC] hover:text-white border-[#3A3A3E] shadow-[2.5px_2.5px_0px_#000000]'
              }`}
            >
              <span>⚡ TECHNICAL</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-black ${
                activeTab === 'TECH' ? 'bg-[#0D0D0F] text-[#3CE7FF]' : 'bg-[#2A2A2E] text-[#F2F2F0]'
              }`}>
                {techEvents.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('NON_TECH');
                audioManager.playNodeEngage();
              }}
              className={`px-4 sm:px-5 py-2.5 font-comic text-xs sm:text-sm uppercase tracking-wider font-extrabold transition-all border-[2.5px] cursor-pointer flex items-center gap-2 ${
                activeTab === 'NON_TECH'
                  ? 'bg-[#FF3366] text-white border-[#FF3366] shadow-[4px_4px_0px_#B01F45] rotate-1'
                  : 'bg-[#141417] text-[#A8A8AC] hover:text-white border-[#3A3A3E] shadow-[2.5px_2.5px_0px_#000000]'
              }`}
            >
              <span>🎮 NON-TECHNICAL</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-black ${
                activeTab === 'NON_TECH' ? 'bg-white text-[#FF3366]' : 'bg-[#2A2A2E] text-[#F2F2F0]'
              }`}>
                {nonTechEvents.length}
              </span>
            </button>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentEvents.map((e) => {
            const isTech = e.event_type === 'TECH';
            const accentBorder = isTech ? 'border-[#3CE7FF] hover:shadow-[6px_6px_0px_#1E8FA3]' : 'border-[#FF3366] hover:shadow-[6px_6px_0px_#B01F45]';
            const badgeBg = isTech ? 'bg-[#3CE7FF] text-[#0D0D0F]' : 'bg-[#FF3366] text-white';

            return (
              <div
                key={e.id}
                className={`p-6 bg-[#1A1A1D] border-[3px] ${accentBorder} shadow-[4.5px_4.5px_0px_#000000] transition-all duration-200 hover:-translate-y-1.5 flex flex-col justify-between space-y-4`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`px-2.5 py-0.5 font-mono text-[11px] font-black uppercase tracking-wider border border-black shadow-[2px_2px_0px_#000000] ${badgeBg}`}>
                      {e.code}
                    </span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#141417] border border-[#3A3A3E] text-[10px] font-mono text-[#A8A8AC]">
                      <Users className="w-3.5 h-3.5 text-[#F5D90A]" />
                      <span>
                        Team: {e.team_size_min}{e.team_size_min !== e.team_size_max ? `-${e.team_size_max}` : ''}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-bold text-white uppercase tracking-wide leading-snug">
                      {e.mission_name}
                    </h3>
                    <div className={`font-comic text-xs font-bold uppercase tracking-wider pt-0.5 ${isTech ? 'text-[#3CE7FF]' : 'text-[#FF3366]'}`}>
                      {e.title}
                    </div>
                  </div>

                  <p className="font-comic text-xs text-[#A8A8AC] leading-relaxed">{e.description}</p>

                  {/* Rules preview */}
                  {e.rules && e.rules.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="text-[9px] font-mono text-[#F5D90A] uppercase tracking-widest font-bold">
                        // RULES & FORMAT
                      </div>
                      <div className="space-y-1">
                        {e.rules.slice(0, 3).map((rule, rIdx) => (
                          <div key={rIdx} className="text-[10px] font-comic text-[#D0D0D4] leading-tight">
                            • {rule}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[#3A3A3E]/80 space-y-3">
                  <div className="flex justify-between text-[11px] font-mono text-[#A8A8AC]">
                    <div className="flex items-center gap-1.5 truncate max-w-[55%]">
                      <MapPin className="w-3.5 h-3.5 text-[#3CE7FF]" />
                      <span className="truncate">{e.venue}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#F5D90A]" />
                      <span>{e.schedule_time}</span>
                    </div>
                  </div>

                  <Link
                    to={`/register?mission=${e.id}`}
                    onClick={() => audioManager.playNodeEngage()}
                    className={`w-full py-2.5 px-3 font-display text-xs tracking-wider uppercase font-bold flex items-center justify-center gap-2 border-[2px] transition-all shadow-[3px_3px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 ${
                      isTech
                        ? 'bg-[#141417] text-[#3CE7FF] border-[#3CE7FF] hover:bg-[#3CE7FF] hover:text-[#0D0D0F]'
                        : 'bg-[#141417] text-[#FF3366] border-[#FF3366] hover:bg-[#FF3366] hover:text-white'
                    }`}
                  >
                    <span>REGISTER FOR {e.code}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WebsiteEventsPage;
