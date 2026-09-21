// Zinnia 2026 — in-app confirm and text dialogs.
//
// Replaces window.confirm / window.prompt. The browser's own box says
// "zinnia-2026.tech says …" in grey system chrome that looks nothing like the
// site, cannot be styled, and on a phone reads like a warning from the browser
// rather than a question from us. These ask the same questions in our own look:
// the comic panel on the website, the admin card under /admin.
//
// Same shape as toast.tsx and for the same reason: questions are asked from
// event handlers and helpers alike, so a module-level store is subscribed to by
// the one <DialogHost /> mounted in App, and callers simply await an answer:
//
//     if (!(await confirmDialog({ message: 'Cancel this?', danger: true }))) return;
//     const id = await promptDialog({ message: 'Replace with which UserID?' });

import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';

export interface ConfirmOptions {
  /** short heading; a sensible one is used when left out */
  title?: string;
  /** the question itself; line breaks are kept */
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** a destructive action: red button, and the safe choice gets the focus */
  danger?: boolean;
}

export interface PromptOptions extends ConfirmOptions {
  defaultValue?: string;
  placeholder?: string;
  /** tidies what is typed as it is typed, e.g. upper-casing a UserID */
  transform?: (value: string) => string;
}

type Request =
  | { id: number; kind: 'confirm'; opts: ConfirmOptions; resolve: (ok: boolean) => void }
  | { id: number; kind: 'prompt'; opts: PromptOptions; resolve: (value: string | null) => void };

type Listener = (current: Request | null) => void;

// One at a time: a second question waits until the first is answered.
let queue: Request[] = [];
let listeners: Listener[] = [];
let nextId = 1;

const emit = () => listeners.forEach((fn) => fn(queue[0] ?? null));

const settle = (id: number, answer: boolean | string | null) => {
  const req = queue.find((r) => r.id === id);
  if (!req) return;
  queue = queue.filter((r) => r.id !== id);
  if (req.kind === 'confirm') req.resolve(Boolean(answer));
  else req.resolve(typeof answer === 'string' ? answer : null);
  emit();
};

/** Ask yes/no in the site's own dialog. Resolves true for the confirm button, false otherwise. */
export const confirmDialog = (opts: ConfirmOptions | string): Promise<boolean> =>
  new Promise((resolve) => {
    queue = [...queue, { id: nextId++, kind: 'confirm', opts: typeof opts === 'string' ? { message: opts } : opts, resolve }];
    emit();
  });

/** Ask for a line of text. Resolves the text, or null if cancelled. */
export const promptDialog = (opts: PromptOptions): Promise<string | null> =>
  new Promise((resolve) => {
    queue = [...queue, { id: nextId++, kind: 'prompt', opts, resolve }];
    emit();
  });

/* ==========================================================================
   Presentation
   ========================================================================== */

const DialogCard: React.FC<{ req: Request; admin: boolean }> = ({ req, admin }) => {
  const { opts } = req;
  const danger = Boolean(opts.danger);
  const [value, setValue] = useState(req.kind === 'prompt' ? req.opts.defaultValue ?? '' : '');
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cancel = () => settle(req.id, req.kind === 'prompt' ? null : false);
  const accept = () => {
    if (req.kind === 'prompt') {
      const v = value.trim();
      if (!v) return;
      settle(req.id, v);
    } else settle(req.id, true);
  };

  useEffect(() => {
    // Focus the input for a prompt; for a destructive question the safe button,
    // so an Enter pressed out of habit does not do the damage.
    const t = window.setTimeout(() => {
      if (req.kind === 'prompt') {
        const el = inputRef.current;
        el?.focus();
        el?.setSelectionRange(el.value.length, el.value.length);
      } else (danger ? cancelRef : confirmRef).current?.focus();
    }, 20);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    };
    window.addEventListener('keydown', onKey);
    // The page behind stays put while the question is open.
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
    // One question, one setup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req.id]);

  const title = opts.title ?? (req.kind === 'prompt' ? 'One more detail' : danger ? 'Are you sure?' : 'Please confirm');
  const confirmLabel = opts.confirmLabel ?? (req.kind === 'prompt' ? 'OK' : danger ? 'Yes, continue' : 'Continue');
  const cancelLabel = opts.cancelLabel ?? 'Go back';
  const Icon = danger ? AlertTriangle : HelpCircle;
  const promptEmpty = req.kind === 'prompt' && !value.trim();

  const body = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        accept();
      }}
    >
      {req.kind === 'prompt' && (
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(req.opts.transform ? req.opts.transform(e.target.value) : e.target.value)}
          placeholder={req.opts.placeholder}
          autoComplete="off"
          className={
            admin
              ? 'mt-3 w-full rounded-md border border-white/12 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/25 focus:border-indigo-400 focus:outline-none'
              : 'mt-4 w-full border-2 border-[#23262D] bg-[#0B0C0E] px-3 py-2.5 font-mono text-sm uppercase text-[#EEEEEA] placeholder-[#4A4F57] focus:border-[#0FA9C6] focus:outline-none'
          }
        />
      )}
      <div className={admin ? 'mt-5 flex justify-end gap-2' : 'mt-6 flex flex-wrap justify-end gap-3'}>
        <button
          ref={cancelRef}
          type="button"
          onClick={cancel}
          className={
            admin
              ? 'rounded-md border border-white/12 bg-white/5 px-3.5 py-1.5 text-[13px] font-medium text-white/75 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400'
              : 'border-2 border-[#23262D] px-4 py-2 font-comic text-sm uppercase tracking-wider text-[#B8B8B2] transition-colors hover:border-[#B8B8B2] hover:text-[#EEEEEA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0FA9C6]'
          }
        >
          {cancelLabel}
        </button>
        <button
          ref={confirmRef}
          type="submit"
          disabled={promptEmpty}
          className={
            admin
              ? `rounded-md px-3.5 py-1.5 text-[13px] font-semibold text-white disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                  danger ? 'bg-rose-600 hover:bg-rose-500' : 'bg-indigo-500 hover:bg-indigo-400'
                }`
              : `border-2 border-[#090A0B] px-4 py-2 font-comic text-sm uppercase tracking-wider shadow-[3px_3px_0px_#090A0B] transition-transform hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#090A0B] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EEEEEA] ${
                  danger ? 'bg-[#D51F55] text-white' : 'bg-[#0FA9C6] text-[#090A0B]'
                }`
          }
        >
          {confirmLabel}
        </button>
      </div>
    </form>
  );

  const labelId = `zin-dialog-title-${req.id}`;
  const descId = `zin-dialog-desc-${req.id}`;

  if (admin) {
    return (
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={labelId}
        aria-describedby={descId}
        className="w-full max-w-md rounded-xl border border-white/12 bg-[#14161C] p-5 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${danger ? 'text-rose-300' : 'text-indigo-300'}`} />
          <h3 id={labelId} className="text-base font-semibold text-white">
            {title}
          </h3>
          <button type="button" onClick={cancel} aria-label="Close" className="ml-auto text-white/40 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p id={descId} className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-white/70">
          {opts.message}
        </p>
        {body}
      </div>
    );
  }

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={labelId}
      aria-describedby={descId}
      className="relative w-full max-w-md border-2 border-[#090A0B] bg-[#141519] shadow-[6px_6px_0px_#090A0B]"
    >
      <span className={`block h-1.5 w-full ${danger ? 'bg-[#D51F55]' : 'bg-[#0FA9C6]'}`} aria-hidden="true" />
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <Icon size={20} className={`mt-0.5 shrink-0 ${danger ? 'text-[#FF6B93]' : 'text-[#4FD1E5]'}`} />
          <h3 id={labelId} className="font-comic text-xl uppercase leading-tight tracking-wide text-[#EEEEEA]">
            {title}
          </h3>
          <button type="button" onClick={cancel} aria-label="Close" className="ml-auto text-[#71767B] hover:text-[#EEEEEA]">
            <X size={18} />
          </button>
        </div>
        <p id={descId} className="mt-3 whitespace-pre-line font-mono text-xs leading-relaxed text-[#D0D0D4] sm:text-sm">
          {opts.message}
        </p>
        {body}
      </div>
    </div>
  );
};

/** Mounted once, in App. Renders nothing until a question is asked. */
export const DialogHost: React.FC = () => {
  const [current, setCurrent] = useState<Request | null>(queue[0] ?? null);
  const { pathname } = useLocation();

  useEffect(() => {
    listeners = [...listeners, setCurrent];
    return () => {
      listeners = listeners.filter((fn) => fn !== setCurrent);
    };
  }, []);

  if (!current) return null;
  const admin = pathname.startsWith('/admin');
  const cancel = () => settle(current.id, current.kind === 'prompt' ? null : false);

  return (
    <div
      className={`fixed inset-0 z-[300] grid place-items-center px-4 ${admin ? 'bg-black/70' : 'bg-black/80 backdrop-blur-sm'}`}
      // A click on the backdrop is "no": the page is still there behind it.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) cancel();
      }}
    >
      <DialogCard key={current.id} req={current} admin={admin} />
    </div>
  );
};
