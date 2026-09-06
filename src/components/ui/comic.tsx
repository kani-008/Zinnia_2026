// Zinnia 2026 — comic design-system primitives for the participant flow.
//
// Every component here is a thin wrapper over classes that ALREADY exist in
// index.css and are already worn by the homepage:
//   .comic-frame-box + <ComicFrame/>   -> the sketchy double-outline event-card ink
//   .comic-cta-wrapper/-back/-front    -> the "REGISTER FOR ZINNIA →" skewed CTA
//   .sticker-pop                       -> the tactile rotated sticker hover
//   .font-display / .font-comic        -> Luckiest Guy / Bangers
//
// No new colours are invented. The palette is read straight off the hero and
// the event cards: cyan #0FA9C6 (technical / primary), pink #D51F55 (non-tech /
// error), yellow #E5BD00 (badges / warnings), ink #090A0B, paper #EEEEEA.
//
// Tone -> frame variant mapping reuses .tech / .non-tech / .special, which are
// the same custom-property switches the Events section uses.

import React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { ComicFrame } from './ComicFrame';

export type Tone = 'cyan' | 'pink' | 'yellow';

/** The three accent hexes, straight from .comic-card-wrapper in index.css. */
export const TONE_HEX: Record<Tone, string> = {
  cyan: '#0FA9C6',
  pink: '#D51F55',
  yellow: '#E5BD00',
};

/** .comic-frame-box variant that carries each tone's --card-* vars. */
const FRAME_VARIANT: Record<Tone, string> = {
  cyan: 'tech',
  pink: 'non-tech',
  yellow: 'special',
};

// Tailwind's scanner only sees literal class strings, so every tone variant is
// spelled out in full rather than interpolated.
const BORDER: Record<Tone, string> = {
  cyan: 'border-[#0FA9C6]',
  pink: 'border-[#D51F55]',
  yellow: 'border-[#E5BD00]',
};

const TEXT: Record<Tone, string> = {
  cyan: 'text-[#0FA9C6]',
  pink: 'text-[#D51F55]',
  yellow: 'text-[#E5BD00]',
};

const FILL: Record<Tone, string> = {
  cyan: 'bg-[#0FA9C6]',
  pink: 'bg-[#D51F55]',
  yellow: 'bg-[#E5BD00]',
};

/* ==========================================================================
   PANEL — any box wearing the event-card ink
   ========================================================================== */

export interface ComicPanelProps {
  tone?: Tone;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}

export const ComicPanel: React.FC<ComicPanelProps> = ({
  tone = 'cyan',
  className = '',
  bodyClassName = '',
  children,
}) => (
  // comic-frame-fluid pins the ink's stroke width so a tall panel's border
  // stays even (see index.css) — the event cards keep their original scaling.
  <div className={`comic-frame-box comic-frame-fluid ${FRAME_VARIANT[tone]} relative ${className}`}>
    <ComicFrame />
    {/* .pad-panel, not a flat p-*: the frame's ink sits at a percentage of the
        panel width, so the inset has to scale with it (see index.css). */}
    <div className={`relative z-10 pad-panel ${bodyClassName}`}>{children}</div>
  </div>
);

/* ==========================================================================
   CHIP — the rotated sticker badge ("9 ACTIVE EVENTS", "STEP 2 OF 3")
   ========================================================================== */

export interface ComicChipProps {
  tone?: Tone;
  /** degrees; the homepage callouts sit between -2 and +2 */
  rotate?: number;
  className?: string;
  children: React.ReactNode;
}

export const ComicChip: React.FC<ComicChipProps> = ({
  tone = 'yellow',
  rotate = -1.5,
  className = '',
  children,
}) => (
  <span
    // .sticker-pop:hover sets transform with !important, so this inline
    // rotation is the resting state and the pop still wins on hover.
    style={{ transform: `rotate(${rotate}deg)` }}
    className={`inline-flex items-center gap-1.5 bg-[#111214] border-2 ${BORDER[tone]} ${TEXT[tone]} px-3 py-1 shadow-[2.5px_2.5px_0px_#090A0B] sticker-pop font-comic text-[10px] sm:text-xs font-bold uppercase tracking-wider ${className}`}
  >
    {children}
  </span>
);

/* ==========================================================================
   HEADING — display type with the comic ink stroke
   ========================================================================== */

export const ComicHeading: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = '',
  children,
}) => (
  <h1
    className={`font-display uppercase text-[#EEEEEA] text-stroke-comic-sm leading-[0.95] text-3xl sm:text-4xl md:text-5xl ${className}`}
  >
    {children}
  </h1>
);

export const ComicSectionTitle: React.FC<{
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}> = ({ tone = 'cyan', className = '', children }) => (
  <h2 className={`font-comic uppercase tracking-wider text-lg sm:text-xl ${TEXT[tone]} ${className}`}>
    {children}
  </h2>
);

/* ==========================================================================
   LIGHTNING — the existing hero accent mark, reused as a heading flourish
   ========================================================================== */

export const ComicBolt: React.FC<{ tone?: Tone; className?: string }> = ({
  tone = 'yellow',
  className = 'w-4 h-4',
}) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} shrink-0`}
    fill={TONE_HEX[tone]}
    aria-hidden="true"
  >
    <path
      d="M13 2 L4 14 h6 l-1 8 9-12 h-6 z"
      stroke="#090A0B"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);

/* ==========================================================================
   FIELD — label + control + hint/error, in the techy label font
   ========================================================================== */

export interface ComicFieldProps {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  /** when set the control turns pink and the message replaces the hint */
  error?: string | null;
  className?: string;
  children: React.ReactNode;
}

export const ComicField: React.FC<ComicFieldProps> = ({
  label,
  htmlFor,
  hint,
  error,
  className = '',
  children,
}) => (
  <div className={className}>
    <label
      htmlFor={htmlFor}
      className="mb-2 flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#B8B8B2]"
    >
      {label}
    </label>
    {children}
    {/* Helper/error text sits clear of the control's border, never against it. */}
    {error ? (
      <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-wide text-[#D51F55]">
        {error}
      </p>
    ) : hint ? (
      <p className="mt-2 font-mono text-[11px] leading-relaxed text-[#71767B]">{hint}</p>
    ) : null}
  </div>
);

/* ==========================================================================
   INPUT / SELECT — dark fill, cyan focus ring, pink invalid
   ========================================================================== */

/**
 * Shared control skin — deliberately plain.
 *
 * The sketchy double-outline and the offset drop shadow belong to the OUTER
 * panel and the buttons. A control sitting inside a <ComicPanel> repeating
 * either one reads as a box inside a box, so this is a single hairline border
 * that simply goes full cyan on focus. `invalid` flips it to the pink tone.
 */
export const controlClass = (invalid = false) =>
  [
    // Pill/stadium shape. The extra horizontal padding is not cosmetic — at
    // rounded-full the curve eats into the corners, so text needs to start
    // further in than it would in a rectangle.
    'w-full bg-[#111214] px-4 sm:px-5 py-2.5 sm:py-3 rounded-full',
    'font-mono text-xs sm:text-sm text-[#EEEEEA] placeholder-[#71767B]',
    'border outline-none transition-colors duration-150',
    invalid
      ? 'border-[#D51F55] focus:border-[#D51F55]'
      : 'border-[#0FA9C6]/20 hover:border-[#0FA9C6]/40 focus:border-[#0FA9C6]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' ');

// React 19 passes `ref` through as an ordinary prop for function components,
// so it just needs to be declared here for TypeScript's benefit (the OTP field
// on the login screen focuses itself).
export type ComicInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
  ref?: React.Ref<HTMLInputElement>;
};

export const ComicInput: React.FC<ComicInputProps> = ({ invalid, className = '', ...props }) => (
  <input {...props} className={`${controlClass(invalid)} ${className}`} />
);

export type ComicSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean };

export const ComicSelect: React.FC<ComicSelectProps> = ({
  invalid,
  className = '',
  children,
  ...props
}) => (
  // appearance-none strips the native arrow, so one is drawn back in — a select
  // with no affordance reads as a disabled text field.
  <div className="relative">
    <select
      {...props}
      className={`${controlClass(invalid)} appearance-none cursor-pointer pr-11 ${className}`}
    >
      {children}
    </select>
    <ChevronDown
      size={16}
      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#71767B]"
      aria-hidden="true"
    />
  </div>
);

/* ==========================================================================
   CHOICE — the sketchy selectable tile (food preference, yes/no options)
   ========================================================================== */

export interface ComicChoiceProps {
  selected: boolean;
  onClick: () => void;
  label: React.ReactNode;
  hint?: React.ReactNode;
  /**
   * Accent for the SELECTED fill only. Uses the same technical / non-technical
   * split as the event cards, so cyan and pink mean the same thing everywhere.
   * The unselected state is deliberately identical across tones.
   */
  tone?: Exclude<Tone, 'yellow'>;
  disabled?: boolean;
  className?: string;
}

/**
 * Both states share one skeleton — same border width, same padding, same
 * height, and the checkmark slot is always rendered (invisible when unselected)
 * so selecting an option cannot shift the layout. Only the fill and the text
 * colour change.
 *
 * Text on the selected fill flips with the accent for contrast: dark ink reads
 * on cyan (~7.5:1) but not on pink (~3.4:1), so pink carries light text
 * (~4.9:1) instead. Same reasoning as .comic-cta-front.tone-pink in index.css.
 */
const SELECTED_FILL: Record<Exclude<Tone, 'yellow'>, string> = {
  cyan: 'border-[#0FA9C6] bg-[#0FA9C6]',
  pink: 'border-[#D51F55] bg-[#D51F55]',
};

const SELECTED_TEXT: Record<Exclude<Tone, 'yellow'>, string> = {
  cyan: 'text-[#090A0B]',
  pink: 'text-[#EEEEEA]',
};

const SELECTED_HINT: Record<Exclude<Tone, 'yellow'>, string> = {
  cyan: 'text-[#090A0B]/70',
  pink: 'text-[#EEEEEA]/80',
};

export const ComicChoice: React.FC<ComicChoiceProps> = ({
  selected,
  onClick,
  label,
  hint,
  tone = 'cyan',
  disabled,
  className = '',
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={selected}
    className={`flex w-full items-center justify-between gap-2.5 sm:gap-3 px-3.5 sm:px-5 py-2.5 sm:py-3 text-left border rounded-full transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
      selected ? SELECTED_FILL[tone] : 'border-[#0FA9C6]/20 bg-[#111214] hover:border-[#0FA9C6]/40'
    } ${className}`}
  >
    <span className="min-w-0">
      <span
        className={`block font-comic text-sm uppercase tracking-wide ${
          selected ? SELECTED_TEXT[tone] : 'text-[#EEEEEA]'
        }`}
      >
        {label}
      </span>
      {hint && (
        <span
          className={`mt-0.5 block font-mono text-[10px] ${
            selected ? SELECTED_HINT[tone] : 'text-[#71767B]'
          }`}
        >
          {hint}
        </span>
      )}
    </span>

    {/* Always occupies space; only its visibility changes. */}
    <Check
      size={16}
      strokeWidth={3}
      className={`shrink-0 ${selected ? `${SELECTED_TEXT[tone]} opacity-100` : 'opacity-0'}`}
      aria-hidden="true"
    />
  </button>
);

/* ==========================================================================
   CTA — the homepage register button, with the arrow suffix
   ========================================================================== */

export interface ComicCTAProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  /** renders the → glyph the homepage CTA uses */
  arrow?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const ComicCTA: React.FC<ComicCTAProps> = ({
  tone = 'cyan',
  arrow = true,
  fullWidth = true,
  className = '',
  disabled,
  children,
  ...props
}) => (
  <div
    className={`comic-cta-wrapper group pr-2 ${fullWidth ? 'w-full block' : 'w-auto'} ${
      disabled ? 'opacity-50 pointer-events-none' : ''
    }`}
  >
    <span className="comic-cta-back" />
    <button
      {...props}
      disabled={disabled}
      className={`comic-cta-front tone-${tone} px-5 sm:px-6 py-3.5 flex items-center justify-center gap-2.5 sm:gap-3 w-full ${className}`}
    >
      <span className="font-comic font-black text-base sm:text-lg tracking-wider uppercase italic">
        {children}
      </span>
      {arrow && (
        <svg
          viewBox="0 0 32 20"
          className="w-6 h-4 stroke-current fill-none shrink-0 group-hover:translate-x-1.5 transition-transform duration-150"
        >
          <path d="M 3 10 L 25 10" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M 16 3 L 27 10 L 16 17" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  </div>
);

/** Quieter secondary action — outline only, no skew. */
export const ComicGhostButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }
> = ({ tone = 'cyan', className = '', children, ...props }) => (
  <button
    {...props}
    className={`px-4 py-2 border-2 ${BORDER[tone]} ${TEXT[tone]} bg-transparent font-comic text-xs uppercase tracking-wider shadow-[3px_3px_0px_#090A0B] btn-comic hover:bg-[#111214] disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${className}`}
  >
    {children}
  </button>
);

/* ==========================================================================
   ALERT — error (pink) / notice (yellow) / ok (cyan) callout
   ========================================================================== */

export const ComicAlert: React.FC<{
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}> = ({ tone = 'pink', className = '', children }) => (
  <div
    className={`flex items-start gap-3 border-2 ${BORDER[tone]} bg-[#111214] px-4 py-3 shadow-[4px_4px_0px_#090A0B] ${className}`}
  >
    <ComicBolt tone={tone} className="w-4 h-4 mt-0.5" />
    <div className={`font-mono text-xs leading-relaxed ${TEXT[tone]}`}>{children}</div>
  </div>
);

/* ==========================================================================
   STEPPER — numbered sticky-note tags, mirroring the event-card number holder
   ========================================================================== */

export interface ComicStepperProps {
  steps: string[];
  /** 1-based */
  current: number;
  className?: string;
}

export const ComicStepper: React.FC<ComicStepperProps> = ({ steps, current, className = '' }) => (
  <ol className={`flex flex-wrap items-center gap-x-2 gap-y-3 ${className}`}>
    {steps.map((label, i) => {
      const n = i + 1;
      const done = n < current;
      const active = n === current;
      const tone: Tone = active ? 'cyan' : 'yellow';

      return (
        <li key={label} className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            {/* sticky-note number tag */}
            <span
              style={{ transform: `rotate(${i % 2 === 0 ? -4 : 3}deg)` }}
              className={`grid place-items-center w-8 h-8 border-2 border-[#090A0B] shadow-[2.5px_2.5px_0px_#090A0B] font-comic text-sm font-black sticker-pop ${
                active || done ? `${FILL[tone]} text-[#090A0B]` : 'bg-[#23262D] text-[#71767B]'
              }`}
            >
              {done ? '✓' : n}
            </span>
            <span
              className={`font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] ${
                active ? 'text-[#EEEEEA]' : 'text-[#71767B]'
              }`}
            >
              {label}
            </span>
          </div>

          {n < steps.length && (
            <svg
              viewBox="0 0 40 8"
              className="w-6 sm:w-8 h-2 stroke-[#3A3F4A] fill-none"
              aria-hidden="true"
            >
              <path d="M 2 4 Q 20 1 38 4" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          )}
        </li>
      );
    })}
  </ol>
);

/* ==========================================================================
   PAGE SHELL — near-black background + halftone wash, never a white section
   ========================================================================== */

export const ComicPageShell: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = '',
  children,
}) => (
  <div className={`min-h-screen bg-[#08090A] relative w-full max-w-full overflow-x-hidden ${className}`}>
    {/* halftone dot cluster, same utility the homepage sections use */}
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-[0.07] bg-halftone-dots-cyan"
      aria-hidden="true"
    />
    <div className="relative z-10 w-full max-w-full">{children}</div>
  </div>
);
