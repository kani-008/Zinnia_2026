import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, Trophy, Users, X } from 'lucide-react';
import { EventMission } from '../../types';
import { loadSession } from '../../lib/participant/api';

/**
 * The event detail modal — briefing, rules, prizes, coordinators, register CTA.
 *
 * This markup previously existed three times over: in Events.tsx, Home.tsx and
 * EventScheduleView.tsx, along with three copies of renderPrizeContent. They
 * had already drifted apart:
 *
 *   - Home's prize grid assumed a second prize always existed, so an event with
 *     only a first prize rendered an empty cell.
 *   - Fixing the "already registered" CTA had to be done three times, and the
 *     first two attempts each missed a copy.
 *
 * One component now, so a change lands everywhere at once.
 */

const renderPrizeContent = (prizeText?: string, textColor = 'text-white') => {
  if (!prizeText) return null;
  // "Rs 3,000 + Shield" reads better split across two lines than wrapped.
  if (prizeText.includes('+')) {
    const parts = prizeText.split('+');
    const amount = parts[0].trim();
    const perk = parts.slice(1).join('+').trim();
    return (
      <div className="flex flex-col items-center justify-center">
        <span className={`font-bold text-xs sm:text-sm leading-tight ${textColor}`}>{amount}</span>
        <span className="text-[10px] sm:text-xs font-semibold leading-tight mt-0.5 whitespace-normal break-words text-[#D0D0D4]">
          + {perk}
        </span>
      </div>
    );
  }
  return (
    <span className={`font-bold text-xs sm:text-sm leading-tight break-words ${textColor}`}>
      {prizeText}
    </span>
  );
};

export interface EventDetailModalProps {
  /** null closes the modal, so callers can pass their selection state directly. */
  event: EventMission | null;
  onClose: () => void;
  /** Fired just before navigating away — the pages use it for their click sound. */
  onRegisterFx?: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  onRegisterFx,
}) => {
  const navigate = useNavigate();

  // Freeze the page behind the overlay. Home and the schedule view each had
  // this; the events page did not, so its background scrolled under the modal.
  // Keeping it here means every caller behaves the same.
  //
  // Declared before the early return — hooks cannot sit behind a condition.
  useEffect(() => {
    if (!event) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [event]);

  if (!event) return null;

  const isTech = event.event_type === 'TECH';

  // Someone already registered picks events on their dashboard; sending them
  // back to the sign-up form offers a registration they cannot make. Deciding
  // it here means no caller can get it wrong.
  const signedIn = Boolean(loadSession());
  const onRegister = () => {
    onRegisterFx?.();
    navigate(signedIn ? '/participant/dashboard' : `/register?mission=${event.id}`);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={event.mission_name}
        className={`relative w-[92%] sm:w-full max-w-2xl max-h-[88vh] sm:max-h-[90vh] overflow-y-auto bg-[#141417] border-[2.5px] sm:border-[3px] ${
          isTech ? 'border-[#3CE7FF]' : 'border-[#FF3366]'
        } shadow-[6px_6px_0px_#000000] sm:shadow-[8px_8px_0px_#000000] p-4 sm:p-7 rounded-2xl space-y-4 sm:space-y-5 select-text mx-auto`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#2A2A2E] pb-2.5">
          <div className="space-y-0.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 font-mono font-black text-xs rounded uppercase ${
                  isTech ? 'bg-[#3CE7FF] text-[#0D0D0F]' : 'bg-[#FF3366] text-white'
                }`}
              >
                {event.code}
              </span>
              <span className="font-mono text-xs text-[#A8A8AC] uppercase">{event.category}</span>
            </div>
            <h3 className="font-display text-2xl sm:text-3xl text-white uppercase tracking-wide leading-tight mt-1">
              {event.mission_name}
            </h3>
            <p
              className={`font-comic text-xs sm:text-sm font-bold ${
                isTech ? 'text-[#3CE7FF]' : 'text-[#FF3366]'
              }`}
            >
              {event.tagline || event.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-[#222226] hover:bg-[#FF3366] text-[#F2F2F0] hover:text-white rounded-xl transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick meta */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-xs font-mono">
          <div className="p-2.5 bg-[#1A1A1E] border border-[#2E2E33] rounded-lg">
            <div className="text-[#A8A8AC] text-[10px] flex items-center gap-1">
              <Users className="w-3 h-3 text-[#F5D90A] shrink-0" /> TEAM SIZE
            </div>
            <div className="text-white font-bold mt-0.5 text-[11px] sm:text-xs leading-snug break-words">
              {event.team_size_min}
              {event.team_size_min !== event.team_size_max ? ` - ${event.team_size_max}` : ''} Members
            </div>
          </div>
          <div className="p-2.5 bg-[#1A1A1E] border border-[#2E2E33] rounded-lg">
            <div className="text-[#A8A8AC] text-[10px] flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#F5D90A] shrink-0" /> TIME
            </div>
            <div className="text-white font-bold mt-0.5 text-[11px] sm:text-xs leading-snug break-words">
              {event.schedule_time}
            </div>
          </div>
          <div className="p-2.5 bg-[#1A1A1E] border border-[#2E2E33] rounded-lg">
            <div className="text-[#A8A8AC] text-[10px] flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#3CE7FF] shrink-0" /> VENUE
            </div>
            <div className="text-white font-bold mt-0.5 text-[11px] sm:text-xs leading-snug break-words">
              {event.venue}
            </div>
          </div>
        </div>


        {/* Teaser / Trailer Video (Vertical Portrait for Shorts/Reels) */}
        {event.youtube_embed_url && (
          <div className="space-y-2 flex flex-col items-center">
            <h4 className="font-mono text-xs text-[#F5D90A] uppercase tracking-wider font-bold self-start">
              // TEASER / TRAILER
            </h4>
            <div className="relative w-full max-w-[260px] sm:max-w-[280px] aspect-[9/16] mx-auto rounded-2xl overflow-hidden border-2 border-[#FF3366]/60 bg-black shadow-[6px_6px_0px_#000000]">
              <iframe
                className="w-full h-full"
                src={event.youtube_embed_url}
                title={`${event.mission_name} Teaser`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        )}


        
        {/* Briefing */}
        <div className="space-y-1.5">
          <h4 className="font-mono text-xs text-[#F5D90A] uppercase tracking-wider font-bold">
            // BRIEFING
          </h4>
          <p className="font-comic text-xs sm:text-sm text-[#D0D0D4] leading-relaxed whitespace-pre-line">
            {event.description}
          </p>
        </div>

        

        {/* Rules */}
        {event.rules && event.rules.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-mono text-xs text-[#F5D90A] uppercase tracking-wider font-bold">
              // RULES &amp; GUIDELINES
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
              {event.rules.map((rule, i) => (
                <li key={i} className="flex items-start gap-2 text-xs font-comic text-[#C0C0C5]">
                  <span className="text-[#3CE7FF] shrink-0 font-bold">•</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Prizes — the column count follows how many there actually are, so an
            event with a single prize does not render two empty cells. */}
        {event.prizes && (
          <div className="p-3 bg-[#1A1A1E] border border-[#2E2E33] rounded-xl space-y-2">
            <h4 className="font-mono text-xs text-[#F5D90A] uppercase tracking-wider font-bold flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-[#F5D90A]" /> PRIZE REWARDS
            </h4>
            <div
              className={`grid ${
                event.prizes.third
                  ? 'grid-cols-3'
                  : event.prizes.second
                  ? 'grid-cols-2'
                  : 'grid-cols-1'
              } gap-1.5 sm:gap-2 text-center text-xs`}
            >
              <div className="p-2 bg-[#222228] rounded-lg border border-[#3A3A40] flex flex-col justify-center items-center">
                <div className="text-[10px] text-[#A8A8AC] uppercase font-mono">1ST PRIZE</div>
                <div className="mt-1 w-full">
                  {renderPrizeContent(event.prizes.first, 'text-[#F5D90A]')}
                </div>
              </div>
              {event.prizes.second && (
                <div className="p-2 bg-[#222228] rounded-lg border border-[#3A3A40] flex flex-col justify-center items-center">
                  <div className="text-[10px] text-[#A8A8AC] uppercase font-mono">2ND PRIZE</div>
                  <div className="mt-1 w-full">
                    {renderPrizeContent(event.prizes.second, 'text-white')}
                  </div>
                </div>
              )}
              {event.prizes.third && (
                <div className="p-2 bg-[#222228] rounded-lg border border-[#3A3A40] flex flex-col justify-center items-center">
                  <div className="text-[10px] text-[#A8A8AC] uppercase font-mono">3RD PRIZE</div>
                  <div className="mt-1 w-full">
                    {renderPrizeContent(event.prizes.third, 'text-[#A8A8AC]')}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Coordinators */}
        {event.coordinators && event.coordinators.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="font-mono text-xs text-[#A8A8AC] uppercase tracking-wider font-bold">
              // HELPLINE &amp; COORDINATORS
            </h4>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {event.coordinators.map((c, i) => (
                <div
                  key={i}
                  className="text-xs font-mono text-[#D0D0D4] flex items-center gap-1.5 bg-[#1A1A1E] px-2.5 py-1 rounded border border-[#2E2E33]"
                >
                  <span>
                    {c.name} ({c.role}):
                  </span>
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

        {/* Register CTA */}
        <div className="pt-3 pb-1 border-t border-[#2A2A2E]">
          <button
            onClick={onRegister}
            className={`w-full py-3.5 font-display text-sm sm:text-base tracking-wider uppercase font-bold cursor-pointer transition-all border-[2px] shadow-[4px_4px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2 rounded-xl ${
              isTech
                ? 'bg-[#3CE7FF] hover:bg-[#F5D90A] text-[#0D0D0F] border-[#3CE7FF]'
                : 'bg-[#FF3366] hover:bg-[#F5D90A] text-white hover:text-[#0D0D0F] border-[#FF3366]'
            }`}
          >
            <span>
              {signedIn ? 'PICK THIS IN YOUR DASHBOARD' : `REGISTER FOR ${event.mission_name}`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;
