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
import { Loader2, UserPlus, Utensils } from 'lucide-react';

import { WebsiteNavbar } from '../components/layout/Navbar';
import { REGISTRATION_STEPS } from '../config/site';
import { registerParticipant } from '../lib/participant/api';
import type { FoodPreference, ParticipantDetails } from '../lib/participant/types';
import {
  ComicAlert,
  ComicCTA,
  ComicChip,
  ComicChoice,
  ComicField,
  ComicHeading,
  ComicInput,
  ComicPageShell,
  ComicPanel,
  ComicSelect,
  ComicStepper,
} from '../components/ui/comic';

const YEARS = ['I', 'II', 'III', 'IV'] as const;

// Colour-coded with the site's technical / non-technical accents rather than a
// separate green/red food palette: cyan for Veg, pink for Non-Veg.
const FOOD_OPTIONS: Array<{
  value: FoodPreference;
  label: string;
  hint: string;
  tone: 'cyan' | 'pink';
}> = [
  { value: 'VEG', label: 'Veg', hint: 'Vegetarian meal', tone: 'cyan' },
  { value: 'NON_VEG', label: 'Non-Veg', hint: 'Non-vegetarian meal', tone: 'pink' },
];

const EMPTY: ParticipantDetails = {
  name: '',
  college: '',
  department: '',
  year: 'III',
  email: '',
  phone: '',
  food_preference: 'VEG',
};

export const ParticipantRegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<ParticipantDetails>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const set = <K extends keyof ParticipantDetails>(key: K, value: ParticipantDetails[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldError === key) setFieldError(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    setFieldError(null);

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
      setError(result.message);
      if (result.field) setFieldError(result.field);
      return;
    }

    // The server hands back only an internal registration_id. The participant
    // code is issued to them after payment verification, never here.
    navigate(`/participant/verify?rid=${encodeURIComponent(result.registration_id)}`);
  };

  return (
    <ComicPageShell>
      <WebsiteNavbar />

      <main className="mx-auto max-w-2xl px-5 pb-24 pt-28">
        <header className="mb-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <ComicChip tone="cyan" rotate={-2}>
              <UserPlus size={12} /> Step 1 of 4
            </ComicChip>
            <ComicChip tone="yellow" rotate={1.5}>
              Slots filling fast
            </ComicChip>
          </div>

          <ComicHeading>Register for Zinnia 2026</ComicHeading>

          <p className="mt-4 font-mono text-xs leading-relaxed text-[#B8B8B2] sm:text-sm">
            One registration per person. We email a code to confirm your address, you pay the
            fee, and once the treasurer verifies it you receive your registration code and master
            QR — then you pick your events.
          </p>

          <ComicStepper
            steps={REGISTRATION_STEPS}
            current={1}
            className="mt-6"
          />
        </header>

        {error && <ComicAlert tone="pink" className="mb-6">{error}</ComicAlert>}

        <form onSubmit={onSubmit}>
          <ComicPanel tone="cyan" bodyClassName="space-y-6">
            <ComicField label="Full name" htmlFor="name">
              <ComicInput
                id="name"
                invalid={fieldError === 'name'}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="As it should appear on your pass"
                autoComplete="name"
                required
              />
            </ComicField>

            <ComicField label="College" htmlFor="college">
              <ComicInput
                id="college"
                invalid={fieldError === 'college'}
                value={form.college}
                onChange={(e) => set('college', e.target.value)}
                placeholder="Government College of Engineering, Erode"
                required
              />
            </ComicField>

            <div className="grid gap-6 sm:grid-cols-2">
              <ComicField label="Department" htmlFor="department">
                <ComicInput
                  id="department"
                  invalid={fieldError === 'department'}
                  value={form.department}
                  onChange={(e) => set('department', e.target.value)}
                  placeholder="CSE"
                  required
                />
              </ComicField>

              <ComicField label="Year" htmlFor="year">
                <ComicSelect
                  id="year"
                  invalid={fieldError === 'year'}
                  value={form.year}
                  onChange={(e) => set('year', e.target.value)}
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y} className="bg-[#111214] text-[#EEEEEA]">
                      {y}
                    </option>
                  ))}
                </ComicSelect>
              </ComicField>
            </div>

            <ComicField
              label="Email"
              htmlFor="email"
              hint="Your verification code, registration code and pass all go here. Use an address you can actually open."
            >
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

            <ComicField label="Phone" htmlFor="phone">
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

            <fieldset>
              <legend className="mb-2 flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#B8B8B2]">
                <Utensils size={12} /> Food preference
              </legend>

              <div className="grid grid-cols-2 gap-4">
                {FOOD_OPTIONS.map((option) => (
                  <ComicChoice
                    key={option.value}
                    selected={form.food_preference === option.value}
                    onClick={() => set('food_preference', option.value)}
                    label={option.label}
                    hint={option.hint}
                    tone={option.tone}
                  />
                ))}
              </div>

              <p className="mt-3 font-mono text-[11px] leading-relaxed text-[#71767B]">
                This is printed on your pass and used for the food counter on the day. Tell a
                coordinator if it changes.
              </p>
            </fieldset>
          </ComicPanel>

          <div className="mt-7">
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
