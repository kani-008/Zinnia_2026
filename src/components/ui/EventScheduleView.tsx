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
          className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-[96%] sm:w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-[#0B0715] border-[2.5px] sm:border-[3px] ${
              selectedEventModal.id === 'prize-distribution'
                ? 'border-[#A855F7]/80 shadow-[0_0_40px_rgba(168,85,247,0.25)]'
                : selectedEventModal.event_type === 'TECH'
                ? 'border-[#3CE7FF] shadow-[4px_4px_0px_#000000]'
                : 'border-[#FF3366] shadow-[4px_4px_0px_#000000]'
            } sm:shadow-[8px_8px_0px_#000000] rounded-2xl select-text mx-auto my-auto overflow-hidden`}
          >
            {/* Sticky Header */}
            <div className="p-3 sm:p-5 border-b border-[#231A36] shrink-0 bg-[#0B0715] z-10 space-y-1 sm:space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 font-mono font-black text-[10px] sm:text-xs rounded-md uppercase flex items-center gap-1 ${
                        selectedEventModal.id === 'prize-distribution'
                          ? 'bg-[#A855F7] text-white'
                          : selectedEventModal.event_type === 'TECH'
                          ? 'bg-[#3CE7FF] text-[#0D0D0F]'
                          : 'bg-[#FF3366] text-white'
                      }`}
                    >
                      {selectedEventModal.id === 'prize-distribution' && <Zap className="w-3.5 h-3.5 fill-current" />}
                      <span>{selectedEventModal.code}</span>
                    </span>
                    <span className="font-mono text-[10px] sm:text-xs text-[#8E8A99] uppercase tracking-wider font-bold">
                      {selectedEventModal.category}
                    </span>
                  </div>
                  <h3 className="font-display text-lg sm:text-3xl text-white uppercase tracking-wide leading-tight pt-0.5">
                    {selectedEventModal.mission_name}
                  </h3>
                  <p
                    className={`font-comic text-[11px] sm:text-sm font-bold tracking-wider ${
                      selectedEventModal.id === 'prize-distribution'
                        ? 'text-[#C084FC]'
                        : selectedEventModal.event_type === 'TECH'
                        ? 'text-[#3CE7FF]'
                        : 'text-[#FF3366]'
                    }`}
                  >
                    {selectedEventModal.tagline || selectedEventModal.title}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEventModal(null)}
                  className="p-1.5 sm:p-2 bg-[#1C1629] hover:bg-[#A855F7] text-[#A8A8AC] hover:text-white rounded-full transition-colors cursor-pointer shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Briefing Text directly under header rule */}
              <p className="font-mono text-[10px] sm:text-xs text-[#B0ACBC] uppercase leading-relaxed tracking-tight pt-0.5">
                {selectedEventModal.description}
              </p>
            </div>

            {/* Scrollable Modal Content */}
            <div className="p-3 sm:p-5 overflow-y-auto space-y-3 sm:space-y-4 flex-1 custom-scrollbar">
              {/* Quick Meta Stats */}
              {selectedEventModal.id === 'prize-distribution' ? (
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
                      {selectedEventModal.team_size_min}{selectedEventModal.team_size_min !== selectedEventModal.team_size_max ? `-${selectedEventModal.team_size_max}` : ''} M
                    </div>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-[#1A1A1E] border border-[#2E2E33] rounded-lg">
                    <div className="text-[#A8A8AC] text-[9px] sm:text-[10px] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#F5D90A] shrink-0" /> <span className="truncate">TIME</span>
                    </div>
                    <div className="text-white font-bold mt-0.5 text-[10px] sm:text-xs truncate">
                      {selectedEventModal.schedule_time}
                    </div>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-[#1A1A1E] border border-[#2E2E33] rounded-lg">
                    <div className="text-[#A8A8AC] text-[9px] sm:text-[10px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#3CE7FF] shrink-0" /> <span className="truncate">VENUE</span>
                    </div>
                    <div className="text-white font-bold mt-0.5 text-[10px] sm:text-xs truncate">
                      {selectedEventModal.venue || 'TBA'}
                    </div>
                  </div>
                </div>
              )}

              {/* PROGRAM (Only for Prize Distribution) */}
              {selectedEventModal.id === 'prize-distribution' && (
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
              {selectedEventModal.prizes && (
                <div className="space-y-1 sm:space-y-1.5">
                  <h4 className="font-mono text-[10px] sm:text-xs text-[#C084FC] uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-[#C084FC]" /> PRIZE REWARDS
                  </h4>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-3 text-xs">
                    {/* 1st Prize Card */}
                    <div className="p-1.5 sm:p-3 bg-[#151026] rounded-xl border border-[#F5D90A]/80 flex flex-col sm:flex-row items-center text-center sm:text-left gap-1 sm:gap-3">
                      <Trophy className="w-4 h-4 sm:w-6 sm:h-6 text-[#F5D90A] shrink-0" />
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-[8px] sm:text-[10px] font-mono font-black text-[#F5D90A] tracking-widest uppercase">
                          1ST PRIZE
                        </div>
                        <div className="text-white font-display font-extrabold text-[10px] sm:text-base tracking-wide truncate">
                          {selectedEventModal.prizes.first}
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
                          {selectedEventModal.prizes.second}
                        </div>
                      </div>
                    </div>

                    {/* 3rd Prize Card */}
                    {selectedEventModal.id !== 'prize-distribution' && (
                      <div className="p-1.5 sm:p-3 bg-[#151026] rounded-xl border border-[#FF3366]/80 flex flex-col sm:flex-row items-center text-center sm:text-left gap-1 sm:gap-3">
                        <Trophy className="w-4 h-4 sm:w-6 sm:h-6 text-[#FF3366] shrink-0" />
                        <div className="space-y-0.5 min-w-0">
                          <div className="text-[8px] sm:text-[10px] font-mono font-black text-[#FF3366] tracking-widest uppercase">
                            3RD PRIZE
                          </div>
                          <div className="text-white font-display font-extrabold text-[10px] sm:text-base tracking-wide truncate">
                            {selectedEventModal.prizes.third || 'Certificate'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rules / Important */}
              {selectedEventModal.id === 'prize-distribution' ? (
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
                selectedEventModal.rules && selectedEventModal.rules.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="font-mono text-[10px] sm:text-[11px] text-[#F5D90A] uppercase tracking-wider font-bold">
                      // RULES &amp; GUIDELINES
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-0.5">
                      {selectedEventModal.rules.map((rule, rIdx) => (
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
              {selectedEventModal.coordinators && selectedEventModal.coordinators.length > 0 && (
                <div className="space-y-1 sm:space-y-1.5">
                  <h4 className="font-mono text-[10px] sm:text-xs text-[#A8A8AC] uppercase tracking-wider font-bold">
                    // HELPLINE &amp; COORDINATORS
                  </h4>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {selectedEventModal.coordinators.map((c, cIdx) => (
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
            </div>

            {/* Sticky CTA Footer */}
            {selectedEventModal.id !== 'prize-distribution' && (
              <div className="p-2.5 sm:p-3.5 bg-[#0B0715] border-t border-[#231A36] shrink-0 z-10">
                <button
                  onClick={() => {
                    triggerAudio();
                    navigate(`/register?mission=${selectedEventModal.id}`);
                  }}
                  className={`w-full py-2.5 sm:py-3.5 font-display text-xs sm:text-base tracking-wider uppercase font-bold cursor-pointer transition-all border-[2px] shadow-[3px_3px_0px_#000000] sm:shadow-[4px_4px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2 rounded-xl ${
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
