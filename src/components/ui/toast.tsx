// Zinnia 2026 — transient notifications.
//
// Replaces the inline <ComicAlert> that used to sit above each form. That box
// pushed the whole page down when it appeared, and on a phone it often landed
// above the fold while the button the participant had just pressed was below
// it — so a failed submit looked like nothing had happened at all. A toast
// stays in view, does not move the layout, and leaves on its own.
//
// Deliberately NOT a React context: errors are raised from callbacks, effects
// and api helpers alike, and threading a provider through all of them would be
// a lot of churn for a notification. A module-level store is subscribed to by
// the one <ComicToaster /> mounted in App.
//
// What this is NOT for: anything the participant may need to re-read later, or
// the only content on a dead-end screen. Those stay as panels — a message that
// erases itself is the wrong place for information someone has to act on.

import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastKind = 'error' | 'success' | 'info';

/** A single button inside the toast — for a notification that asks for something. */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  /** ms this one stays up, derived from its own length */
  duration: number;
  action?: ToastAction;
}

type Listener = (toasts: Toast[]) => void;

let queue: Toast[] = [];
let listeners: Listener[] = [];
let nextId = 1;

/** At most this many on screen; older ones are dropped rather than stacking off-screen. */
const MAX_VISIBLE = 3;

/**
 * "Vanish after certain seconds, up to readable" — so the timer is a function
 * of how much there is to read, not one constant. ~200 wpm with a floor that
 * covers the shortest message and a ceiling so nothing camps on screen.
 */
const readingTime = (message: string): number => {
  const words = message.trim().split(/\s+/).length;
  return Math.min(Math.max(2800, words * 320), 9000);
};

const emit = () => listeners.forEach((fn) => fn(queue));

export const dismissToast = (id: number): void => {
  queue = queue.filter((t) => t.id !== id);
  emit();
};

/**
 * A toast carrying a button has to outlast reading it — the participant still
 * has to decide and then reach for it — so it gets a longer floor than a
 * message that only has to be read.
 */
const ACTION_MIN_DURATION = 9000;

const push = (kind: ToastKind, message: string, action?: ToastAction): number => {
  const text = (message || '').trim();
  if (!text) return 0;

  // Re-raising the identical message (a retry that fails the same way) restarts
  // the existing toast instead of stacking a duplicate underneath it.
  const existing = queue.find((t) => t.message === text && t.kind === kind);
  if (existing) {
    queue = queue.filter((t) => t.id !== existing.id);
    const revived = { ...existing, id: nextId++, action };
    queue = [...queue, revived].slice(-MAX_VISIBLE);
    emit();
    return revived.id;
  }

  const duration = action
    ? Math.max(ACTION_MIN_DURATION, readingTime(text))
    : readingTime(text);
  const toast: Toast = { id: nextId++, kind, message: text, duration, action };
  queue = [...queue, toast].slice(-MAX_VISIBLE);
  emit();
  return toast.id;
};

export const toast = {
  error: (message: string, action?: ToastAction) => push('error', message, action),
  success: (message: string, action?: ToastAction) => push('success', message, action),
  info: (message: string, action?: ToastAction) => push('info', message, action),
};

/**
 * Raise a toast whenever `value` becomes a new non-empty string.
 *
 * Pages already hold their failure in an `error` state and render it inline;
 * this lets them keep that state and drop the markup. The previous value is
 * remembered so a re-render does not re-raise, but setting the SAME message
 * again after clearing it does.
 */
export const useToastOn = (value: string | null | undefined, kind: ToastKind = 'error'): void => {
  const previous = useRef<string | null>(null);
  useEffect(() => {
    const text = (value || '').trim();
    if (text && text !== previous.current) push(kind, text);
    previous.current = text || null;
  }, [value, kind]);
};

/* ==========================================================================
   Presentation
   ========================================================================== */

const TONE: Record<ToastKind, { bar: string; text: string; Icon: typeof AlertTriangle }> = {
  error: { bar: 'bg-[#D51F55]', text: 'text-[#FF6B93]', Icon: AlertTriangle },
  success: { bar: 'bg-[#1DB954]', text: 'text-[#4ADE80]', Icon: CheckCircle2 },
  info: { bar: 'bg-[#0FA9C6]', text: 'text-[#4FD1E5]', Icon: Info },
};

const ToastCard: React.FC<{ toast: Toast }> = ({ toast: t }) => {
  const [leaving, setLeaving] = useState(false);
  const [entered, setEntered] = useState(false);
  const { bar, text, Icon } = TONE[t.kind];

  useEffect(() => {
    // Two frames: the first paints the off-screen start position, the second
    // flips to the resting one so the transition actually runs. A single rAF
    // is sometimes coalesced with the initial paint and the toast just appears.
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));

    const leaveAt = window.setTimeout(() => setLeaving(true), t.duration);
    // Outlives the 260ms exit transition before the node is removed.
    const removeAt = window.setTimeout(() => dismissToast(t.id), t.duration + 300);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(leaveAt);
      window.clearTimeout(removeAt);
    };
  }, [t.id, t.duration]);

  const close = () => {
    setLeaving(true);
    window.setTimeout(() => dismissToast(t.id), 260);
  };

  return (
    <div
      // assertive: a failed submit has to interrupt, not wait for a pause.
      role={t.kind === 'error' ? 'alert' : 'status'}
      aria-live={t.kind === 'error' ? 'assertive' : 'polite'}
      style={{
        transform: entered && !leaving ? 'translateX(0)' : 'translateX(calc(100% + 1.5rem))',
        opacity: entered && !leaving ? 1 : 0,
        transition: 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease',
      }}
      className="pointer-events-auto flex w-full items-start gap-3 border-2 border-[#090A0B] bg-[#141519] pr-3 shadow-[4px_4px_0px_#090A0B]"
    >
      <span className={`w-1.5 self-stretch ${bar}`} aria-hidden="true" />

      <span className={`mt-3 shrink-0 ${text}`}>
        <Icon size={16} />
      </span>

      <div className="flex-1 py-3">
        <p className="font-mono text-[11px] leading-relaxed text-[#EEEEEA] sm:text-xs">
          {t.message}
        </p>

        {t.action && (
          <button
            type="button"
            onClick={() => {
              t.action?.onClick();
              close();
            }}
            className={`mt-2 font-sans text-[11px] font-bold uppercase tracking-wider underline underline-offset-2 ${text} hover:text-[#EEEEEA]`}
          >
            {t.action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={close}
        aria-label="Dismiss notification"
        className="mt-2.5 shrink-0 p-1 text-[#71767B] transition-colors hover:text-[#EEEEEA]"
      >
        <X size={14} />
      </button>
    </div>
  );
};

/** Mounted once, near the root. Renders nothing until something is raised. */
export const ComicToaster: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>(queue);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter((fn) => fn !== setToasts);
    };
  }, []);

  if (!toasts.length) return null;

  return (
    <div
      // Above the navbar, clear of the iOS home indicator, and pointer-events
      // only on the cards so the page underneath stays usable.
      className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-end gap-2 px-3 sm:top-5 sm:px-5"
    >
      <div className="flex w-full max-w-[22rem] flex-col gap-2 overflow-hidden">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} />
        ))}
      </div>
    </div>
  );
};
