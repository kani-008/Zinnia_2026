import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { store } from '../services/store';
import { registerNav } from '../services/registerNavigation';
import { EventMission } from '../types';
import { WebsiteNavbar } from '../components/layout/Navbar';
import { EventScheduleView } from '../components/ui/EventScheduleView';
import { 
  Users, 
  Clock, 
  MapPin, 
  ArrowRight, 
  ArrowLeft, 
  Trophy, 
  Sparkles, 
  Shield, 
  Zap, 
  Cpu, 
  Gamepad2,
  CheckCircle2,
  Flame,
  X
} from 'lucide-react';

export const WebsiteEventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ALL' | 'TECH' | 'NON_TECH'>('ALL');
  const [events, setEvents] = useState<EventMission[]>(() => store.getEvents());
  const [selectedEvent, setSelectedEvent] = useState<EventMission | null>(null);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setEvents(store.getEvents());
    });
    store.syncFromSupabase();
    return () => unsub();
  }, []);

  const techEvents = events.filter((e) => (e.event_type === 'TECH' || e.category === 'TECHNICAL') && e.id !== 'prize-distribution');
  const nonTechEvents = events.filter((e) => (e.event_type === 'NON_TECH' || e.category === 'NON_TECHNICAL') && e.id !== 'prize-distribution');
  const displayEvents = events.filter((e) => e.id !== 'prize-distribution');

  const renderEventCard = (e: EventMission) => {
    const isTech = e.event_type === 'TECH' || e.category === 'TECHNICAL';
    const accentBorder = isTech 
      ? 'border-[#3CE7FF]/70 hover:border-[#3CE7FF] hover:shadow-[6px_6px_0px_#1E8FA3]' 
      : 'border-[#FF3366]/70 hover:border-[#FF3366] hover:shadow-[6px_6px_0px_#B01F45]';
    const badgeBg = isTech ? 'bg-[#3CE7FF] text-[#0D0D0F]' : 'bg-[#FF3366] text-white';

    return (
      <div
        key={e.id}
        onClick={() => setSelectedEvent(e)}
        className={`p-6 bg-[#1A1A1D] border-[3px] ${accentBorder} shadow-[4.5px_4.5px_0px_#000000] transition-all duration-200 hover:-translate-y-1.5 flex flex-col justify-between space-y-4 rounded-xl cursor-pointer`}
      >
        <div className="space-y-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 font-mono text-[11px] font-black uppercase tracking-wider border border-black shadow-[2px_2px_0px_#000000] rounded ${badgeBg}`}>
                {e.code}
              </span>
              {e.is_single_event_only && (
                <span className="px-2 py-0.5 bg-amber-400 text-black text-[10px] font-mono font-bold uppercase rounded border border-black">
                  ★ Single Track
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#141417] border border-[#3A3A3E] text-[10px] font-mono text-[#A8A8AC] rounded">
              <Users className="w-3.5 h-3.5 text-[#F5D90A]" />
              <span>
                Team: {e.team_size_min}{e.team_size_min !== e.team_size_max ? `-${e.team_size_max}` : ''} Member(s)
              </span>
            </div>
          </div>

          <div>
            <h3 className="font-display text-xl font-bold text-white uppercase tracking-wide leading-snug">
              {e.mission_name}
            </h3>
            <div className={`font-comic text-xs font-bold uppercase tracking-wider pt-0.5 ${isTech ? 'text-[#3CE7FF]' : 'text-[#FF3366]'}`}>
              {e.tagline || e.title}
            </div>
          </div>

          <p className="font-comic text-xs text-[#A8A8AC] leading-relaxed line-clamp-3">
            {e.description}
          </p>

          {/* Prizes preview */}
          {e.prizes?.first && (
            <div className="flex items-center gap-2 p-2 bg-[#141417] border border-[#3A3A3E] rounded-lg">
              <Trophy className="w-3.5 h-3.5 text-[#F5D90A] shrink-0" />
              <span className="text-[11px] font-mono text-[#F5D90A] font-bold truncate">
                1st Prize: {e.prizes.first}
              </span>
            </div>
          )}

          {/* Rules preview */}
          {e.rules && e.rules.length > 0 && (
            <div className="space-y-1 pt-1">
              <div className="text-[9px] font-mono text-[#A8A8AC] uppercase tracking-widest font-bold">
                // RULES SNAPSHOT
              </div>
              <div className="space-y-1">
                {e.rules.slice(0, 2).map((rule, rIdx) => (
                  <div key={rIdx} className="text-[10px] font-comic text-[#D0D0D4] leading-tight flex items-start gap-1.5">
                    <span className="text-[#F5D90A]">•</span>
                    <span>{rule}</span>
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

          {e.id === 'prize-distribution' ? (
            <button
              onClick={() => {
                triggerAudio();
                setSelectedEvent(e);
              }}
              className="w-full py-2.5 px-3 font-display text-xs tracking-wider uppercase font-bold flex items-center justify-center gap-2 border-[2px] transition-all shadow-[3px_3px_0px_#000000] rounded-lg active:translate-x-0.5 active:translate-y-0.5 cursor-pointer bg-[#9333EA] text-white border-[#9333EA] hover:bg-[#A855F7]"
            >
              <span>VIEW EVENT DETAILS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => {
                triggerAudio();
                navigate(`/register?mission=${e.id}`);
              }}
              className={`w-full py-2.5 px-3 font-display text-xs tracking-wider uppercase font-bold flex items-center justify-center gap-2 border-[2px] transition-all shadow-[3px_3px_0px_#000000] rounded-lg active:translate-x-0.5 active:translate-y-0.5 cursor-pointer ${
                isTech
                  ? 'bg-[#141417] text-[#3CE7FF] border-[#3CE7FF] hover:bg-[#3CE7FF] hover:text-[#0D0D0F]'
                  : 'bg-[#141417] text-[#FF3366] border-[#FF3366] hover:bg-[#FF3366] hover:text-white'
              }`}
            >
              <span>REGISTER FOR {e.code}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-[#F2F2F0] select-none">
      {/* Top Navbar */}
      <WebsiteNavbar />

      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10">
        {/* Back Link */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1A1A1D] border border-[#3A3A3E] text-xs font-mono text-[#A8A8AC] hover:text-white hover:border-[#F5D90A] transition-all shadow-[2px_2px_0px_#000000] rounded"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>RETURN TO TIMELINE</span>
          </Link>
        </div>

        {/* Header Panel */}
        <div className="p-6 sm:p-8 bg-[#1A1A1D] border-[3px] border-[#3A3A3E] shadow-[5px_5px_0px_#000000] rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-block px-3 py-0.5 bg-[#F5D90A] text-[#0D0D0F] font-comic text-xs font-black uppercase tracking-wider -rotate-1 shadow-[2px_2px_0px_#8A7400] rounded">
              // SYMPOSIUM BATTLEGROUNDS
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display text-white tracking-tight uppercase">
              WARZONE DIRECTORY
            </h1>
            <p className="text-xs sm:text-sm font-comic text-[#A8A8AC] font-medium">
              9 National-Level Competitions across Technical Breakthroughs & Tactical Non-Tech Mastery
            </p>
          </div>

          {/* Tab Selector Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setActiveTab('ALL');
                audioManager.playNodeEngage();
              }}
              className={`px-4 py-2.5 font-comic text-xs sm:text-sm uppercase tracking-wider font-extrabold transition-all border-[2.5px] rounded-xl cursor-pointer flex items-center gap-2 ${
                activeTab === 'ALL'
                  ? 'bg-[#F5D90A] text-[#0D0D0F] border-[#F5D90A] shadow-[4px_4px_0px_#8A7400]'
                  : 'bg-[#141417] text-[#A8A8AC] hover:text-white border-[#3A3A3E] shadow-[2.5px_2.5px_0px_#000000]'
              }`}
            >
              <span>ALL EVENTS</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-black ${
                activeTab === 'ALL' ? 'bg-[#0D0D0F] text-[#F5D90A]' : 'bg-[#2A2A2E] text-[#F2F2F0]'
              }`}>
                {displayEvents.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('TECH');
                audioManager.playNodeEngage();
              }}
              className={`px-4 py-2.5 font-comic text-xs sm:text-sm uppercase tracking-wider font-extrabold transition-all border-[2.5px] rounded-xl cursor-pointer flex items-center gap-2 ${
                activeTab === 'TECH'
                  ? 'bg-[#3CE7FF] text-[#0D0D0F] border-[#3CE7FF] shadow-[4px_4px_0px_#1E8FA3] -rotate-1'
                  : 'bg-[#141417] text-[#A8A8AC] hover:text-white border-[#3A3A3E] shadow-[2.5px_2.5px_0px_#000000]'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>TECHNICAL</span>
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
              className={`px-4 py-2.5 font-comic text-xs sm:text-sm uppercase tracking-wider font-extrabold transition-all border-[2.5px] rounded-xl cursor-pointer flex items-center gap-2 ${
                activeTab === 'NON_TECH'
                  ? 'bg-[#FF3366] text-white border-[#FF3366] shadow-[4px_4px_0px_#B01F45] rotate-1'
                  : 'bg-[#141417] text-[#A8A8AC] hover:text-white border-[#3A3A3E] shadow-[2.5px_2.5px_0px_#000000]'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>NON-TECHNICAL</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-black ${
                activeTab === 'NON_TECH' ? 'bg-white text-[#FF3366]' : 'bg-[#2A2A2E] text-[#F2F2F0]'
              }`}>
                {nonTechEvents.length}
              </span>
            </button>
          </div>
        </div>

        {/* SECTION 1: TECHNICAL EVENTS */}
        {(activeTab === 'ALL' || activeTab === 'TECH') && (
          <div className="space-y-5">
            <div className="p-4 bg-gradient-to-r from-cyan-950/80 via-slate-900 to-transparent border-l-4 border-cyan-400 rounded-r-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-950 border border-cyan-500/40 rounded-lg text-cyan-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-display text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-2">
                    <span>TECHNICAL BATTLEGROUNDS</span>
                    <span className="text-xs font-mono font-normal bg-cyan-900/60 text-cyan-200 px-2 py-0.5 rounded border border-cyan-500/30">
                      {techEvents.length} Missions
                    </span>
                  </h2>
                  <p className="text-xs font-comic text-slate-400">
                    Debugging, Neural AI, SQL Extraction, UI/UX, and Algorithmic Survival Marathons.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {techEvents.map((e) => renderEventCard(e))}
            </div>
          </div>
        )}

        {/* SECTION 2: NON-TECHNICAL EVENTS */}
        {(activeTab === 'ALL' || activeTab === 'NON_TECH') && (
          <div className="space-y-5 pt-4">
            <div className="p-4 bg-gradient-to-r from-rose-950/80 via-slate-900 to-transparent border-l-4 border-rose-500 rounded-r-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-950 border border-rose-500/40 rounded-lg text-rose-400">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-display text-rose-300 font-bold uppercase tracking-wider flex items-center gap-2">
                    <span>NON-TECHNICAL BATTLEGROUNDS</span>
                    <span className="text-xs font-mono font-normal bg-rose-900/60 text-rose-200 px-2 py-0.5 rounded border border-rose-500/30">
                      {nonTechEvents.length} Missions
                    </span>
                  </h2>
                  <p className="text-xs font-comic text-slate-400">
                    Campus Borderland Mystery, Buzzer Quizzes, Narrative Twists, and Cinematic Screenings.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nonTechEvents.map((e) => renderEventCard(e))}
            </div>
          </div>
        )}

        {/* Dedicated Cyberpunk Mission Schedule Timetable Section */}
        <div className="pt-8 border-t-2 border-[#3A3A3E]">
          <EventScheduleView onSelectEvent={(e) => setSelectedEvent(e)} />
        </div>
      </div>

      {/* Event Details Interactive Modal */}
      {selectedEvent && (
        <div
          onClick={() => setSelectedEvent(null)}
          className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-[96%] sm:w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-[#141417] border-[2.5px] sm:border-[3px] ${
              selectedEvent.id === 'prize-distribution'
                ? 'border-[#9333EA] shadow-[0_0_25px_rgba(147,51,234,0.35)]'
                : selectedEvent.event_type === 'TECH'
                ? 'border-[#3CE7FF] shadow-[4px_4px_0px_#000000]'
                : 'border-[#FF3366] shadow-[4px_4px_0px_#000000]'
            } sm:shadow-[8px_8px_0px_#000000] rounded-2xl select-text mx-auto my-auto overflow-hidden`}
          >
            {/* Sticky Header */}
            <div className="p-3 sm:p-5 border-b border-[#231A36] shrink-0 bg-[#141417] z-10 space-y-1 sm:space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 font-mono font-black text-[10px] sm:text-xs rounded-md uppercase flex items-center gap-1 ${
                        selectedEvent.id === 'prize-distribution'
                          ? 'bg-[#A855F7] text-white'
                          : selectedEvent.event_type === 'TECH'
                          ? 'bg-[#3CE7FF] text-[#0D0D0F]'
                          : 'bg-[#FF3366] text-white'
                      }`}
                    >
                      {selectedEvent.id === 'prize-distribution' && <Zap className="w-3.5 h-3.5 fill-current" />}
                      <span>{selectedEvent.code}</span>
                    </span>
                    <span className="font-mono text-[10px] sm:text-xs text-[#8E8A99] uppercase tracking-wider font-bold">
                      {selectedEvent.category}
                    </span>
                  </div>
                  <h3 className="font-display text-lg sm:text-3xl text-white uppercase tracking-wide leading-tight pt-0.5">
                    {selectedEvent.mission_name}
                  </h3>
                  <p
                    className={`font-comic text-[11px] sm:text-sm font-bold tracking-wider ${
                      selectedEvent.id === 'prize-distribution'
                        ? 'text-[#C084FC]'
                        : selectedEvent.event_type === 'TECH'
                        ? 'text-[#3CE7FF]'
                        : 'text-[#FF3366]'
                    }`}
                  >
                    {selectedEvent.tagline || selectedEvent.title}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1.5 sm:p-2 bg-[#1C1629] hover:bg-[#A855F7] text-[#A8A8AC] hover:text-white rounded-full transition-colors cursor-pointer shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Briefing Text directly under header rule */}
              <p className="font-mono text-[10px] sm:text-xs text-[#B0ACBC] uppercase leading-relaxed tracking-tight pt-0.5">
                {selectedEvent.description}
              </p>
            </div>

            {/* Scrollable Modal Content */}
            <div className="p-3 sm:p-5 overflow-y-auto space-y-3 sm:space-y-4 flex-1 custom-scrollbar">
              {/* Quick Meta Stats */}
              {selectedEvent.id === 'prize-distribution' ? (
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 sm:p-3 bg-[#130E22] border border-[#2B1E48] rounded-xl flex items-center gap-2">
                    <div className="p-1.5 bg-[#261E0A] border border-[#F5D90A]/30 rounded-lg text-[#F5D90A] shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[#8E8A99] text-[9px] uppercase font-bold tracking-wider">TIME</div>
                      <div className="text-white font-bold text-[10px] sm:text-xs truncate">03:00 PM – 04:00 PM</div>
                    </div>
                  </div>
                  <div className="p-2 sm:p-3 bg-[#130E22] border border-[#2B1E48] rounded-xl flex items-center gap-2">
                    <div className="p-1.5 bg-[#0A2228] border border-[#3CE7FF]/30 rounded-lg text-[#3CE7FF] shrink-0">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[#8E8A99] text-[9px] uppercase font-bold tracking-wider">VENUE</div>
                      <div className="text-white font-bold text-[10px] sm:text-xs truncate">Main Auditorium</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5 text-[10px] sm:text-xs font-mono">
                  <div className="p-1.5 sm:p-2 bg-[#1A1A1E] border border-[#2E2E33] rounded-lg">
                    <div className="text-[#A8A8AC] text-[9px] sm:text-[10px] flex items-center gap-1">
                      <Users className="w-3 h-3 text-[#F5D90A] shrink-0" /> <span className="truncate">TEAM SIZE</span>
                    </div>
                    <div className="text-white font-bold mt-0.5 text-[10px] sm:text-xs truncate">
                      {selectedEvent.team_size_min}{selectedEvent.team_size_min !== selectedEvent.team_size_max ? `-${selectedEvent.team_size_max}` : ''} M
                    </div>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-[#1A1A1E] border border-[#2E2E33] rounded-lg">
                    <div className="text-[#A8A8AC] text-[9px] sm:text-[10px] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#F5D90A] shrink-0" /> <span className="truncate">TIME</span>
                    </div>
                    <div className="text-white font-bold mt-0.5 text-[10px] sm:text-xs truncate">
                      {selectedEvent.schedule_time}
                    </div>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-[#1A1A1E] border border-[#2E2E33] rounded-lg">
                    <div className="text-[#A8A8AC] text-[9px] sm:text-[10px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#3CE7FF] shrink-0" /> <span className="truncate">VENUE</span>
                    </div>
                    <div className="text-white font-bold mt-0.5 text-[10px] sm:text-xs truncate">
                      {selectedEvent.venue}
                    </div>
                  </div>
                </div>
              )}

              {/* PROGRAM (Only for Prize Distribution) */}
              {selectedEvent.id === 'prize-distribution' && (
                <div className="space-y-1.5">
                  <h4 className="font-mono text-[10px] sm:text-xs text-[#C084FC] uppercase tracking-wider font-bold">
                    // PROGRAM
                  </h4>
                  <div className="p-2.5 sm:p-4 bg-[#130E22] border border-[#2B1E48] rounded-xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 font-mono text-[10px] sm:text-xs text-[#D8D5E3]">
                      <div className="space-y-1 sm:space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[#C084FC] font-bold">•</span>
                          <span>Welcome &amp; Opening</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#C084FC] font-bold">•</span>
                          <span>Winner Recognition</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#C084FC] font-bold">•</span>
                          <span>Certificate Distribution</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#C084FC] font-bold">•</span>
                          <span>Trophy &amp; Shield Presentation</span>
                        </div>
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[#C084FC] font-bold">•</span>
                          <span>Cash Prize Distribution</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#C084FC] font-bold">•</span>
                          <span>Valedictory Address</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#C084FC] font-bold">•</span>
                          <span>Closing Ceremony</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Prize Rewards */}
              {selectedEvent.prizes && (
                <div className="space-y-1 sm:space-y-1.5">
                  <h4 className="font-mono text-[10px] sm:text-xs text-[#C084FC] uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-[#C084FC]" /> PRIZE REWARDS
                  </h4>
                  <div className={`grid grid-cols-3 gap-1.5 sm:gap-3 text-xs`}>
                    {/* 1st Prize Card */}
                    <div className="p-1.5 sm:p-3 bg-[#151026] rounded-xl border border-[#F5D90A]/80 flex flex-col sm:flex-row items-center text-center sm:text-left gap-1 sm:gap-3">
                      <Trophy className="w-4 h-4 sm:w-6 sm:h-6 text-[#F5D90A] shrink-0" />
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-[8px] sm:text-[10px] font-mono font-black text-[#F5D90A] tracking-widest uppercase">
                          1ST PRIZE
                        </div>
                        <div className="text-white font-display font-extrabold text-[10px] sm:text-base tracking-wide truncate">
                          {selectedEvent.prizes.first}
                        </div>
                      </div>
                    </div>

                    {/* 2nd Prize Card */}
                    <div className="p-1.5 sm:p-3 bg-[#151026] rounded-xl border border-[#3CE7FF]/80 flex flex-col sm:flex-row items-center text-center sm:text-left gap-1 sm:gap-3">
                      <ShieldCheck className="w-4 h-4 sm:w-6 sm:h-6 text-[#3CE7FF] shrink-0" />
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-[8px] sm:text-[10px] font-mono font-black text-[#3CE7FF] tracking-widest uppercase">
                          2ND PRIZE
                        </div>
                        <div className="text-white font-display font-extrabold text-[10px] sm:text-base tracking-wide truncate">
                          {selectedEvent.prizes.second}
                        </div>
                      </div>
                    </div>

                    {/* 3rd Prize Card */}
                    {selectedEvent.id !== 'prize-distribution' && (
                      <div className="p-1.5 sm:p-3 bg-[#151026] rounded-xl border border-[#FF3366]/80 flex flex-col sm:flex-row items-center text-center sm:text-left gap-1 sm:gap-3">
                        <Trophy className="w-4 h-4 sm:w-6 sm:h-6 text-[#FF3366] shrink-0" />
                        <div className="space-y-0.5 min-w-0">
                          <div className="text-[8px] sm:text-[10px] font-mono font-black text-[#FF3366] tracking-widest uppercase">
                            3RD PRIZE
                          </div>
                          <div className="text-white font-display font-extrabold text-[10px] sm:text-base tracking-wide truncate">
                            {selectedEvent.prizes.third || 'Certificate'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rules / Important */}
              {selectedEvent.id === 'prize-distribution' ? (
                <div className="space-y-1.5">
                  <h4 className="font-mono text-[10px] sm:text-xs text-[#C084FC] uppercase tracking-wider font-bold">
                    // IMPORTANT
                  </h4>
                  <div className="p-2.5 sm:p-3 bg-[#140F24] border border-purple-900/40 rounded-xl">
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 font-comic text-[10px] sm:text-xs text-[#D0D0D4]">
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#C084FC] shrink-0 font-bold">•</span>
                        <span>All winners must assemble at Main Auditorium before ceremony.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#C084FC] shrink-0 font-bold">•</span>
                        <span>Prizes awarded according to official results.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#C084FC] shrink-0 font-bold">•</span>
                        <span>Winners must be present to receive prizes.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#C084FC] shrink-0 font-bold">•</span>
                        <span>Maintain discipline throughout ceremony.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                selectedEvent.rules && selectedEvent.rules.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="font-mono text-[10px] sm:text-[11px] text-[#F5D90A] uppercase tracking-wider font-bold">
                      // RULES &amp; GUIDELINES
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-0.5">
                      {selectedEvent.rules.map((rule, rIdx) => (
                        <li key={rIdx} className="flex items-start gap-1 text-[10px] sm:text-[11px] font-comic text-[#C0C0C5] leading-tight">
                          <span className="text-[#C084FC] shrink-0 font-bold">•</span>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              )}

              {/* Helpline & Coordinators */}
              {selectedEvent.coordinators && selectedEvent.coordinators.length > 0 && (
                <div className="space-y-1 sm:space-y-1.5">
                  <h4 className="font-mono text-[10px] sm:text-xs text-[#A8A8AC] uppercase tracking-wider font-bold">
                    // HELPLINE &amp; COORDINATORS
                  </h4>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {selectedEvent.coordinators.map((c, cIdx) => (
                      <div key={cIdx} className="text-[10px] sm:text-xs font-mono text-[#D0D0D4] flex items-center gap-1 bg-[#1A1A1E] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded border border-[#2E2E33]">
                        <span>{c.name} ({c.role}):</span>
                        {c.phone && (
                          <a href={`tel:${c.phone}`} className="text-[#3CE7FF] hover:underline font-bold">
                            {c.phone}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Register CTA Button at the end of modal (Excluding Prize Distribution) */}
              {selectedEvent.id !== 'prize-distribution' && (
                <div className="pt-3 pb-1 border-t border-[#2A2A2E]">
                  <button
                    onClick={() => {
                      navigate(`/register?mission=${selectedEvent.id}`);
                    }}
                    className={`w-full py-3 sm:py-3.5 font-display text-xs sm:text-base tracking-wider uppercase font-bold cursor-pointer transition-all border-[2px] shadow-[4px_4px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2 rounded-xl ${
                      selectedEvent.event_type === 'TECH'
                        ? 'bg-[#3CE7FF] hover:bg-[#F5D90A] text-[#0D0D0F] border-[#3CE7FF]'
                        : 'bg-[#FF3366] hover:bg-[#F5D90A] text-white hover:text-[#0D0D0F] border-[#FF3366]'
                    }`}
                  >
                    <span>REGISTER FOR {selectedEvent.mission_name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebsiteEventsPage;
