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
import { BookOpen, ExternalLink, Loader2, Utensils } from 'lucide-react';

import { WebsiteNavbar } from '../components/layout/Navbar';
import { REGISTRATION_STEPS, REGISTRATION_USER_MANUAL_URL } from '../config/site';
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

import { VegNonVegToggle } from '../components/ui/VegNonVegToggle';

const YEARS = ['I', 'II', 'III', 'IV'] as const;

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
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <ComicHeading fluid>Register for Zinnia&rsquo;26</ComicHeading>
            <a
              href={REGISTRATION_USER_MANUAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-lg border border-[#E5BD00]/50 bg-[#E5BD00]/10 hover:bg-[#E5BD00]/20 text-[#E5BD00] font-mono text-xs font-bold tracking-wider uppercase transition-all duration-200 hover:scale-[1.02] shadow-[2px_2px_0px_#090A0B]"
            >
              <BookOpen size={14} className="shrink-0" />
              <span>User Manual</span>
              <ExternalLink size={12} className="shrink-0 opacity-80" />
            </a>
          </div>

          <ComicStepper
            steps={REGISTRATION_STEPS}
            current={1}
            className="mt-6"
          />
        </header>

        {/* User Manual Guidance Banner */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#111214] border border-[#0FA9C6]/30 shadow-[3px_3px_0px_#090A0B]">
          <div className="flex items-center gap-2.5 text-xs font-mono text-[#B8B8B2]">
            <BookOpen size={15} className="text-[#0FA9C6] shrink-0" />
            <span>Need help with registration? View the step-by-step user manual.</span>
          </div>
          <a
            href={REGISTRATION_USER_MANUAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#0FA9C6] hover:text-[#EEEEEA] transition-colors uppercase tracking-wider"
          >
            <span>Open Guide</span>
            <ExternalLink size={12} />
          </a>
        </div>

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

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <span className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#B8B8B2]">
                <Utensils size={14} className="text-[#0FA9C6]" /> Food preference
              </span>
              <VegNonVegToggle
                value={form.food_preference}
                onChange={(val) => set('food_preference', val)}
              />
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
