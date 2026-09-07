import React, { useState, useEffect } from 'react';
import { RegistrationPassCard } from '../components/events/RegistrationPassCard';
import { Link, useNavigate } from 'react-router-dom';
import { store } from '../services/store';
import { registerNav } from '../services/registerNavigation';
import { loadSession } from '../lib/participant/api';
import { EventMission } from '../types';
import { WebsiteNavbar } from '../components/layout/Navbar';
import { EventScheduleView } from '../components/ui/EventScheduleView';
import { EventDetailModal } from '../components/events/EventDetailModal';
import { Users, Clock, MapPin, ArrowRight, ArrowLeft, Trophy, Cpu, Gamepad2, Crown } from 'lucide-react';

/**
 * Click blip for the filter tabs.
 *
 * These handlers used to call a bare `audioManager`, which is not defined or
 * imported anywhere in the project — every tab click threw a ReferenceError
 * after the filter had already been applied. This is the same local helper
 * EventScheduleView uses, and it swallows autoplay rejections.
 */
const triggerAudio = () => {
  try {
    const audio = new Audio('/pop.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch {}
};

export const WebsiteEventsPage: React.FC = () => {
  const navigate = useNavigate();

  // Someone already registered does not need the sign-up form again — their
  // event picking happens on the dashboard, which is also the only place that
  // knows what they already hold.
  const signedIn = Boolean(loadSession());
  const goRegister = (missionId: string) =>
    navigate(signedIn ? '/participant/dashboard' : `/register?mission=${missionId}`);
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

  const byDisplayOrder = (a: EventMission, b: EventMission) =>
    (a.display_order ?? 99) - (b.display_order ?? 99);
  // Carved out first so it cannot render twice: a TECH event by category, but
  // it gets its own purple tier rather than a slot in the technical grid.
  const megaEvents = events.filter((e) => e.is_mega).sort(byDisplayOrder);
  const techEvents = events
    .filter((e) => (e.event_type === 'TECH' || e.category === 'TECHNICAL') && !e.is_mega)
    .sort(byDisplayOrder);
  const nonTechEvents = events
    .filter((e) => e.event_type === 'NON_TECH' || e.category === 'NON_TECHNICAL')
    .sort(byDisplayOrder);

  const renderEventCard = (e: EventMission) => {
    const isTech = e.event_type === 'TECH' || e.category === 'TECHNICAL';
    // Three tiers now. Purple is the prize-distribution palette, reused as-is.
    const accentBorder = e.is_mega
      ? 'border-[#9333EA]/70 hover:border-[#C084FC] hover:shadow-[6px_6px_0px_#23123B]'
      : isTech
      ? 'border-[#3CE7FF]/70 hover:border-[#3CE7FF] hover:shadow-[6px_6px_0px_#1E8FA3]'
      : 'border-[#FF3366]/70 hover:border-[#FF3366] hover:shadow-[6px_6px_0px_#B01F45]';
    const badgeBg = e.is_mega
      ? 'bg-[#9333EA] text-white'
      : isTech
      ? 'bg-[#3CE7FF] text-[#0D0D0F]'
      : 'bg-[#FF3366] text-white';

    return (
      <div
        key={e.id}
        onClick={() => setSelectedEvent(e)}
        className={`p-6 bg-[#1A1A1D] border-[3px] ${accentBorder} shadow-[4.5px_4.5px_0px_#000000] transition-all duration-200 hover:-translate-y-1.5 flex flex-col justify-between space-y-4 rounded-xl cursor-pointer ${e.is_mega ? 'mega-card' : ''}`}
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
              {e.is_mega && (
                <Crown className="w-4 h-4 text-[#C084FC]" strokeWidth={2.6} aria-label="Mega event" />
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
            <div className={`font-mono text-xs font-semibold tracking-wide pt-0.5 ${e.is_mega ? 'text-[#C084FC]' : isTech ? 'text-[#3CE7FF]' : 'text-[#FF3366]'}`}>
              {e.tagline || e.title}
            </div>
          </div>

          <p className="font-mono text-xs text-[#A8A8AC] leading-relaxed line-clamp-3 font-normal">
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
                  <div key={rIdx} className="text-[10px] font-mono text-[#D0D0D4] leading-tight flex items-start gap-1.5 font-normal">
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

          <button
            onClick={() => goRegister(e.id)}
            className={`w-full py-2.5 px-3 font-display text-xs tracking-wider uppercase font-bold flex items-center justify-center gap-2 border-[2px] transition-all shadow-[3px_3px_0px_#000000] rounded-lg active:translate-x-0.5 active:translate-y-0.5 cursor-pointer ${
              e.is_mega
                ? 'bg-[#141417] text-[#C084FC] border-[#9333EA] hover:bg-[#9333EA] hover:text-white'
                : isTech
                ? 'bg-[#141417] text-[#3CE7FF] border-[#3CE7FF] hover:bg-[#3CE7FF] hover:text-[#0D0D0F]'
                : 'bg-[#141417] text-[#FF3366] border-[#FF3366] hover:bg-[#FF3366] hover:text-white'
            }`}
          >
            <span>REGISTER FOR {e.code}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
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
            <p className="text-xs sm:text-sm font-mono text-[#A8A8AC]">
              9 National-Level Competitions across Technical Breakthroughs & Tactical Non-Tech Mastery
            </p>
          </div>

          {/* Tab Selector Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setActiveTab('ALL');
                triggerAudio();
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
                {events.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('TECH');
                triggerAudio();
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
                triggerAudio();
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

        {/* Registration pass — priced from configuration, not typed in here */}
        <RegistrationPassCard />

        {/* SECTION 1: MEGA EVENT — the flagship, so it opens the directory.
            The page reads 01 (mega) -> 02-05 (technical) -> 06-09 (non-tech).
            Shown under the TECHNICAL filter too: it is still a technical event
            by category, and hiding it there would make it unfindable. */}
        {(activeTab === 'ALL' || activeTab === 'TECH') && megaEvents.length > 0 && (
          <div className="space-y-5">
            <div className="p-4 bg-gradient-to-r from-[#23123B]/80 via-slate-900 to-transparent border-l-4 border-[#9333EA] rounded-r-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#23123B] border border-[#9333EA]/40 rounded-lg text-[#C084FC]">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-display text-[#C084FC] font-bold uppercase tracking-wider flex items-center gap-2">
                    <span>MEGA EVENT</span>
                    <span className="text-xs font-mono font-normal bg-[#9333EA]/30 text-[#C084FC] px-2 py-0.5 rounded border border-[#9333EA]/40">
                      {megaEvents.length} Mission
                    </span>
                  </h2>
                  <p className="text-xs font-mono text-slate-400">
                    The flagship of the symposium. Its own tier, running all day.
                  </p>
                </div>
              </div>
            </div>

            {/* One card, so it is centred and widened rather than stretched
                across a three-column grid with two empty cells. */}
            <div className="flex justify-center">
              <div className="w-full max-w-2xl">
                {megaEvents.map((e) => renderEventCard(e))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: TECHNICAL EVENTS */}
        {(activeTab === 'ALL' || activeTab === 'TECH') && (
          <div className="space-y-5 pt-4">
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
                  <p className="text-xs font-mono text-slate-400">
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

        {/* SECTION 3: NON-TECHNICAL EVENTS */}
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
                  <p className="text-xs font-mono text-slate-400">
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

      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />

    </div>
  );
};

export default WebsiteEventsPage;
