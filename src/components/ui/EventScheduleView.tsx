import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, MapPin, Trophy, X, ArrowRight, Zap, Shield, Sparkles, Award, Cpu, Gamepad2, Layers } from 'lucide-react';
import { EventMission } from '../../types';
import { store } from '../../services/store';

// Helper to trigger comic FX audio if available
const triggerAudio = () => {
  try {
    const audio = new Audio('/pop.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch {}
};

export interface TimelineFlowItem {
  id: string;
  code: string;
  mission_name: string;
  time_display: string;
  start_time: string; // e.g. "11:00 AM"
  duration: string;
  category_type: 'TECH' | 'NON_TECH' | 'SPECIAL';
  color_theme: 'cyan' | 'pink' | 'gold' | 'purple';
  single_badge?: boolean;
  venue: string;
  tagline: string;
  description: string;
}

export const EventScheduleView: React.FC<{
  onSelectEvent?: (event: EventMission) => void;
}> = ({ onSelectEvent }) => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'TECH' | 'NON_TECH'>('ALL');
  const [selectedEventModal, setSelectedEventModal] = useState<EventMission | null>(null);

  // Fetch official events from store
  const allEvents = store.getEvents();

  const getEventFromStore = (id: string): EventMission | undefined => {
    return allEvents.find((e) => e.id === id);
  };

  useEffect(() => {
    if (selectedEventModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedEventModal]);

  const handleCardClick = (item: TimelineFlowItem) => {
    triggerAudio();
    const matched = getEventFromStore(item.id);
    if (matched) {
      if (onSelectEvent) {
        onSelectEvent(matched);
      } else {
        setSelectedEventModal(matched);
      }
    } else {
      // Fallback pseudo-mission for Prize Distribution
      const prizeObj: EventMission = {
        id: item.id,
        code: 'FINALE',
        mission_name: 'PRIZE DISTRIBUTION',
        title: 'PRIZE DISTRIBUTION',
        tagline: 'HONOR. VICTORY. CELEBRATION.',
        event_type: 'NON_TECH',
        category: 'VALEDICTORY',
        clearance_level: 'SPECIAL',
        team_size_min: 0,
        team_size_max: 0,
        schedule_time: '03:00 PM – 04:00 PM',
        duration: '1 hr',
        venue: 'Main Auditorium',
        description: 'Celebrate the winners of ZINNIA \'26 with the presentation of trophies, shields, certificates, and cash prizes, marking the grand conclusion of the symposium.',
        rules: [
          'All winners must assemble at the Main Auditorium.',
          'Winners must be present to receive their prizes.',
          'Prizes will be awarded according to the official results.',
          'Maintain discipline throughout the ceremony.'
        ],
        prizes: { first: '₹30,000+ Cash Prize', second: 'Merit Shield', third: 'Trophy' },
        coordinators: [{ name: 'Symposium Directorate', role: 'Directorate' }],
        status: 'AVAILABLE',
        icon_name: 'trophy'
      };
      if (onSelectEvent) {
        onSelectEvent(prizeObj);
      } else {
        setSelectedEventModal(prizeObj);
      }
    }
  };

  // Master Chronological Timeline Flow Array
  const masterTimelineItems: TimelineFlowItem[] = [
    {
      id: 'debugging',
      code: '01',
      mission_name: 'DEBUGGING',
      start_time: '11:00 AM',
      time_display: '11:00 AM – 12:30 PM',
      duration: '1 hr 30 mins',
      category_type: 'TECH',
      color_theme: 'cyan',
      venue: 'Auditorium 1st floor',
      tagline: 'Find. Fix. Conquer.',
      description: 'Find bugs, identify system failures, fix faulty code, and restore programs to working condition.'
    },
    {
      id: 'the-last-signal',
      code: '02',
      mission_name: 'THE LAST SIGNAL',
      start_time: '11:00 AM',
      time_display: '11:00 AM – 12:30 PM',
      duration: '1 hr 30 mins',
      category_type: 'TECH',
      color_theme: 'cyan',
      venue: '104 class room',
      tagline: 'Decode. Transmit. Survive.',
      description: 'Intercept, decrypt, and decode corrupted signal packets through cryptographic puzzles.'
    },
    {
      id: 'gadget-codes',
      code: '04',
      mission_name: 'GADGET CODES',
      start_time: '11:00 AM',
      time_display: '11:00 AM – 02:30 PM',
      duration: '3 hrs 30 mins',
      category_type: 'TECH',
      color_theme: 'cyan',
      single_badge: true,
      venue: 'CC1 lab',
      tagline: 'Program. Wire. Automate.',
      description: 'Technical quiz, 30-sec team code swaps, and QR passcode fragments puzzle hunt.'
    },
    {
      id: 'paper-presentation',
      code: '05',
      mission_name: 'PAPER PRESENTATION',
      start_time: '11:00 AM',
      time_display: '11:00 AM – 03:00 PM',
      duration: '4 hrs',
      category_type: 'TECH',
      color_theme: 'cyan',
      venue: 'IT & CSE Seminar Hall',
      tagline: 'Ideas that speak. Impact that lasts.',
      description: 'Present original research manuscripts, architectural discoveries, and innovative engineering paradigms.'
    },
    {
      id: 'borderland-at-gcee',
      code: '06',
      mission_name: 'BORDERLAND @ GCEE',
      start_time: '12:00 PM',
      time_display: '12:00 PM – 03:00 PM',
      duration: '3 hrs',
      category_type: 'NON_TECH',
      color_theme: 'pink',
      venue: '101, 102 class room',
      tagline: 'Survive. Strategize. Dominate.',
      description: 'Survive strategic mini-games in Round 1 to extend your visa for the Borderland Hunt.'
    },
    {
      id: 'think-strike-and-win',
      code: '07',
      mission_name: 'THINK, STRIKE AND WIN',
      start_time: '12:00 PM',
      time_display: '12:00 PM – 02:30 PM',
      duration: '2 hrs 30 mins',
      category_type: 'NON_TECH',
      color_theme: 'pink',
      venue: '103 class room',
      tagline: 'Think fast. Strike sharp. Win all.',
      description: 'Solve logical MCQs, picture connection links, and mystery answer deduction clues.'
    },
    {
      id: 'lost-at-sql',
      code: '03',
      mission_name: 'LOST AT SQL',
      start_time: '01:30 PM',
      time_display: '01:30 PM – 03:00 PM',
      duration: '1 hr 30 mins',
      category_type: 'TECH',
      color_theme: 'cyan',
      venue: 'CC2 lab',
      tagline: 'Query. Navigate. Extract.',
      description: 'Investigate Black Cipher\'s disappearance. Query databases and extract hidden evidence.'
    },
    {
      id: 'plot-twist',
      code: '08',
      mission_name: 'PLOT TWIST',
      start_time: '01:30 PM',
      time_display: '01:30 PM – 03:00 PM',
      duration: '1 hr 30 mins',
      category_type: 'NON_TECH',
      color_theme: 'pink',
      venue: '103 class room',
      tagline: 'Expect the unexpected.',
      description: 'Analyze complex mystery stories, unlock puzzle hints, and reach the deduction finale.'
    },
    {
      id: 'short-flim',
      code: '09',
      mission_name: 'SHORT FILM',
      start_time: '01:30 PM',
      time_display: '01:30 PM – 02:30 PM',
      duration: '1 hr',
      category_type: 'NON_TECH',
      color_theme: 'pink',
      venue: 'Main Stage',
      tagline: 'Freeze moments. Frame stories.',
      description: 'Create an original short film inspired by time, perspective, and self-doubt. Tell a meaningful story through visuals, characters, and emotions while keeping the narrative clear and engaging.'
    },
    {
      id: 'prize-distribution',
      code: 'FINALE',
      mission_name: 'PRIZE DISTRIBUTION',
      start_time: '03:00 PM',
      time_display: '03:00 PM – 04:00 PM',
      duration: '1 hr',
      category_type: 'SPECIAL',
      color_theme: 'purple',
      venue: 'Main Auditorium',
      tagline: 'HONOR. VICTORY. CELEBRATION.',
      description: 'Celebrate the winners of ZINNIA \'26 with the presentation of trophies, shields, certificates, and cash prizes, marking the grand conclusion of the symposium.'
    }
  ];

  // Filter items based on active Tab
  const filteredTimeline = masterTimelineItems.filter((item) => {
    if (activeFilter === 'TECH') return item.category_type === 'TECH' || item.category_type === 'SPECIAL';
    if (activeFilter === 'NON_TECH') return item.category_type === 'NON_TECH' || item.category_type === 'SPECIAL';
    return true;
  });

  const getThemeStyles = (theme: 'cyan' | 'pink' | 'gold' | 'purple') => {
    switch (theme) {
      case 'cyan':
        return {
          border: 'border-[#3CE7FF]',
          badgeBg: 'bg-[#3CE7FF] text-[#0D0D0F]',
          text: 'text-[#3CE7FF]',
          glow: 'shadow-[0_0_15px_rgba(60,231,255,0.25)] hover:shadow-[0_0_22px_rgba(60,231,255,0.45)]',
          cardBg: 'bg-[#122D38]/90 hover:bg-[#163B4A]',
          nodeColor: 'bg-[#3CE7FF]',
          lineColor: 'from-[#3CE7FF]',
          accentBorder: 'border-l-4 border-l-[#3CE7FF]',
        };
      case 'pink':
        return {
          border: 'border-[#FF3366]',
          badgeBg: 'bg-[#FF3366] text-white',
          text: 'text-[#FF3366]',
          glow: 'shadow-[0_0_15px_rgba(255,51,102,0.25)] hover:shadow-[0_0_22px_rgba(255,51,102,0.45)]',
          cardBg: 'bg-[#2A121D]/90 hover:bg-[#381827]',
          nodeColor: 'bg-[#FF3366]',
          lineColor: 'from-[#FF3366]',
          accentBorder: 'border-l-4 border-l-[#FF3366]',
        };
      case 'gold':
        return {
          border: 'border-[#F5D90A]',
          badgeBg: 'bg-[#F5D90A] text-[#0D0D0F]',
          text: 'text-[#F5D90A]',
          glow: 'shadow-[0_0_15px_rgba(245,217,10,0.25)] hover:shadow-[0_0_22px_rgba(245,217,10,0.45)]',
          cardBg: 'bg-[#2D2812]/90 hover:bg-[#3B3417]',
          nodeColor: 'bg-[#F5D90A]',
          lineColor: 'from-[#F5D90A]',
          accentBorder: 'border-l-4 border-l-[#F5D90A]',
        };
      case 'purple':
        return {
          border: 'border-[#9333EA]',
          badgeBg: 'bg-[#9333EA] text-white',
          text: 'text-[#C084FC]',
          glow: 'shadow-[0_0_15px_rgba(147,51,234,0.35)] hover:shadow-[0_0_22px_rgba(192,132,252,0.55)]',
          cardBg: 'bg-[#23123B]/90 hover:bg-[#2F184F]',
          nodeColor: 'bg-[#C084FC]',
          lineColor: 'from-[#C084FC]',
          accentBorder: 'border-l-4 border-l-[#C084FC]',
        };
    }
  };

  return (
    <section className="relative w-full py-10 px-3 sm:px-6 max-w-7xl mx-auto space-y-10 select-none">
      {/* =========================================================================
          SECTION HEADER
          ========================================================================= */}
      <div className="text-center space-y-3 relative z-10">
        {/* Top Circuit Banner */}
        <div className="flex items-center justify-center gap-3">
          <div className="h-[2px] w-12 sm:w-24 bg-gradient-to-r from-transparent via-[#3CE7FF] to-transparent" />
          <div className="w-2 h-2 rounded-full bg-[#3CE7FF] animate-pulse" />
          <span className="font-mono text-xs text-[#3CE7FF] tracking-widest uppercase font-bold px-3 py-1 bg-[#122D38] rounded-full border border-[#3CE7FF]/40">
            MASTER TIMELINE FLOW
          </span>
          <div className="w-2 h-2 rounded-full bg-[#FF3366] animate-pulse" />
          <div className="h-[2px] w-12 sm:w-24 bg-gradient-to-r from-transparent via-[#FF3366] to-transparent" />
        </div>

        {/* Large Title */}
        <h2 className="font-display text-3xl sm:text-5xl md:text-6xl text-white tracking-wider uppercase flex items-center justify-center gap-2 sm:gap-4 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
          <span className="text-[#F5D90A]">⚡</span>
          <span>EVENT SCHEDULE</span>
          <span className="text-[#F5D90A]">⚡</span>
        </h2>

        {/* Subtitle */}
        <p className="font-comic text-sm sm:text-base md:text-lg text-[#F5D90A] tracking-wide font-bold">
          "One Day. Nine Events. One Unforgettable Symposium."
        </p>

        {/* Timeline Flow Filter Tabs */}
        <div className="flex items-center justify-center gap-2 pt-3 flex-wrap">
          <button
            onClick={() => {
              triggerAudio();
              setActiveFilter('ALL');
            }}
            className={`px-4 py-2 font-comic text-xs sm:text-sm uppercase font-black rounded-xl border-[2px] transition-all cursor-pointer flex items-center gap-2 ${
              activeFilter === 'ALL'
                ? 'bg-[#F5D90A] text-[#0D0D0F] border-[#F5D90A] shadow-[3px_3px_0px_#8A7400]'
                : 'bg-[#141417] text-[#A8A8AC] hover:text-white border-[#3A3A3E]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>ALL EVENTS FLOW</span>
            <span className="px-1.5 py-0.2 bg-[#0D0D0F] text-[#F5D90A] font-mono text-[10px] rounded font-black">
              10
            </span>
          </button>

          <button
            onClick={() => {
              triggerAudio();
              setActiveFilter('TECH');
            }}
            className={`px-4 py-2 font-comic text-xs sm:text-sm uppercase font-black rounded-xl border-[2px] transition-all cursor-pointer flex items-center gap-2 ${
              activeFilter === 'TECH'
                ? 'bg-[#3CE7FF] text-[#0D0D0F] border-[#3CE7FF] shadow-[3px_3px_0px_#1E8FA3]'
                : 'bg-[#141417] text-[#A8A8AC] hover:text-white border-[#3A3A3E]'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>TECHNICAL FLOW</span>
            <span className="px-1.5 py-0.2 bg-[#0D0D0F] text-[#3CE7FF] font-mono text-[10px] rounded font-black">
              5
            </span>
          </button>

          <button
            onClick={() => {
              triggerAudio();
              setActiveFilter('NON_TECH');
            }}
            className={`px-4 py-2 font-comic text-xs sm:text-sm uppercase font-black rounded-xl border-[2px] transition-all cursor-pointer flex items-center gap-2 ${
              activeFilter === 'NON_TECH'
                ? 'bg-[#FF3366] text-white border-[#FF3366] shadow-[3px_3px_0px_#B01F45]'
                : 'bg-[#141417] text-[#A8A8AC] hover:text-white border-[#3A3A3E]'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>NON-TECH FLOW</span>
            <span className="px-1.5 py-0.2 bg-[#0D0D0F] text-[#FF3366] font-mono text-[10px] rounded font-black">
              5
            </span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SEQUENTIAL TIMELINE FLOW SPINE CONTAINER
          ========================================================================= */}
      <div className="relative pt-4 pb-8 max-w-5xl mx-auto">
        {/* Glowing Central/Left Vertical Laser Track */}
        <div className="absolute left-4 sm:left-1/2 top-4 bottom-4 w-[3px] -translate-x-1/2 bg-gradient-to-b from-[#3CE7FF] via-[#FF3366] to-[#F5D90A] shadow-[0_0_12px_#3CE7FF] rounded-full z-0 pointer-events-none" />

        {/* Timeline Items List */}
        <div className="space-y-8 relative z-10">
          {filteredTimeline.map((item, index) => {
            const styles = getThemeStyles(item.color_theme);
            const isEven = index % 2 === 0;

            return (
              <div
                key={item.id}
                className="relative flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-8 group"
              >
                {/* Glowing Circuit Node Marker on Central Spine */}
                <div className="absolute left-4 sm:left-1/2 top-6 -translate-x-1/2 z-20 flex items-center justify-center">
                  <div className={`w-5 h-5 rounded-full ${styles.nodeColor} border-3 border-[#0D0D0F] shadow-[0_0_14px_currentColor] animate-pulse`} />
                  <div className={`absolute w-8 h-8 rounded-full ${styles.nodeColor} opacity-25 animate-ping pointer-events-none`} />
                </div>

                {/* Left Column (Even index items on Desktop) */}
                <div className={`w-full sm:w-[calc(50%-2rem)] pl-10 sm:pl-0 ${isEven ? 'sm:text-right' : 'sm:order-2 sm:text-left'}`}>
                  <div
                    onClick={() => handleCardClick(item)}
                    className={`p-4 sm:p-5 rounded-2xl border-2 ${styles.border} ${styles.cardBg} ${styles.glow} shadow-[5px_5px_0px_#000000] cursor-pointer transition-all duration-300 hover:-translate-y-1 relative group-hover:border-white`}
                  >
                    {/* Header Row: Badge & Code */}
                    <div className={`flex items-center gap-2 ${isEven ? 'sm:justify-end' : 'sm:justify-start'}`}>
                      <span className={`px-2.5 py-0.5 font-mono text-xs font-black rounded uppercase ${styles.badgeBg}`}>
                        MISSION {item.code}
                      </span>

                      {item.single_badge && (
                        <span className="px-2 py-0.5 bg-[#F5D90A] text-[#0D0D0F] font-mono font-black text-[10px] rounded uppercase shrink-0">
                          SINGLE EVENT
                        </span>
                      )}

                      <span className="font-mono text-[10px] text-[#A8A8AC] uppercase font-bold tracking-wider">
                        {item.category_type === 'TECH' ? 'TECHNICAL' : item.category_type === 'NON_TECH' ? 'NON-TECHNICAL' : 'VALEDICTORY'}
                      </span>
                    </div>

                    {/* Mission Name */}
                    <h3 className="font-display text-lg sm:text-xl text-white uppercase tracking-wide mt-1.5">
                      {item.mission_name}
                    </h3>

                    {/* Tagline */}
                    <p className={`font-comic text-xs font-bold mt-0.5 ${styles.text}`}>
                      {item.tagline}
                    </p>

                    {/* Brief Description */}
                    <p className="font-comic text-xs text-[#C0C0C5] mt-2 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Bottom Meta Row: Time & Venue */}
                    <div className={`flex flex-wrap items-center gap-3 text-xs font-mono text-[#A8A8AC] pt-3 mt-3 border-t border-white/10 ${isEven ? 'sm:justify-end' : 'sm:justify-start'}`}>
                      <div className="flex items-center gap-1 text-white font-bold bg-[#141417] px-2.5 py-1 rounded-lg border border-[#2E2E33]">
                        <Clock className="w-3.5 h-3.5 text-[#F5D90A]" />
                        <span>{item.time_display}</span>
                      </div>

                      <div className="flex items-center gap-1 text-[#D0D0D4] bg-[#141417] px-2.5 py-1 rounded-lg border border-[#2E2E33]">
                        <MapPin className="w-3.5 h-3.5 text-[#3CE7FF]" />
                        <span>{item.venue}</span>
                      </div>
                    </div>

                    {/* Click CTA Indicator */}
                    <div className={`text-[10px] font-mono ${styles.text} font-bold mt-2.5 flex items-center gap-1 opacity-80 group-hover:opacity-100 ${isEven ? 'sm:justify-end' : 'sm:justify-start'}`}>
                      <span>CLICK TO OPEN RULES & DETAILS</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>

                {/* Right Column (Time Callout Pill on opposite side on Desktop) */}
                <div className={`hidden sm:flex w-[calc(50%-2rem)] items-center ${isEven ? 'justify-start order-2' : 'justify-end order-1'}`}>
                  <div className="px-4 py-2 bg-[#141417] border border-[#2E2E33] rounded-xl shadow-[3px_3px_0px_#000000] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#F5D90A]" />
                    <span className="font-mono text-sm text-white font-bold tracking-wider">
                      {item.start_time}
                    </span>
                    <span className="text-[10px] font-mono text-[#A8A8AC] bg-[#222226] px-2 py-0.5 rounded">
                      {item.duration}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          EVENT DETAILS INTERACTIVE MODAL (IF CLICKED IN TIMELINE FLOW)
          ========================================================================= */}
      {selectedEventModal && (
        <div
          onClick={() => setSelectedEventModal(null)}
          className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-2xl max-h-[85vh] sm:max-h-[88vh] overflow-y-auto overscroll-contain bg-[#141417] border-[3px] ${
              selectedEventModal.id === 'prize-distribution'
                ? 'border-[#9333EA]'
                : selectedEventModal.event_type === 'TECH'
                ? 'border-[#3CE7FF]'
                : 'border-[#FF3366]'
            } shadow-[8px_8px_0px_#000000] p-4 sm:p-5 rounded-2xl space-y-3 select-text my-auto`}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[#2A2A2E] pb-2.5">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 font-mono font-black text-[11px] rounded uppercase ${
                    selectedEventModal.id === 'prize-distribution'
                      ? 'bg-[#9333EA] text-white'
                      : selectedEventModal.event_type === 'TECH'
                      ? 'bg-[#3CE7FF] text-[#0D0D0F]'
                      : 'bg-[#FF3366] text-white'
                  }`}>
                    {selectedEventModal.code}
                  </span>
                  <span className="font-mono text-[11px] text-[#A8A8AC] uppercase">
                    {selectedEventModal.category}
                  </span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl text-white uppercase tracking-wide">
                  {selectedEventModal.mission_name}
                </h3>
                <p className={`font-comic text-xs font-bold ${
                  selectedEventModal.id === 'prize-distribution'
                    ? 'text-[#C084FC]'
                    : selectedEventModal.event_type === 'TECH'
                    ? 'text-[#3CE7FF]'
                    : 'text-[#FF3366]'
                }`}>
                  {selectedEventModal.tagline || selectedEventModal.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedEventModal(null)}
                className="p-1 bg-[#222226] hover:bg-[#FF3366] text-[#F2F2F0] hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Quick Meta Stats (Only 2 wider balanced boxes for Prize Distribution) */}
            {selectedEventModal.id === 'prize-distribution' ? (
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-[#1A1A1E] border border-[#2E2E33] rounded-lg">
                  <div className="text-[#A8A8AC] text-[10px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#F5D90A]" /> TIME
                  </div>
                  <div className="text-white font-bold mt-0.5 text-xs sm:text-sm truncate">
                    03:00 PM – 04:00 PM
                  </div>
                </div>
                <div className="p-2.5 bg-[#1A1A1E] border border-[#2E2E33] rounded-lg">
                  <div className="text-[#A8A8AC] text-[10px] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#C084FC]" /> VENUE
                  </div>
                  <div className="text-white font-bold mt-0.5 text-xs sm:text-sm truncate">
                    Main Auditorium
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs font-mono">
                <div className="p-2 bg-[#1A1A1E] border border-[#2E2E33] rounded-lg">
                  <div className="text-[#A8A8AC] text-[10px] flex items-center gap-1">
                    <Users className="w-3 h-3 text-[#F5D90A]" /> TEAM SIZE
                  </div>
                  <div className="text-white font-bold mt-0.5 text-xs">
                    {selectedEventModal.team_size_min}{selectedEventModal.team_size_min !== selectedEventModal.team_size_max ? ` - ${selectedEventModal.team_size_max}` : ''} Members
                  </div>
                </div>
                <div className="p-2 bg-[#1A1A1E] border border-[#2E2E33] rounded-lg">
                  <div className="text-[#A8A8AC] text-[10px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#F5D90A]" /> TIME
                  </div>
                  <div className="text-white font-bold mt-0.5 text-xs truncate">
                    {selectedEventModal.schedule_time}
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1 p-2 bg-[#1A1A1E] border border-[#2E2E33] rounded-lg">
                  <div className="text-[#A8A8AC] text-[10px] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#3CE7FF]" /> VENUE
                  </div>
                  <div className="text-white font-bold mt-0.5 text-xs truncate">
                    {selectedEventModal.venue || 'TBA'}
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1">
              <h4 className="font-mono text-[11px] text-[#F5D90A] uppercase tracking-wider font-bold">
                // BRIEFING
              </h4>
              <p className="font-comic text-xs text-[#D0D0D4] leading-relaxed">
                {selectedEventModal.description}
              </p>
            </div>

            {/* Rules */}
            {selectedEventModal.rules && selectedEventModal.rules.length > 0 && (
              <div className="space-y-1">
                <h4 className="font-mono text-[11px] text-[#F5D90A] uppercase tracking-wider font-bold">
                  // RULES & GUIDELINES
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5">
                  {selectedEventModal.rules.map((rule, rIdx) => (
                    <li key={rIdx} className="flex items-start gap-1.5 text-[11px] font-comic text-[#C0C0C5] leading-tight">
                      <span className="text-[#C084FC] shrink-0 font-bold">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cash Prizes */}
            {selectedEventModal.prizes && (
              <div className="p-2 sm:p-2.5 bg-[#1A1A1E] border border-[#2E2E33] rounded-xl space-y-1.5">
                <h4 className="font-mono text-[11px] text-[#F5D90A] uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <Trophy className="w-3 h-3 text-[#F5D90A]" /> PRIZE REWARDS
                </h4>
                <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                  <div className="p-1.5 bg-[#222228] rounded border border-[#3A3A40]">
                    <div className="text-[9px] text-[#A8A8AC]">1ST PRIZE</div>
                    <div className="text-[#F5D90A] font-bold text-xs mt-0.5">{selectedEventModal.prizes.first}</div>
                  </div>
                  <div className="p-1.5 bg-[#222228] rounded border border-[#3A3A40]">
                    <div className="text-[9px] text-[#A8A8AC]">2ND PRIZE</div>
                    <div className="text-white font-bold text-xs mt-0.5">{selectedEventModal.prizes.second}</div>
                  </div>
                  <div className="p-1.5 bg-[#222228] rounded border border-[#3A3A40]">
                    <div className="text-[9px] text-[#A8A8AC]">3RD PRIZE</div>
                    <div className="text-[#A8A8AC] font-bold text-xs mt-0.5">{selectedEventModal.prizes.third}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Coordinators */}
            {selectedEventModal.id === 'prize-distribution' ? (
              <div className="space-y-2">
                <h4 className="font-mono text-[10px] text-[#A8A8AC] uppercase tracking-wider font-bold">
                  // EVENT COORDINATORS
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                  {/* OVERALL COORDINATOR */}
                  <div className="p-2.5 bg-[#1A1A1E] border border-[#2E2E33] rounded-lg space-y-1">
                    <div className="text-[10px] text-[#C084FC] uppercase font-bold tracking-wider">
                      OVERALL COORDINATOR
                    </div>
                    <div className="text-[#D0D0D4]">
                      <span>Saran S: </span>
                      <a href="tel:+919629993985" className="text-[#3CE7FF] font-bold hover:underline">
                        +91 96299 93985
                      </a>
                    </div>
                    <div className="text-[#D0D0D4]">
                      <span>Bharani E K: </span>
                      <a href="tel:+918807176399" className="text-[#3CE7FF] font-bold hover:underline">
                        +91 88071 76399
                      </a>
                    </div>
                  </div>

                  {/* TECHNICAL EVENT */}
                  <div className="p-2.5 bg-[#1A1A1E] border border-[#2E2E33] rounded-lg space-y-1">
                    <div className="text-[10px] text-[#3CE7FF] uppercase font-bold tracking-wider">
                      TECHNICAL EVENT
                    </div>
                    <div className="text-[#D0D0D4]">
                      <span>Kishore E: </span>
                      <a href="tel:+918903664244" className="text-[#3CE7FF] font-bold hover:underline">
                        +91 89036 64244
                      </a>
                    </div>
                    <div className="text-[#D0D0D4]">
                      <span>Amisha S: </span>
                      <a href="tel:+919360384877" className="text-[#3CE7FF] font-bold hover:underline">
                        +91 93603 84877
                      </a>
                    </div>
                  </div>

                  {/* NON TECHNICAL EVENT */}
                  <div className="p-2.5 bg-[#1A1A1E] border border-[#2E2E33] rounded-lg space-y-1">
                    <div className="text-[10px] text-[#FF3366] uppercase font-bold tracking-wider">
                      NON TECHNICAL EVENT
                    </div>
                    <div className="text-[#D0D0D4]">
                      <span>Jeo Justin J K: </span>
                      <a href="tel:+919043678257" className="text-[#3CE7FF] font-bold hover:underline">
                        +91 90436 78257
                      </a>
                    </div>
                    <div className="text-[#D0D0D4]">
                      <span>Nandhini S: </span>
                      <a href="tel:+919042736307" className="text-[#3CE7FF] font-bold hover:underline">
                        +91 90427 36307
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              selectedEventModal.coordinators && selectedEventModal.coordinators.length > 0 && (
                <div className="space-y-1">
                  <h4 className="font-mono text-[10px] text-[#A8A8AC] uppercase tracking-wider font-bold">
                    // EVENT COORDINATORS
                  </h4>
                  <div className="flex flex-col items-start gap-1.5">
                    {selectedEventModal.coordinators.map((c, cIdx) => (
                      <div key={cIdx} className="text-[11px] font-mono text-[#D0D0D4] flex items-center gap-1 bg-[#1A1A1E] px-2 py-0.5 rounded border border-[#2E2E33]">
                        <span>{c.name}{c.phone ? ':' : ''}</span>
                        {c.phone && (
                          <a href={`tel:${c.phone}`} className="text-[#3CE7FF] hover:underline font-bold">
                            {c.phone}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {/* Modal Register CTA Button (Hidden for Prize Distribution) */}
            {selectedEventModal.id !== 'prize-distribution' && (
              <div className="pt-1">
                <button
                  onClick={() => {
                    triggerAudio();
                    navigate(`/register?mission=${selectedEventModal.id}`);
                  }}
                  className={`w-full py-2.5 font-display text-xs sm:text-sm tracking-wider uppercase font-bold cursor-pointer transition-all border-[2px] shadow-[3px_3px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2 rounded-xl ${
                    selectedEventModal.event_type === 'TECH'
                      ? 'bg-[#3CE7FF] hover:bg-[#F5D90A] text-[#0D0D0F] border-[#3CE7FF]'
                      : 'bg-[#FF3366] hover:bg-[#F5D90A] text-white hover:text-[#0D0D0F] border-[#FF3366]'
                  }`}
                >
                  <span>REGISTER FOR {selectedEventModal.mission_name}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
