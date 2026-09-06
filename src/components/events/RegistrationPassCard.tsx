import React from 'react';
import { BadgeIndianRupee, Users, Zap } from 'lucide-react';

import { REGISTRATION_FEE_PER_HEAD } from '../../config/site';
import { DEFAULT_CONFIG } from '../../lib/rules/catalog';

/**
 * Registration pricing, sourced from configuration rather than typed in here.
 *
 * The site has ONE pass: a flat fee per participant (D6) that covers up to
 * `maxCountedEvents` counted events — technical or non-technical, mixed freely.
 * Paper Presentation and Short Film do not count toward that ceiling. Team
 * events are paid per member. Those are the rules the backend actually
 * enforces, so that is what is shown; there are no combo tiers.
 */
export const RegistrationPassCard: React.FC = () => {
  const fee = REGISTRATION_FEE_PER_HEAD;
  const max = DEFAULT_CONFIG.maxCountedEvents;

  return (
    <section
      aria-label="Registration pass"
      className="p-5 sm:p-6 bg-[#1A1A1D] border-[3px] border-[#F5D90A]/70 shadow-[4.5px_4.5px_0px_#000000] rounded-xl"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-5">
        <div className="flex items-start gap-3 md:w-1/3">
          <div className="p-2 bg-[#2A2609] border border-[#F5D90A]/50 rounded-lg text-[#F5D90A] shrink-0">
            <BadgeIndianRupee className="w-5 h-5" />
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#A8A8AC]">
              Registration pass
            </div>
            <div className="font-display text-3xl text-white leading-none mt-1">
              ₹{fee}
              <span className="font-mono text-xs text-[#A8A8AC] ml-2">per participant</span>
            </div>
          </div>
        </div>

        <ul className="grid sm:grid-cols-3 gap-3 md:flex-1 font-mono text-xs text-[#D0D0D4]">
          <li className="flex items-start gap-2 p-3 bg-[#222228] border border-[#3A3A40] rounded-lg">
            <Zap className="w-4 h-4 text-[#3CE7FF] shrink-0 mt-0.5" />
            <span>
              Up to <strong className="text-white">{max} counted events</strong> — technical or
              non-technical, mixed freely.
            </span>
          </li>
          <li className="flex items-start gap-2 p-3 bg-[#222228] border border-[#3A3A40] rounded-lg">
            <Zap className="w-4 h-4 text-[#FF3366] shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Paper Presentation</strong> and{' '}
              <strong className="text-white">Short Film</strong> don&apos;t use up a slot.
            </span>
          </li>
          <li className="flex items-start gap-2 p-3 bg-[#222228] border border-[#3A3A40] rounded-lg">
            <Users className="w-4 h-4 text-[#F5D90A] shrink-0 mt-0.5" />
            <span>
              Team events: <strong className="text-white">every member registers</strong> and pays
              the same fee.
            </span>
          </li>
        </ul>
      </div>

      <p className="mt-4 font-mono text-[11px] text-[#A8A8AC] leading-relaxed">
        One pass covers your whole day. Your event slots open in the dashboard once the treasurer
        confirms your payment.
      </p>
    </section>
  );
};

export default RegistrationPassCard;
