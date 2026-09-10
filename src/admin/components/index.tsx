import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Copy, Loader2, X } from 'lucide-react';

/* ------------------------------------------------------------------ atoms */

export const cx = (...v: (string | false | null | undefined)[]) => v.filter(Boolean).join(' ');

type Tone = 'ok' | 'warn' | 'crit' | 'neutral' | 'accent';

const TONE: Record<Tone, string> = {
  ok: 'bg-emerald-500/12 text-emerald-300 border-emerald-500/25',
  warn: 'bg-amber-500/12 text-amber-300 border-amber-500/25',
  crit: 'bg-rose-500/12 text-rose-300 border-rose-500/25',
  neutral: 'bg-white/6 text-white/60 border-white/12',
  accent: 'bg-indigo-500/12 text-indigo-300 border-indigo-500/25',
};

export function Chip({
  tone = 'neutral',
  children,
  title,
}: {
  tone?: Tone;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cx(
        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 border',
        'font-mono text-[10.5px] font-semibold tracking-[0.04em] uppercase whitespace-nowrap',
        TONE[tone],
      )}
    >
      {children}
    </span>
  );
}

/** State chip for an event row, so status reads at a glance from a projector. */
export function EventStateChip({ state }: { state: string }) {
  const map: Record<string, [Tone, string]> = {
    OPEN: ['ok', 'Open'],
    NEARLY_FULL: ['warn', 'Nearly full'],
    FULL: ['crit', 'Full'],
    CLOSED: ['neutral', 'Closed'],
  };
  const [tone, label] = map[state] || ['neutral', state];
  return <Chip tone={tone}>{label}</Chip>;
}

export function PaymentStatusChip({ status }: { status: string }) {
  const map: Record<string, [Tone, string]> = {
    APPROVED: ['ok', 'Approved'],
    PENDING: ['warn', 'Pending'],
    REJECTED: ['crit', 'Rejected'],
  };
  const [tone, label] = map[status] || ['neutral', status];
  return <Chip tone={tone}>{label}</Chip>;
}

const FLAG_LABEL: Record<string, [Tone, string, string]> = {
  AMOUNT_MISMATCH: ['warn', 'Amount', 'Amount does not match the registration fee'],
  DUPLICATE_REF: ['crit', 'Duplicate', 'This reference appears on another registration'],
  RESUBMISSION: ['warn', 'Resubmitted', 'Not the first attempt'],
  NO_SCREENSHOT: ['neutral', 'No proof', 'No payment screenshot was submitted'],
  EMAIL_UNVERIFIED: ['warn', 'Email', 'Email address has not been verified'],
  BYPASSED: ['crit', 'Bypassed', 'Approved without a bank check - this money will never appear in a statement'],
};

export function FlagChips({ flags }: { flags?: string[] | null }) {
  if (!flags?.length) return null;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {flags.map((f) => {
        const [tone, label, title] = FLAG_LABEL[f] || ['neutral', f, f];
        return (
          <Chip key={f} tone={tone} title={title}>
            {label}
          </Chip>
        );
      })}
    </span>
  );
}

/* ----------------------------------------------------------------- panels */

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        'rounded-lg border border-white/10 bg-white/[0.03] backdrop-blur-sm',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function SectionTitle({
  title,
  hint,
  right,
}: {
  title: string;
  hint?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex items-baseline gap-3 flex-wrap px-5 pt-4 pb-3">
      <h2 className="text-[13px] font-semibold tracking-[0.08em] uppercase text-white/70 font-mono">
        {title}
      </h2>
      {hint && <span className="text-xs text-white/35">{hint}</span>}
      <div className="ml-auto">{right}</div>
    </header>
  );
}

export function StatTile({
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: Tone;
}) {
  const accent: Record<Tone, string> = {
    ok: 'text-emerald-300',
    warn: 'text-amber-300',
    crit: 'text-rose-300',
    accent: 'text-indigo-300',
    neutral: 'text-white',
  };
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3.5">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-white/45">
        {label}
      </div>
      <div className={cx('mt-1.5 text-2xl font-semibold tabular-nums', accent[tone])}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11.5px] text-white/40">{sub}</div>}
    </div>
  );
}

/** Fill bar. Amber past 80%, rose at 100%, and it never renders past its track. */
export function CapacityBar({
  used,
  capacity,
}: {
  used: number;
  capacity: number | null;
}) {
  if (capacity == null) {
    return <div className="text-[11px] text-white/30 font-mono">unlimited</div>;
  }
  const pct = capacity > 0 ? (used / capacity) * 100 : 0;
  const tone =
    pct >= 100 ? 'bg-rose-400' : pct >= 80 ? 'bg-amber-400' : 'bg-indigo-400';
  return (
    <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden" role="presentation">
      <div className={cx('h-full rounded-full', tone)} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

/* ---------------------------------------------------------------- widgets */

export function CopyButton({ value, label }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(value);
        setDone(true);
        window.setTimeout(() => setDone(false), 1400);
      }}
      title={done ? 'Copied' : `Copy ${label || value}`}
      className="inline-flex items-center text-white/30 hover:text-white/80 transition-colors"
    >
      {done ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export function Banner({
  tone = 'crit',
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        'flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm leading-relaxed',
        TONE[tone],
      )}
      role={tone === 'crit' ? 'alert' : undefined}
    >
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-white/40 text-sm px-5 py-8 justify-center">
      <Loader2 className="w-4 h-4 animate-spin" />
      {label || 'Loading…'}
    </div>
  );
}

export function EmptyRow({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-10 text-center text-sm text-white/35">{children}</div>;
}

export function Button({
  children,
  onClick,
  variant = 'ghost',
  disabled,
  type = 'button',
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'danger' | 'ghost';
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}) {
  const styles = {
    primary: 'bg-indigo-500 hover:bg-indigo-400 text-white border-transparent',
    danger: 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 border-rose-500/30',
    ghost: 'bg-white/5 hover:bg-white/10 text-white/75 border-white/12',
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5',
        'text-[13px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400',
        styles,
        className,
      )}
    >
      {children}
    </button>
  );
}

/**
 * Closing an event and rejecting a payment both need a reason, and both send
 * it somewhere a person will read it — so one dialog, and the reason is
 * mandatory in both.
 */
export function ReasonDialog({
  open,
  title,
  description,
  presets = [],
  confirmLabel = 'Confirm',
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  presets?: string[];
  confirmLabel?: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setReason('');
      window.setTimeout(() => ref.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-xl border border-white/12 bg-[#14161C] p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="ml-auto text-white/40 hover:text-white"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {description && (
          <p className="mt-1.5 text-[13px] text-white/50 leading-relaxed">{description}</p>
        )}

        {presets.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setReason(p)}
                className="rounded border border-white/12 bg-white/5 px-2 py-1 text-[12px]
                           text-white/60 hover:text-white hover:border-white/25"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        <textarea
          ref={ref}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Reason…"
          className="mt-3 w-full rounded-md border border-white/12 bg-black/30 px-3 py-2
                     text-sm text-white placeholder-white/25 focus:border-indigo-400 focus:outline-none"
        />

        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="danger"
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason.trim())}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
