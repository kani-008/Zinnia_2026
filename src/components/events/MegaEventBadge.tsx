import React from 'react';
import { Crown } from 'lucide-react';

/**
 * The "👑 MEGA EVENT" marker for the flagship technical event (Gadget Codes).
 *
 * Built from the homepage's own sticker vocabulary — yellow #E5BD00 fill, ink
 * border, offset shadow, slight rotation, .sticker-pop hover — so it reads as
 * part of the existing set rather than a new component. `compact` is the inline
 * chip used on the Events page cards; the default is the corner sticker for the
 * hand-drawn homepage cards.
 */
export const MegaEventBadge: React.FC<{ compact?: boolean; className?: string }> = ({
  compact = false,
  className = '',
}) => {
  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 bg-[#E5BD00] text-[#090A0B] text-[10px] font-mono font-black uppercase tracking-wider rounded border border-black shadow-[2px_2px_0px_#000000] ${className}`}
        title="Mega event"
      >
        <Crown className="w-3 h-3" strokeWidth={2.6} /> Mega Event
      </span>
    );
  }

  return (
    <div
      className={`mega-crown absolute -top-3 right-3 z-20 rotate-[6deg] sticker-pop ${className}`}
      aria-label="Mega event"
    >
      <div className="flex items-center gap-1.5 bg-[#E5BD00] border-2 border-[#090A0B] px-2.5 py-1 shadow-[3px_3px_0px_#090A0B]">
        <Crown className="w-3.5 h-3.5 text-[#090A0B]" strokeWidth={2.6} />
        <span className="font-comic text-[11px] font-black uppercase tracking-wider text-[#090A0B]">
          Mega Event
        </span>
      </div>
    </div>
  );
};

export default MegaEventBadge;
