import React from 'react';
import { Clock, Ticket } from 'lucide-react';

import { ON_SPOT_REGISTRATION_FEE, REGISTRATION_FEE_PER_HEAD } from '../../config/site';
import { CLOSES_DEFAULT } from '../../lib/rules/catalog';

/**
 * "23 Sept" - from the same constant the registration rules close on, so this
 * line cannot announce one date while registration shuts on another. Pinned to
 * IST so a visitor abroad still sees the desk's date.
 */
const CLOSES_ON = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  timeZone: 'Asia/Kolkata',
}).format(new Date(CLOSES_DEFAULT));

/**
 * Online vs on-the-spot fee and the closing date, shown right under the hero's
 * REGISTER button.
 *
 * A yellow-inked comic panel with a hard offset shadow. Both lines share the
 * same lettering - Bangers with an ink drop shadow - so the date reads as part
 * of the same panel. Sized with clamp() so each stays on ONE line from a 360px
 * phone up.
 */
export const RegistrationFeeCallout: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex justify-center ${className}`}>
    <div className="inline-flex max-w-full flex-col items-center gap-[clamp(0.3rem,1.4vw,0.45rem)] bg-[#111214] border-[2.5px] border-[#E5BD00] shadow-[4px_4px_0px_#090A0B] -rotate-1 sticker-pop px-[clamp(0.7rem,3.4vw,1.25rem)] py-[clamp(0.45rem,1.8vw,0.65rem)] text-center">
      <div className="flex flex-nowrap items-center justify-center whitespace-nowrap gap-x-[clamp(0.4rem,2vw,0.85rem)] font-comic uppercase tracking-[0.06em] leading-none text-[clamp(0.95rem,4.3vw,1.4rem)] [text-shadow:1.5px_1.5px_0_#090A0B]">
        <span className="inline-flex items-center gap-[0.3em] text-[#0FA9C6]">
          <Ticket className="h-[0.85em] w-[0.85em] shrink-0" strokeWidth={2.5} />
          Online ₹{REGISTRATION_FEE_PER_HEAD}
        </span>
        <span className="text-[#71767B]">•</span>
        <span className="text-[#E5BD00]">On-the-spot ₹{ON_SPOT_REGISTRATION_FEE}</span>
      </div>

      <div className="flex flex-nowrap items-center justify-center whitespace-nowrap font-comic uppercase tracking-[0.06em] leading-none text-[clamp(0.8rem,3.55vw,1.15rem)] text-[#D51F55] [text-shadow:1.5px_1.5px_0_#090A0B]">
        <span className="inline-flex items-center gap-[0.3em]">
          <Clock className="h-[0.85em] w-[0.85em] shrink-0" strokeWidth={2.5} />
          Online registration closes on {CLOSES_ON}
        </span>
      </div>
    </div>
  </div>
);

export default RegistrationFeeCallout;
