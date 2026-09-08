import React from 'react';
import { Ticket } from 'lucide-react';

import { ON_SPOT_REGISTRATION_FEE, REGISTRATION_FEE_PER_HEAD } from '../../config/site';

/**
 * Online vs on-the-spot fee, shown right under the hero's REGISTER button.
 *
 * Same sticker vocabulary as the "TIMELINE MONITORED" callout beside it —
 * #111214 fill, yellow #E5BD00 ink, offset shadow, slight tilt, .sticker-pop —
 * so it reads as part of the hero rather than a banner bolted on. Both figures
 * come from config; nothing is typed in here.
 */
export const RegistrationFeeCallout: React.FC<{ className?: string }> = ({ className = '' }) => {
  const saving = ON_SPOT_REGISTRATION_FEE - REGISTRATION_FEE_PER_HEAD;

  return (
    <div className={`flex justify-center ${className}`}>
      <div className="inline-flex flex-col items-center gap-1 px-4 py-2 bg-[#111214] border-[2px] border-[#E5BD00] shadow-[3px_3px_0px_#090A0B] -rotate-1 sticker-pop text-center max-w-full">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-xs sm:text-sm uppercase tracking-wider font-bold">
          <span className="inline-flex items-center gap-1.5 text-[#0FA9C6]">
            <Ticket size={13} /> Online ₹{REGISTRATION_FEE_PER_HEAD}
          </span>
          <span className="text-[#71767B]">•</span>
          <span className="text-[#E5BD00]">On-the-spot ₹{ON_SPOT_REGISTRATION_FEE}</span>
        </div>
        <p className="font-mono text-[10px] sm:text-[11px] text-[#B8B8B2] leading-snug">
          Register online and save ₹{saving} — on-the-spot registration is available at the venue on
          the event day, subject to remaining seats.
        </p>
      </div>
    </div>
  );
};

export default RegistrationFeeCallout;
