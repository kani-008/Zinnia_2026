// Zinnia 2026 — Contact page.
//
// Restyled onto the homepage comic system: sketchy <ComicPanel> ink instead of
// rounded-xl boxes, Luckiest Guy / Bangers / JetBrains Mono, and the cyan /
// pink / yellow accents. All original content is preserved — coordinators,
// campus address, the embedded map, and every bus detail that was already here.
//
// The map is an iframe, so a click inside it never reaches this page. A
// transparent catcher sits on top to run the radar ping and then open Google
// Maps; that is what trades away in-place pan/zoom.

import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Clock, Mail, MapPin, Phone } from 'lucide-react';

import { WebsiteNavbar } from '../components/layout/Navbar';
import { WebsiteFooter } from '../components/layout/Footer';
import { registerNav } from '../services/registerNavigation';
import {
  ComicBolt,
  ComicCTA,
  ComicChip,
  ComicPanel,
  ComicSectionTitle,
} from '../components/ui/comic';

/** Campus coordinates from the shared maps link. */
const CAMPUS_LAT_LNG = '11.415753,77.665973';
const MAP_EMBED_SRC = `https://maps.google.com/maps?q=${CAMPUS_LAT_LNG}&z=16&output=embed`;
const MAP_OPEN_URL = `https://www.google.com/maps/search/?api=1&query=${CAMPUS_LAT_LNG}`;

interface Coordinator {
  name: string;
  role: string;
  phone: string;
  /** tel: form, digits only */
  dial: string;
}

const COORDINATORS: Coordinator[] = [
  { name: 'Vijayanand', role: 'Staff Coordinator', phone: '+91 98765 43287', dial: '+919876543287' },
  { name: 'Saran S', role: 'Student Coordinator', phone: '+91 96299 93985', dial: '+919629993985' },
];

interface BusRun {
  time: string;
  service: string;
}

/** Cyan group — departures from Erode Bus Stand. */
const FROM_ERODE: BusRun[] = [
  { time: '8:00 AM', service: 'Route Bus' },
  { time: '8:00 AM', service: 'Town Govt Bus' },
  { time: '8:30 AM', service: 'Town Govt Bus 5B' },
];

/** Yellow group — departures from Chithode. */
const FROM_CHITHODE: BusRun[] = [
  { time: '8:15 – 8:20 AM', service: 'Route Bus' },
  { time: '8:30 – 8:35 AM', service: 'Town Govt Bus' },
  { time: 'Around 8:50 AM', service: 'Town Govt Bus 5B' },
];

/**
 * Details that were already on this page and are not covered by the
 * origin-grouped timetable above (arrival times, frequencies, and which stop to
 * get down at). Kept so nothing is lost in the reorganisation.
 */
const EXTRA_NOTES: string[] = [
  'Route buses from Erode Bus Stand and Chithode reach the college by around 8:45 AM.',
  'Town bus from Lakshmi Nagar / Bhavani Bypass departs about 8:10 AM and reaches the college by 8:30 AM.',
  'Bus No. 3 and B12 run roughly every 5 minutes from Lakshmi Nagar or Bhavani Bypass — get down at the Government College of Engineering stop, then a short walk to campus.',
  'Bus No. 3 runs roughly every 10 minutes from Erode Bus Stand — get down at the Government College of Engineering (IRTT) stop, then a short walk to campus.',
];

interface Ping {
  id: number;
  x: number;
  y: number;
}

/**
 * One row of the timetable.
 *
 * The departure time used to be inked in the group's accent colour, which read
 * as a dim red/rose smudge on the dark panel — exactly the thing people squint
 * at on a phone at a bus stop. The time is now near-white (#F4F4F0) on its own
 * dark chip, roughly 15:1 against the panel, and the accent survives as the
 * chip's border and the bus icon. Colour still groups the rows; contrast does
 * the reading.
 */
const BusRunRow: React.FC<{ run: BusRun; tone: 'cyan' | 'yellow' }> = ({ run, tone }) => (
  <li className="flex items-center justify-between gap-3 border-b border-[#23262D] py-1.5">
    <span className="flex items-center gap-2 font-mono text-xs text-[#EEEEEA]">
      <Bus size={13} className={tone === 'cyan' ? 'text-[#0FA9C6]' : 'text-[#E5BD00]'} />
      {run.service}
    </span>
    <span
      className={`shrink-0 border bg-[#191B1F] px-2 py-0.5 font-comic text-sm font-bold tracking-wide text-[#F4F4F0] ${
        tone === 'cyan' ? 'border-[#0FA9C6]/70' : 'border-[#E5BD00]/70'
      }`}
    >
      {run.time}
    </span>
  </li>
);

export const WebsiteContactPage: React.FC = () => {
  const navigate = useNavigate();
  const [interactiveSoundText, setInteractiveSoundText] = useState<string | null>(null);

  const [pings, setPings] = useState<Ping[]>([]);
  const [mapGlow, setMapGlow] = useState(false);
  const pingId = useRef(0);

  const triggerComicFX = (soundText: string) => {
    setInteractiveSoundText(soundText);
    setTimeout(() => {
      setInteractiveSoundText(null);
    }, 900);
  };

  /**
   * Radar ping from the click point, a glow on the frame, then Google Maps in a
   * new tab. The 340ms delay stays inside the browser's transient user
   * activation window, so window.open is not treated as an unsolicited popup.
   */
  const handleMapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = (pingId.current += 1);

    setPings((prev) => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setMapGlow(true);
    triggerComicFX('PING!');

    window.setTimeout(() => {
      setPings((prev) => prev.filter((p) => p.id !== id));
      setMapGlow(false);
    }, 660);

    window.setTimeout(() => {
      window.open(MAP_OPEN_URL, '_blank', 'noopener,noreferrer');
    }, 340);
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-[#08090A] text-[#EEEEEA] flex flex-col justify-between p-3 sm:p-5 md:p-6 select-none scroll-smooth">
      {/* Floating Interactive Comic Sound FX Pop */}
      {interactiveSoundText && (
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-80 pointer-events-none animate-bounce">
          <div className="px-6 py-2.5 bg-[#E5BD00] border-2 border-[#090A0B] shadow-[5px_5px_0px_#090A0B] rotate-3 sticker-pop">
            <span className="font-display text-3xl sm:text-5xl text-[#090A0B] tracking-wider font-black">
              {interactiveSoundText}
            </span>
          </div>
        </div>
      )}

      {/* Universal Comic Navbar */}
      <WebsiteNavbar />

      {/* halftone wash, same utility the homepage sections use */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-[0.07] bg-halftone-dots-cyan"
        aria-hidden="true"
      />

      <main className="relative z-20 max-w-6xl mx-auto w-full pt-10 sm:pt-14 pb-16 px-2 sm:px-4 flex-1">
        {/* Page Header */}
        <div className="text-center space-y-3 mb-10 sm:mb-12">
          <div className="flex justify-center">
            <ComicChip tone="yellow" rotate={-2}>
              <ComicBolt tone="yellow" className="w-3 h-3" /> Help desk open
            </ComicChip>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl uppercase tracking-tight text-[#EEEEEA] text-stroke-comic-sm">
            CONTACT <span className="text-[#E5BD00]">US</span>
          </h1>

          <p className="font-mono text-xs sm:text-sm text-[#B8B8B2] max-w-xl mx-auto leading-relaxed">
            Have questions about event guidelines, accommodation, schedule, or registrations? We are
            here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-7 items-stretch">
          {/* ================= CARD 1: Coordinators ================= */}
          <ComicPanel tone="cyan">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 border-2 border-[#0FA9C6] bg-[#111214] text-[#E5BD00] flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <ComicSectionTitle tone="cyan">OFFICIAL COORDINATOR</ComicSectionTitle>
                <p className="font-mono text-[11px] text-[#B8B8B2]">
                  Direct inquiries &amp; verification desk
                </p>
              </div>
            </div>

            <div className="stack-box">
              {COORDINATORS.map((person) => (
                <div
                  key={person.dial}
                  className="flex items-center justify-between gap-3 border border-[#0FA9C6]/20 bg-[#111214] pad-box-sm transition-colors hover:border-[#0FA9C6]/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 border border-[#0FA9C6]/30 bg-[#17181C] text-[#0FA9C6] flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-mono text-sm font-bold text-[#EEEEEA]">{person.name}</p>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-[#B8B8B2]">
                        {person.role}
                      </p>
                      <p className="font-mono text-sm font-bold text-[#EEEEEA]">{person.phone}</p>
                    </div>
                  </div>

                  <a
                    href={`tel:${person.dial}`}
                    className="shrink-0 border-2 border-[#0FA9C6] px-3 py-1.5 font-comic text-xs uppercase tracking-wider text-[#0FA9C6] shadow-[3px_3px_0px_#090A0B] btn-comic transition-colors hover:bg-[#0FA9C6] hover:text-[#090A0B]"
                  >
                    Call
                  </a>
                </div>
              ))}
            </div>
          </ComicPanel>

          {/* ================= CARD 2: Campus + map ================= */}
          <ComicPanel tone="cyan">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 border-2 border-[#0FA9C6] bg-[#111214] text-[#E5BD00] flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <ComicSectionTitle tone="cyan">DEPARTMENT OF CSE</ComicSectionTitle>
                <p className="font-mono text-[11px] text-[#B8B8B2]">
                  Government College of Engineering, Erode
                </p>
              </div>
            </div>

            {/* Clickable map. The iframe is pointer-events-none so the catcher
                above it reliably receives the click; a keyboard-reachable
                button below covers the same action for non-pointer users. */}
            <div
              onClick={handleMapClick}
              className={`map-frame relative overflow-hidden border-2 border-[#0FA9C6]/30 bg-[#17181C] cursor-pointer ${
                mapGlow ? 'is-pinged' : ''
              }`}
            >
              <iframe
                title="Department of CSE, Government College of Engineering, Erode"
                src={MAP_EMBED_SRC}
                className="w-full h-44 sm:h-52 border-0 block pointer-events-none"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />

              {pings.map((p) => (
                <span key={p.id} className="map-ping" style={{ left: p.x, top: p.y }} />
              ))}

              <span className="pointer-events-none absolute bottom-2 right-2 border border-[#0FA9C6]/40 bg-[#08090A]/85 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-[#0FA9C6]">
                Tap to open maps
              </span>
            </div>

            <button
              type="button"
              onClick={() => window.open(MAP_OPEN_URL, '_blank', 'noopener,noreferrer')}
              className="mt-4 w-full border-2 border-[#0FA9C6] px-4 py-2 font-comic text-xs uppercase tracking-wider text-[#0FA9C6] shadow-[3px_3px_0px_#090A0B] btn-comic transition-colors hover:bg-[#0FA9C6] hover:text-[#090A0B]"
            >
              Open in Google Maps
            </button>
          </ComicPanel>

          {/* ================= CARD 3: Getting to IRTT ================= */}
          <div className="lg:col-span-2">
            <ComicPanel tone="yellow">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="w-10 h-10 border-2 border-[#E5BD00] bg-[#111214] text-[#0FA9C6] flex items-center justify-center shrink-0">
                  <Bus className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <ComicSectionTitle tone="yellow">GETTING TO IRTT</ComicSectionTitle>
                  <p className="font-mono text-[11px] text-[#B8B8B2]">
                    Government bus services to the college campus
                  </p>
                </div>
                <ComicChip tone="yellow" rotate={2} className="ml-auto">
                  <Clock size={11} /> Morning departures
                </ComicChip>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* FROM ERODE BUS STAND — cyan, matching technical events */}
                <div className="border-2 border-[#0FA9C6]/40 bg-[#111214] pad-box">
                  <div className="mb-3 flex items-center gap-2 border-b-2 border-[#0FA9C6]/30 pb-2.5">
                    <Bus size={15} className="text-[#0FA9C6] shrink-0" />
                    <h4 className="font-comic text-sm uppercase tracking-wider text-[#0FA9C6]">
                      From Erode Bus Stand
                    </h4>
                  </div>
                  <ul className="row-list">
                    {FROM_ERODE.map((run) => (
                      <BusRunRow key={`${run.time}-${run.service}`} run={run} tone="cyan" />
                    ))}
                  </ul>
                </div>

                {/* FROM CHITHODE — yellow: the pink read poorly on the dark panel, and the
                    timetable is something people squint at on a phone at a bus stop */}
                <div className="border-2 border-[#E5BD00]/50 bg-[#111214] pad-box">
                  <div className="mb-3 flex items-center gap-2 border-b-2 border-[#E5BD00]/40 pb-2.5">
                    <Bus size={15} className="text-[#E5BD00] shrink-0" />
                    <h4 className="font-comic text-sm uppercase tracking-wider text-[#E5BD00]">
                      From Chithode
                    </h4>
                  </div>
                  <ul className="row-list">
                    {FROM_CHITHODE.map((run) => (
                      <BusRunRow key={`${run.time}-${run.service}`} run={run} tone="yellow" />
                    ))}
                  </ul>
                </div>
              </div>

              {/* Retained detail from the previous bus card. */}
              <div className="mt-8 border-t-2 border-[#23262D] pt-6">
                <h4 className="mb-3 flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#B8B8B2]">
                  <ComicBolt tone="yellow" className="w-3.5 h-3.5" /> Also good to know
                </h4>
                <ul className="space-y-2">
                  {EXTRA_NOTES.map((note) => (
                    <li
                      key={note}
                      className="flex items-start gap-2 font-mono text-[11px] leading-relaxed text-[#D3D3CE]"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-[#E5BD00]" />
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            </ComicPanel>
          </div>
        </div>

        {/* Register CTA — routes through registerNav so this page follows the
            same cutover redirect as every other Register entry point. */}
        <div className="mt-10 flex justify-center">
          <ComicCTA
            tone="cyan"
            fullWidth={false}
            onClick={() => {
              triggerComicFX('REGISTER!');
              registerNav.setNavigator((path) => navigate(path));
              registerNav.trigger();
            }}
          >
            Register for Zinnia
          </ComicCTA>
        </div>
      </main>

      {/* Website Footer */}
      <WebsiteFooter />
    </div>
  );
};

export default WebsiteContactPage;
