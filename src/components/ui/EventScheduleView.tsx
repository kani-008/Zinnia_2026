// Zinnia 2026 — the day's running order.
//
// This used to run on a visual system of its own — rounded-2xl cards, neon
// #3CE7FF/#FF3366/#F5D90A, glow shadows — which read as a different site
// bolted into the middle of the homepage. It now uses the same comic ink as
// everything else: hand-drawn <ComicPanel> frames, the cyan / pink / yellow /
// purple accents, hard offset shadows instead of glows.
//
// The running order below is the coordinators' timetable, transcribed row for
// row. That matters in two places the old version glossed over:
//
//   - Events with rounds appear ONCE PER BAND, not as one long block. Gadget
//     Codes is 11:00-1:00 and again 2:00-3:00, and the hour between them is
//     lunch, not the event. Same for Borderland and Paper Verse.
//   - The non-event blocks are on the timeline: inauguration, refreshment,
//     lunch and prize distribution. Someone planning their day needs the gaps
//     as much as the events.
//
// So one EVENT can produce several CARDS. `key` is per card; `id` still points
// at the mission in the store, which is what the card opens.

import React, { useEffect, useRef, useState } from 'react';
import { Clock, MapPin, ArrowRight } from 'lucide-react';
import { EventMission } from '../../types';
import { store } from '../../services/store';
import { EventDetailModal } from '../events/EventDetailModal';
import { ComicPanel } from './comic';

// Helper to trigger comic FX audio if available
const triggerAudio = () => {
  try {
    const audio = new Audio('/pop.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => { });
  } catch { }
};

type Tone = 'cyan' | 'pink' | 'gold' | 'purple';

export interface TimelineFlowItem {
  /** Unique per CARD — an event with two rounds appears twice. */
  key: string;
  /** Mission id in the store; empty for a break or a ceremony. */
  id: string;
  code: string;
  mission_name: string;
  time_display: string;
  start_time: string;
  duration: string;
  category_type: 'TECH' | 'NON_TECH' | 'SPECIAL';
  color_theme: Tone;
  single_badge?: boolean;
  /** Which round/band this card is — kept OUT of mission_name. */
  round?: string;
  /** Inauguration, refreshment, lunch, prize distribution — nothing to open. */
  milestone?: boolean;
  venue: string;
  tagline: string;
  description: string;
}

export const EventScheduleView: React.FC<{
  onSelectEvent?: (event: EventMission) => void;
}> = ({ onSelectEvent }) => {
  const [selectedEventModal, setSelectedEventModal] = useState<EventMission | null>(null);

  // References and scroll progress tracking for the animated traveling timeline spine
  const spineContainerRef = useRef<HTMLDivElement>(null);
  const progressLineRef = useRef<HTMLDivElement>(null);
  const sparkRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const nodeCentresRef = useRef<number[]>([]);
  const rowBoundsRef = useRef<{ top: number; bottom: number; tone: Tone }[]>([]);
  const [spineGradient, setSpineGradient] = useState<string>(
    'linear-gradient(180deg, #E5BD00 0%, #0FA9C6 50%, #D51F55 100%)'
  );
  const [spineHeight, setSpineHeight] = useState<number>(0);
  const spineHeightRef = useRef<number>(0);
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0);
  const [isAtNode, setIsAtNode] = useState<boolean>(false);

  const allEvents = store.getEvents();
  const getEventFromStore = (id: string): EventMission | undefined =>
    allEvents.find((e) => e.id === id);

  const handleCardClick = (item: TimelineFlowItem) => {
    if (item.milestone || !item.id) return;
    triggerAudio();
    const matched = getEventFromStore(item.id);
    if (!matched) return;
    if (onSelectEvent) onSelectEvent(matched);
    else setSelectedEventModal(matched);
  };

  /** The coordinators' timetable, in order. */
  const masterTimelineItems: TimelineFlowItem[] = [
    {
      key: 'inauguration',
      id: '',
      code: '—',
      mission_name: 'INAUGURATION',
      start_time: '09:00 AM',
      time_display: '09:00 AM – 10:30 AM',
      duration: '1 hr 30 mins',
      category_type: 'SPECIAL',
      color_theme: 'gold',
      milestone: true,
      venue: 'Main Auditorium',
      tagline: 'The day opens here.',
      description: 'Opening ceremony. Be seated before 9:00 AM.',
    },
    {
      key: 'refreshment',
      id: '',
      code: '—',
      mission_name: 'REFRESHMENT',
      start_time: '10:30 AM',
      time_display: '10:30 AM – 11:00 AM',
      duration: '30 mins',
      category_type: 'SPECIAL',
      color_theme: 'gold',
      milestone: true,
      venue: 'Campus',
      tagline: 'Break before the events begin.',
      description: 'Refreshments are served, then every event starts at 11:00.',
    },
    {
      key: 'gadget-codes-r1',
      id: 'gadget-codes',
      code: '01',
      mission_name: 'GADGET CODES',
      round: 'Round 1 & 2',
      start_time: '11:00 AM',
      time_display: '11:00 AM – 01:00 PM',
      duration: '2 hrs',
      category_type: 'TECH',
      color_theme: 'purple',
      single_badge: true,
      venue: 'CC1 lab',
      tagline: 'Code. Solve. Win.',
      description: 'Test your coding speed, logic and problem-solving skills in this ultimate technical challenge.',
    },
    {
      key: 'paper-verse-am',
      id: 'paper-presentation',
      code: '05',
      mission_name: 'PAPER VERSE',
      round: 'Slot based',
      start_time: '11:00 AM',
      time_display: '11:00 AM – 01:00 PM',
      duration: '2 hrs',
      category_type: 'TECH',
      color_theme: 'cyan',
      venue: 'Seminar Hall',
      tagline: 'Ideas that speak. Impact that lasts.',
      description: 'Present original research manuscripts, architectural discoveries, and innovative engineering paradigms.',
    },
    {
      key: 'last-signal',
      id: 'the-last-signal',
      code: '03',
      mission_name: 'THE LAST SIGNAL',
      start_time: '11:00 AM',
      time_display: '11:00 AM – 01:00 PM',
      duration: '2 hrs',
      category_type: 'TECH',
      color_theme: 'cyan',
      venue: 'CSE Dept',
      tagline: 'Decode. Transmit. Survive.',
      description: 'Intercept, decrypt, and decode corrupted signal packets through cryptographic puzzles.',
    },
    {
      key: 'debugging',
      id: 'debugging',
      code: '02',
      mission_name: 'DEBUGGING PROTOCOL',
      start_time: '11:00 AM',
      time_display: '11:00 AM – 01:00 PM',
      duration: '2 hrs',
      category_type: 'TECH',
      color_theme: 'cyan',
      venue: 'CSE Dept',
      tagline: 'Find. Fix. Conquer.',
      description: 'Find bugs, identify system failures, fix faulty code, and restore programs to working condition.',
    },
    {
      key: 'borderland-r1',
      id: 'borderland-at-gcee',
      code: '06',
      mission_name: 'BORDERLAND @ GCEE',
      round: 'Round 1',
      start_time: '12:00 PM',
      time_display: '12:00 PM – 01:00 PM',
      duration: '1 hr',
      category_type: 'NON_TECH',
      color_theme: 'pink',
      venue: 'CSE Dept',
      tagline: 'Survive. Strategize. Dominate.',
      description: 'Survive strategic mini-games in Round 1 to extend your visa for the Borderland Hunt.',
    },
    {
      key: 'lunch',
      id: '',
      code: '—',
      mission_name: 'LUNCH',
      start_time: '01:00 PM',
      time_display: '01:00 PM – 02:00 PM',
      duration: '1 hr',
      category_type: 'SPECIAL',
      color_theme: 'gold',
      milestone: true,
      venue: 'Campus',
      tagline: 'Nothing is scheduled against this hour.',
      description: 'Every event pauses. The afternoon block starts again at 2:00.',
    },
    {
      key: 'gadget-codes-final',
      id: 'gadget-codes',
      code: '01',
      mission_name: 'GADGET CODES',
      round: 'Final / Round 3',
      start_time: '02:00 PM',
      time_display: '02:00 PM – 03:00 PM',
      duration: '1 hr',
      category_type: 'TECH',
      color_theme: 'purple',
      single_badge: true,
      venue: 'CC1 lab',
      tagline: 'Code. Solve. Win.',
      description: 'Test your coding speed, logic and problem-solving skills in this ultimate technical challenge.',
    },
    {
      key: 'paper-verse-pm',
      id: 'paper-presentation',
      code: '05',
      mission_name: 'PAPER VERSE',
      round: 'Slot based',
      start_time: '02:00 PM',
      time_display: '02:00 PM – 03:00 PM',
      duration: '1 hr',
      category_type: 'TECH',
      color_theme: 'cyan',
      venue: 'Seminar Hall',
      tagline: 'Ideas that speak. Impact that lasts.',
      description: 'Present original research manuscripts, architectural discoveries, and innovative engineering paradigms.',
    },
    {
      key: 'lost-at-sql',
      id: 'lost-at-sql',
      code: '04',
      mission_name: 'LOST AT SQL',
      start_time: '02:00 PM',
      time_display: '02:00 PM – 03:00 PM',
      duration: '1 hr',
      category_type: 'TECH',
      color_theme: 'cyan',
      venue: 'CC2 lab',
      tagline: 'Query. Navigate. Extract.',
      description: 'Investigate Black Cipher\'s disappearance. Query databases and extract hidden evidence.',
    },
    {
      key: 'borderland-r2',
      id: 'borderland-at-gcee',
      code: '06',
      mission_name: 'BORDERLAND @ GCEE',
      round: 'Round 2',
      start_time: '02:00 PM',
      time_display: '02:00 PM – 03:00 PM',
      duration: '1 hr',
      category_type: 'NON_TECH',
      color_theme: 'pink',
      venue: 'CSE Dept',
      tagline: 'Survive. Strategize. Dominate.',
      description: 'Survive strategic mini-games in Round 1 to extend your visa for the Borderland Hunt.',
    },
    {
      key: 'think-strike-win',
      id: 'think-strike-and-win',
      code: '07',
      mission_name: 'THINK, STRIKE AND WIN',
      start_time: '02:00 PM',
      time_display: '02:00 PM – 03:00 PM',
      duration: '1 hr',
      category_type: 'NON_TECH',
      color_theme: 'pink',
      venue: 'CSE Dept',
      tagline: 'Think fast. Strike sharp. Win all.',
      description: 'Solve logical MCQs, picture connection links, and mystery answer deduction clues.',
    },
    {
      key: 'plot-twist',
      id: 'plot-twist',
      code: '08',
      mission_name: 'PLOT TWIST',
      start_time: '02:00 PM',
      time_display: '02:00 PM - 03:00 PM',
      duration: '1 hr',
      category_type: 'NON_TECH',
      color_theme: 'pink',
      venue: 'CSE Dept',
      tagline: 'Expect the unexpected.',
      description: "Read an incomplete, original story and figure out its real (hidden) climax across 2 deduction rounds with twists and hint advantages.",
    },
    {
      key: 'short-film',
      id: 'short-flim',
      code: '09',
      mission_name: 'SHORT FILM',
      start_time: '02:30 PM',
      time_display: '02:30 PM – 03:00 PM',
      duration: '30 mins',
      category_type: 'NON_TECH',
      color_theme: 'pink',
      venue: 'Auditorium',
      tagline: 'Freeze moments. Frame stories.',
      description: "Create an original short film based on one of the given themes:\n1) Value of time\n2) Two shadows moving in the same direction\n3) \"Sometimes the biggest obstacle isn't the obstacle in the world—it’s the doubt you accepted from it.\"\n\nTell a meaningful story through visuals, characters, and emotions while keeping the narrative clear and engaging.",
    },
    {
      key: 'prize-distribution',
      id: '',
      code: '—',
      mission_name: 'PRIZE DISTRIBUTION',
      start_time: '03:00 PM',
      time_display: '03:00 PM – 04:00 PM',
      duration: '1 hr',
      category_type: 'SPECIAL',
      color_theme: 'gold',
      milestone: true,
      venue: 'Main Auditorium',
      tagline: 'How the day closes.',
      description: 'Results and prizes for every event. Stay for it.',
    },
  ];
  // Milestones stay in every view: the gaps are part of any day's plan.
  // Every row, always: with the category tabs gone nothing can narrow this,
  // and the schedule blocks are what make the gaps in the day legible.
  const filteredTimeline = masterTimelineItems;

  // Scroll-driven animation: progress line and spark travel with zero latency in 1:1 sync with scroll
  useEffect(() => {
    let scrollRafId: number | null = null;

    // Measures positions and establishes multi-stop gradient without layout thrashing
    const measure = () => {
      const spineEl = spineContainerRef.current;
      if (!spineEl) return;
      const spineRect = spineEl.getBoundingClientRect();
      const spineTop = spineRect.top;
      const totalH = spineRect.height;
      spineHeightRef.current = totalH;
      setSpineHeight(totalH);

      // Measure node centres down the spine for shape-morphing at square nodes
      nodeCentresRef.current = nodeRefs.current.map((node) => {
        if (!node) return Number.POSITIVE_INFINITY;
        const r = node.getBoundingClientRect();
        return r.top + r.height / 2 - spineTop;
      });

      const bounds: { top: number; bottom: number; tone: Tone }[] = [];
      const stops: string[] = [];

      filteredTimeline.forEach((item, index) => {
        const rowEl = rowRefs.current[index];
        if (!rowEl) return;
        const r = rowEl.getBoundingClientRect();
        const rTop = Math.max(0, r.top - spineTop);
        const rBottom = Math.min(totalH, r.bottom - spineTop);
        bounds.push({ top: rTop, bottom: rBottom, tone: item.color_theme });
      });

      rowBoundsRef.current = bounds;

      // Construct multi-stop gradient: across each card, the line is 100% that card's color
      if (bounds.length > 0 && totalH > 0) {
        const firstColor = TONE_CONFIG[bounds[0].tone].hex;
        stops.push(`${firstColor} 0px`);

        for (let i = 0; i < bounds.length; i += 1) {
          const b = bounds[i];
          const color = TONE_CONFIG[b.tone].hex;
          stops.push(`${color} ${Math.max(0, b.top).toFixed(1)}px`);
          stops.push(`${color} ${Math.min(totalH, b.bottom).toFixed(1)}px`);
        }

        setSpineGradient(`linear-gradient(180deg, ${stops.join(', ')})`);
      }
    };

    const applyProgress = (progress: number) => {
      if (progressLineRef.current) {
        progressLineRef.current.style.height = `${(progress * 100).toFixed(2)}%`;
      }

      if (sparkRef.current) {
        sparkRef.current.style.top = `${(progress * 100).toFixed(2)}%`;
        const isVisible = progress > 0.005 && progress < 0.995;
        sparkRef.current.style.opacity = isVisible ? '1' : progress >= 0.995 ? '0.7' : '0';
      }

      // Use cached spine height instead of getBoundingClientRect() to avoid forced synchronous reflows
      const totalHeight = spineHeightRef.current || spineContainerRef.current?.offsetHeight || 1;
      const currentDistance = progress * totalHeight;

      const bounds = rowBoundsRef.current;
      if (bounds.length > 0) {
        let activeIdx = 0;
        for (let i = 0; i < bounds.length; i += 1) {
          if (currentDistance <= bounds[i].bottom || i === bounds.length - 1) {
            activeIdx = i;
            break;
          }
        }
        setActiveItemIndex((prev) => (prev !== activeIdx ? activeIdx : prev));
      }

      // Check if spark head has reached any square event node
      let nearNode = false;
      const centres = nodeCentresRef.current;
      for (let i = 0; i < centres.length; i += 1) {
        if (Math.abs(currentDistance - centres[i]) <= 24) {
          nearNode = true;
          break;
        }
      }
      setIsAtNode((prev) => (prev !== nearNode ? nearNode : prev));
    };

    // Computes progress dynamically in 1:1 real-time lockstep with current scroll position
    const updateProgress = () => {
      const spineEl = spineContainerRef.current;
      if (!spineEl) return;

      const rect = spineEl.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      // Trigger line at 60% of viewport (optimal focus point for both mobile and laptop)
      const triggerY = windowHeight * 0.60;
      const totalHeight = spineHeightRef.current || rect.height;

      if (totalHeight <= 0) return;

      const currentDistance = triggerY - rect.top;
      const progress = Math.min(Math.max(currentDistance / totalHeight, 0), 1);
      applyProgress(progress);
    };

    // Direct, latency-free scroll handler scheduled at native refresh rate (60/120 FPS)
    const handleScroll = () => {
      if (scrollRafId !== null) return;
      scrollRafId = requestAnimationFrame(() => {
        scrollRafId = null;
        updateProgress();
      });
    };

    const handleResize = () => {
      measure();
      updateProgress();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && spineContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        measure();
        updateProgress();
      });
      resizeObserver.observe(spineContainerRef.current);
    }

    measure();
    updateProgress();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
      if (scrollRafId !== null) cancelAnimationFrame(scrollRafId);
    };
  }, [filteredTimeline.length]);

  /** Tone color definitions for glowing traveling animation and nodes */
  const TONE_CONFIG: Record<
    Tone,
    {
      hex: string;
      glowRgba: string;
      glowCss: string;
      ringClass: string;
    }
  > = {
    cyan: {
      hex: '#0FA9C6',
      glowRgba: 'rgba(15, 169, 198, 0.65)',
      glowCss: '0 0 16px rgba(15, 169, 198, 0.85), 0 0 28px rgba(15, 169, 198, 0.45)',
      ringClass: 'ring-[#0FA9C6]/50 shadow-[0_0_14px_#0FA9C6]',
    },
    pink: {
      hex: '#D51F55',
      glowRgba: 'rgba(213, 31, 85, 0.65)',
      glowCss: '0 0 16px rgba(213, 31, 85, 0.85), 0 0 28px rgba(213, 31, 85, 0.45)',
      ringClass: 'ring-[#D51F55]/50 shadow-[0_0_14px_#D51F55]',
    },
    gold: {
      hex: '#E5BD00',
      glowRgba: 'rgba(229, 189, 0, 0.65)',
      glowCss: '0 0 16px rgba(229, 189, 0, 0.85), 0 0 28px rgba(229, 189, 0, 0.45)',
      ringClass: 'ring-[#E5BD00]/50 shadow-[0_0_14px_#E5BD00]',
    },
    purple: {
      hex: '#C084FC',
      glowRgba: 'rgba(192, 132, 252, 0.65)',
      glowCss: '0 0 16px rgba(192, 132, 252, 0.85), 0 0 28px rgba(192, 132, 252, 0.45)',
      ringClass: 'ring-[#C084FC]/50 shadow-[0_0_14px_#C084FC]',
    },
  };

  /** Comic ink, the same four accents the rest of the site uses. */
  const TONE: Record<Tone, { text: string; border: string; badge: string; node: string }> = {
    cyan: {
      text: 'text-[#0FA9C6]',
      border: 'border-[#0FA9C6]',
      badge: 'bg-[#0FA9C6] text-[#090A0B]',
      node: 'bg-[#0FA9C6]',
    },
    pink: {
      text: 'text-[#D51F55]',
      border: 'border-[#D51F55]',
      badge: 'bg-[#D51F55] text-[#EEEEEA]',
      node: 'bg-[#D51F55]',
    },
    gold: {
      text: 'text-[#E5BD00]',
      border: 'border-[#E5BD00]',
      badge: 'bg-[#E5BD00] text-[#090A0B]',
      node: 'bg-[#E5BD00]',
    },
    purple: {
      text: 'text-[#C084FC]',
      border: 'border-[#C084FC]',
      badge: 'bg-[#C084FC] text-[#090A0B]',
      node: 'bg-[#C084FC]',
    },
  };

  /** Our four accents map onto ComicPanel's three inked frames. */
  const FRAME_TONE: Record<Tone, 'cyan' | 'pink' | 'yellow'> = {
    cyan: 'cyan',
    pink: 'pink',
    gold: 'yellow',
    purple: 'cyan',
  };

  // Active event determining current traveling line & beacon spark color
  const activeEventItem =
    activeItemIndex >= 0 && activeItemIndex < filteredTimeline.length
      ? filteredTimeline[activeItemIndex]
      : filteredTimeline[0];
  const activeTone: Tone = activeEventItem?.color_theme || 'gold';
  const activeConfig = TONE_CONFIG[activeTone];

  return (
    <section className="relative w-full py-10 px-3 sm:px-6 max-w-7xl mx-auto space-y-8 select-none">
      {/* =========================================================================
          SECTION HEADER (Themed with 3 Event Card Colors, matching EVENTS header on Homepage)
          ========================================================================= */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-8 w-full max-w-6xl mx-auto px-2 select-none">
        {/* Left Side: Bold Fluid Gradient Line + 3 Theme Color Dots */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-1 justify-end min-w-0">
          <span
            className="h-[3.5px] sm:h-[5px] w-full max-w-[70px] xs:max-w-[120px] sm:max-w-[240px] md:max-w-[340px] lg:max-w-[440px] rounded-full bg-gradient-to-r from-transparent via-[#C084FC] via-[#0FA9C6] to-[#D51F55] shadow-[0_0_12px_rgba(15,169,198,0.6)] shrink"
            aria-hidden="true"
          />
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <span
              className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-[#C084FC] shadow-[0_0_8px_#C084FC] transition-transform hover:scale-125"
              title="Mega Event"
            />
            <span
              className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-[#0FA9C6] shadow-[0_0_8px_#0FA9C6] transition-transform hover:scale-125"
              title="Technical Events"
            />
            <span
              className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-[#D51F55] shadow-[0_0_8px_#D51F55] transition-transform hover:scale-125"
              title="Non-Technical Events"
            />
          </div>
        </div>

        {/* Title */}
        <div className="px-1 sm:px-3 shrink-0">
          <h2 className="font-display italic text-lg xs:text-xl sm:text-4xl md:text-5xl lg:text-6xl text-[#EEEEEA] tracking-wider sm:tracking-widest uppercase select-none drop-shadow-[2px_2px_0px_#090A0B] text-center whitespace-nowrap">
            EVENT SCHEDULE
          </h2>
        </div>

        {/* Right Side: 3 Theme Color Dots + Bold Fluid Gradient Line */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-1 justify-start min-w-0">
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <span
              className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-[#D51F55] shadow-[0_0_8px_#D51F55] transition-transform hover:scale-125"
              title="Non-Technical Events"
            />
            <span
              className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-[#0FA9C6] shadow-[0_0_8px_#0FA9C6] transition-transform hover:scale-125"
              title="Technical Events"
            />
            <span
              className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-[#C084FC] shadow-[0_0_8px_#C084FC] transition-transform hover:scale-125"
              title="Mega Event"
            />
          </div>
          <span
            className="h-[3.5px] sm:h-[5px] w-full max-w-[70px] xs:max-w-[120px] sm:max-w-[240px] md:max-w-[340px] lg:max-w-[440px] rounded-full bg-gradient-to-l from-transparent via-[#C084FC] via-[#0FA9C6] to-[#D51F55] shadow-[0_0_12px_rgba(15,169,198,0.6)] shrink"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------
          TIMELINE SPINE
          ------------------------------------------------------------------ */}
      <div ref={spineContainerRef} className="relative pt-4 pb-8 max-w-5xl mx-auto">
        {/* Static Base Track with comic ink border and subtle 20% preview tint */}
        <div className="absolute left-4 sm:left-1/2 top-4 bottom-4 w-[4px] -translate-x-1/2 bg-[#17191E] border-x border-[#23262D] z-0 pointer-events-none rounded-full overflow-hidden">
          <div
            className="absolute left-0 -top-4 w-full opacity-20 pointer-events-none"
            style={{
              height: spineHeight > 0 ? `${spineHeight}px` : '100%',
              background: spineGradient,
            }}
          />
        </div>

        {/* Animated Traveling Line (reveals the multi-stop timeline gradient as it travels) */}
        <div
          ref={progressLineRef}
          className="absolute left-4 sm:left-1/2 top-4 w-[4px] -translate-x-1/2 z-0 pointer-events-none rounded-full overflow-hidden will-change-[height]"
          style={{
            height: '0%',
            boxShadow: activeConfig.glowCss,
            transition: 'box-shadow 0.35s ease',
          }}
        >
          {/* Full-height track matching every card's exact position & color */}
          <div
            className="absolute left-0 -top-4 w-full pointer-events-none"
            style={{
              height: spineHeight > 0 ? `${spineHeight}px` : '100%',
              background: spineGradient,
            }}
          />

          {/* Inner animated electric beam streaming down */}
          <div className="w-full h-full animate-timeline-stream relative z-10" />
        </div>

        {/* Traveling Energy Beacon / Comic Spark at the head of the traveling line */}
        {/* No transition on the spark: the scroll handler writes `top` every
            frame, so any duration here is pure input lag — the head trails the
            cursor by exactly that long however cheap the maths above it is.
            Colour changes are transitioned on the children instead. */}
        <div
          ref={sparkRef}
          className="absolute left-4 sm:left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none will-change-[top]"
          style={{
            top: '0%',
            opacity: 0,
          }}
        >
          {/* Energy pulse halo matching active event card color */}
          <div
            className="absolute -inset-2.5 rounded-full animate-ping pointer-events-none transition-colors duration-300"
            style={{ backgroundColor: activeConfig.glowRgba }}
          />
          <div
            className="absolute -inset-1 rounded-full blur-[3px] pointer-events-none transition-colors duration-300"
            style={{ backgroundColor: activeConfig.glowRgba }}
          />
          {/* Comic Spark Head: smooth animation from Diamond to Square at nodes and back */}
          <div
            className={`relative w-3.5 h-3.5 border-2 border-[#090A0B] flex items-center justify-center transition-all duration-300 ease-out ${
              isAtNode
                ? 'rotate-0 rounded-[2.5px] scale-[1.18]'
                : 'rotate-45 rounded-none scale-100'
            }`}
            style={{
              backgroundColor: activeConfig.hex,
              boxShadow: `${activeConfig.glowCss}, 2px 2px 0px #090A0B`,
            }}
          />
        </div>

        <div className="space-y-7 relative z-10">
          {filteredTimeline.map((item, index) => {
            const tone = TONE[item.color_theme];
            const isEven = index % 2 === 0;
            const openable = !item.milestone && !!item.id;
            const isReached = index <= activeItemIndex;

            return (
              <div
                key={item.key}
                ref={(el) => {
                  rowRefs.current[index] = el;
                }}
                className="relative flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-8 group"
              >
                {/* Node on the spine */}
                <div
                  ref={(el) => {
                    nodeRefs.current[index] = el;
                  }}
                  className="absolute left-4 sm:left-1/2 top-6 -translate-x-1/2 z-20"
                >
                  <div
                    className={`w-4 h-4 ${tone.node} border-2 border-[#090A0B] shadow-[2px_2px_0px_#090A0B] transition-all duration-300 ${
                      isReached
                        ? `scale-110 ring-4 ${TONE_CONFIG[item.color_theme].ringClass}`
                        : 'opacity-40 scale-90 saturate-50'
                    }`}
                  />
                </div>

                {/* The card */}
                <div className={`w-full sm:w-[calc(50%-2rem)] pl-10 sm:pl-0 ${isEven ? '' : 'sm:order-2'}`}>
                  <div
                    onClick={() => handleCardClick(item)}
                    role={openable ? 'button' : undefined}
                    tabIndex={openable ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (!openable) return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardClick(item);
                      }
                    }}
                    className={`${
                      openable ? 'cursor-pointer transition-all duration-300 hover:-translate-y-1' : ''
                    } ${
                      isReached ? 'opacity-100' : 'opacity-85 sm:opacity-75'
                    } transition-opacity duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E5BD00]`}
                  >
                    {/* ComicPanel inks three frames: tech, non-tech, special.
                        The mega tier's purple has no frame of its own, so
                        Gadget Codes takes the technical frame it belongs to
                        and keeps purple on its badge and accents. */}
                    <ComicPanel
                      tone={FRAME_TONE[item.color_theme]}
                      className={item.color_theme === 'purple' ? 'mega-tier' : ''}
                    >
                      <div className={isEven ? 'sm:text-right' : 'sm:text-left'}>
                        <div className={`flex flex-wrap items-center gap-2 ${isEven ? 'sm:justify-end' : 'sm:justify-start'}`}>
                          {!item.milestone && (
                            <span className={`px-2.5 py-0.5 font-mono text-xs font-black uppercase ${tone.badge}`}>
                              MISSION {item.code}
                            </span>
                          )}
                          {item.round && (
                            <span className={`border-2 ${tone.border} px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${tone.text}`}>
                              {item.round}
                            </span>
                          )}
                          {item.single_badge && (
                            <span className="px-2 py-0.5 bg-[#E5BD00] text-[#090A0B] font-mono font-black text-[10px] uppercase shrink-0">
                              MEGA EVENT
                            </span>
                          )}
                          <span className="font-mono text-[10px] text-[#8E939D] uppercase font-bold tracking-wider">
                            {item.category_type === 'TECH'
                              ? 'Technical'
                              : item.category_type === 'NON_TECH'
                                ? 'Non-technical'
                                : 'Schedule'}
                          </span>
                        </div>

                        <h3 className="font-display text-lg sm:text-xl text-white uppercase tracking-wide mt-1.5">
                          {item.mission_name}
                        </h3>

                        <p className={`font-mono text-xs font-semibold tracking-wide mt-0.5 ${tone.text}`}>
                          {item.tagline}
                        </p>

                        <p className="font-mono text-xs text-[#B8B8B2] mt-2 line-clamp-2 leading-relaxed font-normal">
                          {item.description}
                        </p>

                        <div className={`flex flex-wrap items-center gap-2 pt-3 mt-3 border-t-2 border-[#23262D] ${isEven ? 'sm:justify-end' : 'sm:justify-start'}`}>
                          <span className="flex items-center gap-1.5 border-2 border-[#23262D] bg-[#111214] px-2 py-1 font-mono text-xs font-bold text-[#EEEEEA]">
                            <Clock className="w-3.5 h-3.5 text-[#E5BD00]" />
                            {item.time_display}
                          </span>
                          <span className="flex items-center gap-1.5 border-2 border-[#23262D] bg-[#111214] px-2 py-1 font-mono text-xs text-[#B8B8B2]">
                            <MapPin className="w-3.5 h-3.5 text-[#0FA9C6]" />
                            {item.venue}
                          </span>
                        </div>

                        {openable && (
                          <div className={`text-[10px] font-mono ${tone.text} font-bold mt-2.5 flex items-center gap-1 ${isEven ? 'sm:justify-end' : 'sm:justify-start'}`}>
                            <span>CLICK TO OPEN RULES &amp; DETAILS</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </ComicPanel>
                  </div>
                </div>

                {/* Time card on the opposite side — comic ink, not a plain pill */}
                <div className={`hidden sm:flex w-[calc(50%-2rem)] items-center ${isEven ? 'justify-start order-2' : 'justify-end order-1'}`}>
                  <div className="border-2 border-[#090A0B] bg-[#141519] px-3 py-2 shadow-[4px_4px_0px_#090A0B] flex items-center gap-2 -rotate-1">
                    <Clock className={`w-4 h-4 ${tone.text}`} />
                    <span className="font-mono text-sm text-[#EEEEEA] font-bold tracking-wider">
                      {item.start_time}
                    </span>
                    <span className={`border-2 ${tone.border} px-1.5 font-mono text-[10px] ${tone.text}`}>
                      {item.duration}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Only opens when no onSelectEvent was supplied — i.e. on /schedule,
          where this component is not nested inside a page that owns the modal. */}
      <EventDetailModal
        event={selectedEventModal}
        onClose={() => setSelectedEventModal(null)}
        onRegisterFx={triggerAudio}
      />
    </section>
  );
};
