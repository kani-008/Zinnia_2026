// Zinnia 2026 — Privacy policy.
//
// Exists because Google's OAuth consent screen refuses to move out of
// "Testing" without a public privacy policy URL, and a Testing-status refresh
// token dies after seven days — which would silently break payment-proof
// uploads to Drive. The content is a truthful account of what the site
// actually does with participant data, kept short enough to be read.

import React from 'react';
import { ShieldCheck } from 'lucide-react';

import { WebsiteNavbar } from '../components/layout/Navbar';
import { WebsiteFooter } from '../components/layout/Footer';
import { ComicBolt, ComicChip, ComicPanel, ComicSectionTitle } from '../components/ui/comic';

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'WHAT WE COLLECT',
    body: [
      'When you register for Zinnia 2026 we collect your name, email address, phone number, college, department and year of study, the events you choose, and your team members if you register as a team.',
      'When you pay the registration fee we collect the screenshot of your payment and the transaction reference you enter. We do not collect card numbers, UPI PINs or bank credentials.',
    ],
  },
  {
    title: 'WHY WE COLLECT IT',
    body: [
      'To confirm your registration, verify your payment, issue your event passport, contact you about schedule changes, and let coordinators check you in on the day.',
      'We do not sell your data, use it for advertising, or share it with anyone outside the organising team and the service providers listed below.',
    ],
  },
  {
    title: 'WHERE IT IS STORED',
    body: [
      'Registration details are stored in a Supabase database. Payment screenshots are stored in a private Google Drive folder owned by the organising committee and are only viewable by the treasurer through this website.',
      'Emails such as verification codes and passports are sent through our email provider. The website is hosted on Vercel.',
    ],
  },
  {
    title: 'HOW LONG WE KEEP IT',
    body: [
      'Data is kept until the end of the fest and the accounts reconciliation that follows it, after which registrations and payment proofs are deleted or anonymised.',
    ],
  },
  {
    title: 'YOUR RIGHTS',
    body: [
      'You can ask us to show you, correct, or delete the data we hold about you at any time by writing to the coordinator listed on the Contact page. Deleting your data before the event cancels your registration.',
    ],
  },
];

export const WebsitePrivacyPage: React.FC = () => (
  <div className="relative w-full min-h-screen bg-[#08090A] text-[#EEEEEA] flex flex-col justify-between p-3 sm:p-5 md:p-6 scroll-smooth">
    <WebsiteNavbar />

    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-[0.07] bg-halftone-dots-cyan"
      aria-hidden="true"
    />

    <main className="relative z-20 max-w-3xl mx-auto w-full pt-10 sm:pt-14 pb-16 px-2 sm:px-4 flex-1">
      <div className="text-center space-y-3 mb-10 sm:mb-12">
        <div className="flex justify-center">
          <ComicChip tone="cyan" rotate={-2}>
            <ComicBolt tone="cyan" className="w-3 h-3" /> Your data, plainly
          </ComicChip>
        </div>

        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl uppercase tracking-tight text-[#EEEEEA] text-stroke-comic-sm">
          PRIVACY <span className="text-[#0FA9C6]">POLICY</span>
        </h1>

        <p className="font-mono text-xs sm:text-sm text-[#B8B8B2] max-w-xl mx-auto leading-relaxed">
          What Zinnia 2026, Government College of Engineering, Erode, does with the information you
          give us when you register and pay.
        </p>
      </div>

      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <ComicPanel key={section.title} tone="cyan">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 border-2 border-[#0FA9C6] bg-[#111214] text-[#0FA9C6] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <ComicSectionTitle tone="cyan">{section.title}</ComicSectionTitle>
            </div>
            <div className="space-y-3">
              {section.body.map((paragraph) => (
                <p key={paragraph} className="font-mono text-xs sm:text-sm text-[#D6D6D0] leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </ComicPanel>
        ))}
      </div>

      <p className="font-mono text-[11px] text-[#7A7A75] text-center mt-10">
        Last updated 8 September 2026.
      </p>
    </main>

    <WebsiteFooter />
  </div>
);
