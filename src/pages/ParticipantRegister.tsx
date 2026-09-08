// Zinnia 2026 — Phase 3: participant personal-details form (§4.1 stage 1)
//
// One participant, one payment, one UserID (D6). This form does NOT pick
// events — that moves to the dashboard in Phase 4, which is the whole point of
// splitting registration from event selection.
//
// Styling note: this page wears the homepage comic system (see
// components/ui/comic.tsx). Submit/validation logic below is unchanged.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Utensils } from 'lucide-react';

import { WebsiteNavbar } from '../components/layout/Navbar';
import { REGISTRATION_STEPS } from '../config/site';
import { registerParticipant } from '../lib/participant/api';
import { readRegistrationDraft, saveRegistrationDraft } from '../lib/participant/draft';
import type { ParticipantDetails } from '../lib/participant/types';
import {
  ComicCTA,
  ComicField,
  ComicHeading,
  ComicInput,
  ComicPageShell,
  ComicPanel,
  ComicSelect,
  ComicStepper,
} from '../components/ui/comic';
import { useToastOn } from '../components/ui/toast';

const YEARS = ['I', 'II', 'III', 'IV'] as const;

/** Food toggle: 7.5rem track − 4px borders − 0.25rem gap each end − 1.75rem knob. */
const KNOB_TRAVEL = '5rem';

/**
 * The Indian packaged-food veg / non-veg mark: a filled dot or triangle inside
 * a square outline.
 *
 * Drawn inline rather than taken from lucide, which does not carry it — and it
 * is worth carrying, because it is the one food symbol every participant can
 * read without the word next to it. This is also why the toggle uses the
 * mark's own green and red instead of the site's cyan/pink accents.
 */
const FoodMark: React.FC<{ veg: boolean; className?: string }> = ({ veg, className = '' }) => (
  <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
    <rect
      x="1.5"
      y="1.5"
      width="17"
      height="17"
      fill="none"
      strokeWidth="2"
      stroke={veg ? '#1DB954' : '#D51F55'}
    />
    {veg ? (
      <circle cx="10" cy="10" r="4.5" fill="#1DB954" />
    ) : (
      <path d="M10 5 L15 14.5 H5 Z" fill="#D51F55" />
    )}
  </svg>
);

const EMPTY: ParticipantDetails = {
  name: '',
  college: '',
  department: '',
  year: '',
  email: '',
  phone: '',
  food_preference: 'VEG',
};

export const ParticipantRegisterPage: React.FC = () => {
  const navigate = useNavigate();

  // Restored from the draft when someone came back here from the verify screen
  // to fix their email; EMPTY on a first visit.
  const [form, setForm] = useState<ParticipantDetails>(() => ({ ...EMPTY, ...readRegistrationDraft() }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Failures surface as a slide-in toast rather than a box above the form,
  // which on a phone appeared off-screen above the button just pressed.
  useToastOn(error);
  const [fieldError, setFieldError] = useState<string | null>(null);
  // The server names the offending field AND explains it. Keeping only the
  // field key turned the control pink but left the generic hint underneath,
  // so "this email is already registered" never reached the person reading it.
  const [fieldMessage, setFieldMessage] = useState<string | null>(null);

  /** The message for one field, or null when the error belongs elsewhere. */
  const errorFor = (key: string) => (fieldError === key ? fieldMessage : null);

  const isVeg = form.food_preference === 'VEG';

  const set = <K extends keyof ParticipantDetails>(key: K, value: ParticipantDetails[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldError === key) {
      setFieldError(null);
      setFieldMessage(null);
      setError(null);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    setFieldError(null);
    setFieldMessage(null);

    const result = await registerParticipant({
      ...form,
      name: form.name.trim(),
      college: form.college.trim(),
      department: form.department.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.replace(/\D/g, ''),
    });

    setSubmitting(false);

    if (!result.success) {
      if (result.field) {
        setFieldError(result.field);
        setFieldMessage(result.message);
        // Shown against the field, so the banner would just repeat it.
        document.getElementById(result.field)?.focus();
      } else {
        setError(result.message);
      }
      return;
    }

    // Parked so the verify screen's "change email address" link can bring these
    // details back rather than dropping the person onto an empty form. Cleared
    // once the email is verified.
    saveRegistrationDraft(form);

    // The server hands back only an internal registration_id. The participant
    // code is issued to them after payment verification, never here.
    //
    // codeSent tells the verify screen a code is already on its way. Without
    // it that screen requests one on mount, so registering sent two emails and
    // the code in the first was already dead on arrival.
    navigate(`/participant/verify?rid=${encodeURIComponent(result.registration_id)}`, {
      state: { codeSent: true, emailHint: result.email_hint },
    });
  };

  return (
    <ComicPageShell>
      <WebsiteNavbar />

      <main className="mx-auto max-w-2xl w-full px-5 sm:px-8 pb-24 pt-6 sm:pt-10 overflow-hidden">
        <header className="mb-8">
          <ComicHeading fluid>Register for Zinnia&rsquo;26</ComicHeading>

          <ComicStepper
            steps={REGISTRATION_STEPS}
            current={1}
            className="mt-6"
          />
        </header>

        <form onSubmit={onSubmit}>
          <ComicPanel tone="cyan" bodyClassName="space-y-6">
            <ComicField label="Full name" htmlFor="name" error={errorFor('name')}>
              <ComicInput
                id="name"
                invalid={fieldError === 'name'}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Name on your pass"
                autoComplete="name"
                required
              />
            </ComicField>

            <ComicField label="College" htmlFor="college" error={errorFor('college')}>
              <ComicInput
                id="college"
                invalid={fieldError === 'college'}
                value={form.college}
                onChange={(e) => set('college', e.target.value)}
                placeholder="College / Institution name"
                required
              />
            </ComicField>

            <div className="grid gap-6 sm:grid-cols-2">
              <ComicField label="Department" htmlFor="department" error={errorFor('department')}>
                <ComicInput
                  id="department"
                  invalid={fieldError === 'department'}
                  value={form.department}
                  onChange={(e) => set('department', e.target.value)}
                  placeholder="e.g. CSE"
                  required
                />
              </ComicField>

              <ComicField label="Year" htmlFor="year" error={errorFor('year')}>
                <ComicSelect
                  id="year"
                  required
                  invalid={fieldError === 'year'}
                  value={form.year}
                  onChange={(e) => set('year', e.target.value)}
                >
                  {/* Starts unset. Pre-selecting a year silently registered
                      anyone who skipped the field as that year. */}
                  <option value="" disabled className="bg-[#111214] text-[#71767B]">
                    Year
                  </option>
                  {YEARS.map((y) => (
                    <option key={y} value={y} className="bg-[#111214] text-[#EEEEEA]">
                      {y}
                    </option>
                  ))}
                </ComicSelect>
              </ComicField>
            </div>

            <ComicField label="Email" htmlFor="email" error={errorFor('email')}>
              <ComicInput
                id="email"
                type="email"
                invalid={fieldError === 'email'}
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </ComicField>

            <ComicField label="Phone" htmlFor="phone" error={errorFor('phone')}>
              <ComicInput
                id="phone"
                inputMode="numeric"
                invalid={fieldError === 'phone'}
                value={form.phone}
                onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                autoComplete="tel"
                required
              />
            </ComicField>

            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#B8B8B2]">
                <Utensils size={12} /> Food preference
              </span>

              <button
                type="button"
                onClick={() => set('food_preference', isVeg ? 'NON_VEG' : 'VEG')}
                aria-label={`Food preference: ${
                  isVeg ? 'vegetarian' : 'non-vegetarian'
                }. Activate to switch to ${isVeg ? 'non-vegetarian' : 'vegetarian'}.`}
                className={`relative h-9 w-[7rem] shrink-0 border-2 border-[#090A0B] shadow-[3px_3px_0px_#090A0B] transition-colors duration-200 ${
                  isVeg ? 'bg-[#1DB954]/15' : 'bg-[#D51F55]/15'
                }`}
              >
                {/* The label sits opposite the knob, so the control reads as a
                    track with the mark travelling along it. */}
                <span
                  className={`pointer-events-none absolute top-1/2 -translate-y-1/2 font-mono text-[11px] font-bold uppercase tracking-wider ${
                    isVeg ? 'right-2.5 text-[#1DB954]' : 'left-2.5 text-[#D51F55]'
                  }`}
                >
                  {isVeg ? 'Veg' : 'Non-Veg'}
                </span>

                {/* Both axes are set in one inline `translate`. Tailwind's
                    translate-x-* utility and the -50% that centres the knob
                    vertically write the same property, so as classes they
                    cancel rather than compose — the knob stayed put on the
                    left. KNOB_TRAVEL is the track minus its borders, the gap
                    at each end, and the knob itself. */}
                <span
                  style={{ translate: isVeg ? '0 -50%' : `${KNOB_TRAVEL} -50%` }}
                  className={`absolute left-1 top-1/2 grid h-7 w-7 place-items-center border-2 bg-[#111214] transition-[translate,border-color] duration-200 ${
                    isVeg ? 'border-[#1DB954]' : 'border-[#D51F55]'
                  }`}
                >
                  <FoodMark veg={isVeg} className="h-4 w-4" />
                </span>
              </button>
            </div>
          </ComicPanel>

          <div className="mt-7 pr-2">
            <ComicCTA type="submit" tone="cyan" disabled={submitting} arrow={!submitting}>
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Creating your registration…
                </span>
              ) : (
                'Continue to payment'
              )}
            </ComicCTA>
          </div>
        </form>
      </main>
    </ComicPageShell>
  );
};

export default ParticipantRegisterPage;
