import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Loader2, Plus, RotateCw, Search, Send, Trash2, UserPlus, Users, X } from 'lucide-react';
import { useAdminQuery } from '../hooks/useAdminQuery';
import { AdminError, adminFetch } from '../auth/adminFetch';
import { isDeskOnly, useAdminAuth } from '../auth/AdminAuthProvider';
import {
  Banner,
  Button,
  Card,
  Chip,
  CopyButton,
  PaymentStatusChip,
  SectionTitle,
  Spinner,
  cx,
} from '../components';
import { ON_SPOT_REGISTRATION_FEE } from '../../config/site';
import type {
  SpotCatalogCard,
  SpotDetail,
  SpotEmailCheck,
  SpotMemberCheck,
  SpotPayee,
  SpotPaymentMethod,
  SpotPerson,
  SpotSearchResult,
} from '../types';

/**
 * The on-spot desk: walk-ins on the fest day.
 *
 * The website's registration closes on 23 September; this screen keeps
 * registering after that. Everything it writes goes through
 * /api/admin/spot/*, which applies the same rules as the website (3-event cap,
 * clashes, team sizes, capacity) with only the close date lifted.
 *
 * Left (first on a phone): register a new walk-in. Right (below it on a
 * phone): find someone, and the open person's pass and events. A team arriving
 * together is registered member by member; forming the team from the captain
 * then fills the others in from this group. Refresh clears everything for the
 * next group.
 *
 * Payment is checked by eye at the desk - the cash in hand, or the UPI success
 * screen on the payer's phone - and confirmed with the "received" tick. No UTR
 * is asked for: most payers cannot find it quickly, and the tick is the check.
 */

const USER_ID_RE = /^ZIN26-\d{4,}$/i;

/**
 * Team member fields start out holding "ZIN26-", so the treasurer types only
 * the digits of each member's login code. tidyMemberInput keeps exactly one
 * prefix however the code arrives: typed after the prefill, pasted whole over
 * it ("ZIN26-ZIN26-0142"), or with the dash left out ("ZIN260142"). After the
 * prefix only digits are kept - every UserID is ZIN26- and digits - so a name
 * typed by mistake never turns into a "UserID" like ZIN26-HARI.
 */
const MEMBER_PREFIX = 'ZIN26-';

function tidyMemberInput(raw: string): string {
  const v = raw.toUpperCase().replace(/\s+/g, '');
  const m = v.match(/^(?:ZIN26-?)+(.*)$/);
  const tail = m ? m[1] : v;
  // Someone typing the whole code after the prefill: "ZIN2" is on its way to a
  // second "ZIN26-", which the match above folds away. Dropping its letters
  // would keep the "26" and turn ZIN26-0349 into ZIN26-260349.
  if (/^Z(?:I(?:N(?:2(?:6)?)?)?)?$/.test(tail)) return `${MEMBER_PREFIX}${tail}`;
  return `${MEMBER_PREFIX}${tail.replace(/\D/g, '').slice(0, 8)}`;
}

/**
 * Ten digits, as the website form takes them. A pasted "+91 98765 43210" or
 * "098765 43210" loses its country code or trunk 0 rather than keeping the
 * wrong first ten digits.
 */
function tidyPhone(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d.slice(0, 10);
}

/**
 * The Find box starts with "ZIN26-" too, so a UserID is typed as its digits.
 * It still takes an email or a phone number: the first letter or "@" drops the
 * prefix, ten digits or more are read as a phone number (see findTerm), and
 * clearing the box brings "ZIN26-" back.
 */
function tidyFindInput(raw: string): string {
  const t = raw.trimStart();
  const m = t.match(/^(?:zin26-?)+(.*)$/i);
  // A dash straight after the prefix is the prefix's own ("ZIN26-" typed out in full).
  const tail = m ? m[1].replace(/^-+/, '') : t;
  const digits = tail.replace(/\s+/g, '');
  if (/^\d*$/.test(digits)) return `${MEMBER_PREFIX}${digits}`;
  // The whole code typed over the prefill: "ZIN2" is on its way to "ZIN26-".
  if (/^z(?:i(?:n(?:2(?:6)?)?)?)?$/i.test(tail)) return `${MEMBER_PREFIX}${tail.toUpperCase()}`;
  return tail; // an email, a "+91 ..." phone, or a name
}

/** What the Find box searches for: a UserID, a phone number's digits, or the text as typed. */
function findTerm(value: string): string {
  const v = value.trim();
  const m = v.match(/^ZIN26-(\d*)$/i);
  if (!m) return v;
  if (m[1].length >= 10) return m[1]; // a phone number typed after the prefix
  return m[1] ? `${MEMBER_PREFIX}${m[1]}` : ''; // only the prefix: nothing to search yet
}

/** The UserID a member field holds, or '' while it still has only the prefill. */
function memberId(value: string): string {
  const v = tidyMemberInput(value);
  if (!v || v === MEMBER_PREFIX) return '';
  return /^\d+$/.test(v) ? `${MEMBER_PREFIX}${v}` : v;
}
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/;
const YEARS = ['I', 'II', 'III', 'IV'] as const;

const inputCls =
  'w-full rounded-md border border-white/12 bg-black/30 px-3 py-2 text-sm text-white ' +
  'placeholder-white/25 focus:border-indigo-400 focus:outline-none disabled:opacity-50';

const labelCls = 'font-mono text-[10.5px] uppercase tracking-[0.1em] text-white/45';

type Notice = { tone: 'ok' | 'warn'; text: string };
type OpenTarget = { user_id: string; name: string };

/** Where one person's pass email stands. Kept by the page, so it outlives the panel. */
type PassMail = { state: 'sending' | 'sent' | 'failed'; text: string };

/* ----------------------------------------------------------------- helpers */

function errorText(e: unknown, fallback: string) {
  return e instanceof Error && e.message ? e.message : fallback;
}

/**
 * A search term that names exactly one person: a full UserID, an email, or a
 * phone number. Only these may open a record on their own - a name match can
 * be somebody else with a similar name.
 */
function isExactIdentifier(term: string) {
  const t = term.trim();
  return USER_ID_RE.test(t) || t.includes('@') || (!/[A-Za-z]/.test(t) && t.replace(/\D/g, '').length >= 10);
}

/**
 * Runs a desk action, and asks before retrying when the server wants a warning
 * acknowledged. `context` names who and what, so the prompt cannot be read as
 * being about a different person; nothing is asked once the panel has gone.
 */
async function withWarningConfirm<T>(
  run: (confirm: boolean) => Promise<T>,
  context: string,
  stillHere: () => boolean,
): Promise<T | null> {
  try {
    return await run(false);
  } catch (e) {
    if (e instanceof AdminError && e.code === 'CONFIRMATION_REQUIRED') {
      if (!stillHere()) return null;
      // The server's warning usually already ends by asking the question.
      const ask = e.message.trim().endsWith('?') ? e.message : `${e.message}\n\nRegister anyway?`;
      if (!window.confirm(`${context}\n\n${ask}`)) return null;
      return run(true);
    }
    throw e;
  }
}

function focusField(field: string) {
  window.requestAnimationFrame(() => {
    const el = document.getElementById(`spot-${field}`);
    // A radio group cannot take focus itself; its chosen option can.
    const target =
      el?.getAttribute('role') === 'radiogroup'
        ? el.querySelector<HTMLElement>('[aria-checked="true"]') ?? el
        : el;
    target?.focus();
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
}

function Segmented<T extends string>({
  id,
  labelledBy,
  value,
  options,
  disabled,
  onChange,
}: {
  id: string;
  labelledBy: string;
  value: T;
  options: { value: T; label: string }[];
  disabled?: boolean;
  onChange: (v: T) => void;
}) {
  return (
    <div
      id={id}
      role="radiogroup"
      aria-labelledby={labelledBy}
      className="inline-flex rounded-md border border-white/12 bg-black/30 p-0.5"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={cx(
            'rounded px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-50',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400',
            value === o.value ? 'bg-indigo-500 text-white' : 'text-white/55 hover:text-white',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- find card */

function FindCard({
  onOpen,
  selectionEpoch,
}: {
  onOpen: (p: OpenTarget) => void;
  /** Bumped every time the desk opens someone; a slower search must not override that. */
  selectionEpoch: React.MutableRefObject<number>;
}) {
  const [q, setQ] = useState(MEMBER_PREFIX);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<SpotSearchResult[] | null>(null);
  const [exact, setExact] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const seq = useRef(0);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = findTerm(q);
    if (term.length < 3) return;
    const mine = ++seq.current;
    const openedBefore = selectionEpoch.current;
    setBusy(true);
    setProblem(null);
    try {
      const res = await adminFetch<{ results: SpotSearchResult[] }>(
        `/api/admin/spot/search?${new URLSearchParams({ q: term })}`,
      );
      if (seq.current !== mine) return;
      const byIdentifier = isExactIdentifier(term);
      setResults(res.results);
      setExact(byIdentifier);
      if (byIdentifier && res.results.length === 1 && selectionEpoch.current === openedBefore) {
        onOpen(res.results[0]);
      }
    } catch (err) {
      if (seq.current !== mine) return;
      setResults(null);
      setProblem(errorText(err, 'Search failed.'));
    } finally {
      if (seq.current === mine) setBusy(false);
    }
  };

  return (
    <Card>
      <SectionTitle title="Find participant" hint="type the digits after ZIN26-, or an email or phone" />
      <form onSubmit={run} className="flex gap-2 px-5 pb-4">
        <label htmlFor="spot-search" className="sr-only">
          UserID, email, phone or name
        </label>
        <input
          id="spot-search"
          value={q}
          onChange={(e) => setQ(tidyFindInput(e.target.value))}
          onFocus={(e) => {
            // Land after the prefilled ZIN26- rather than in front of it.
            const el = e.currentTarget;
            requestAnimationFrame(() => el.setSelectionRange(el.value.length, el.value.length));
          }}
          placeholder="ZIN26-0000, email or phone"
          className={inputCls}
          autoComplete="off"
        />
        <Button type="submit" disabled={busy || findTerm(q).length < 3}>
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          Search
        </Button>
      </form>

      {problem && (
        <div className="px-5 pb-4">
          <Banner>{problem}</Banner>
        </div>
      )}

      {results && (
        <div className="border-t border-white/8">
          {results.length === 0 ? (
            <p className="px-5 py-4 text-sm text-white/40">Nobody matches. Register them as a new walk-in.</p>
          ) : (
            <>
              {!exact && (
                <p className="px-5 pt-3 text-[12px] text-white/40">
                  Name matches - check the college and email before opening. Not them? Register a new walk-in.
                </p>
              )}
              <ul className="divide-y divide-white/6">
                {results.map((r) => (
                  <li key={r.user_id}>
                    <button
                      type="button"
                      onClick={() => onOpen(r)}
                      className="flex w-full items-center gap-3 px-5 py-2.5 text-left hover:bg-white/4
                                 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] text-white/90">{r.name}</div>
                        <div className="truncate text-[11.5px] text-white/40">
                          {r.college} · {r.email}
                        </div>
                      </div>
                      <span className="font-mono text-[12px] text-white/70">{r.user_id}</span>
                      <PaymentStatusChip status={r.payment_status} />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------ new walk-in */

interface WalkInForm {
  name: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year: string;
  food_preference: 'VEG' | 'NON_VEG';
  payment_method: SpotPaymentMethod;
}

const EMPTY_FORM: WalkInForm = {
  name: '',
  email: '',
  phone: '',
  college: '',
  department: '',
  year: '',
  food_preference: 'VEG',
  payment_method: 'CASH',
};

/**
 * The walk-in fields that show a server error under themselves. An error for
 * any other field - one this page does not draw, or one an older or newer
 * server names - goes to the banner, so a refusal can never land on a field
 * that is not on screen and vanish with nothing registered.
 */
const WALK_IN_ERROR_FIELDS = new Set([
  'name', 'email', 'phone', 'college', 'department', 'year', 'payment_method', 'collected',
]);

type EmailCheckState =
  | { status: 'idle' }
  | { status: 'checking'; email: string }
  | { status: 'free'; email: string }
  | { status: 'error'; email: string }
  | { status: 'taken'; email: string; user_id: string; name: string };

function validate(f: WalkInForm, collected: boolean): { field: string; message: string } | null {
  if (!f.name.trim()) return { field: 'name', message: 'Name is required.' };
  if (!EMAIL_RE.test(f.email.trim())) return { field: 'email', message: 'Enter a valid email address.' };
  if (!/^\d{10}$/.test(f.phone.replace(/\D/g, '')))
    return { field: 'phone', message: 'Enter a 10-digit phone number.' };
  if (!f.college.trim()) return { field: 'college', message: 'College is required.' };
  if (!f.department.trim()) return { field: 'department', message: 'Department is required.' };
  if (!f.year) return { field: 'year', message: 'Choose the year of study.' };
  if (!collected)
    return { field: 'collected', message: `Confirm the ₹${ON_SPOT_REGISTRATION_FEE} has been received.` };
  return null;
}

function WalkInCard({
  initialMethod,
  onMethodChange,
  onBusyChange,
  onCreated,
  onOpen,
}: {
  /** the method this desk last used - kept across Refresh, so a UPI desk stays on UPI */
  initialMethod: SpotPaymentMethod;
  onMethodChange: (m: SpotPaymentMethod) => void;
  /** true while a registration is being saved; Refresh waits for it */
  onBusyChange: (busy: boolean) => void;
  onCreated: (person: SpotPerson, message: string) => void;
  onOpen: (p: OpenTarget) => void;
}) {
  const [form, setForm] = useState<WalkInForm>(() => ({ ...EMPTY_FORM, payment_method: initialMethod }));
  const [collected, setCollected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fieldError, setFieldError] = useState<{ field: string; message: string } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [existing, setExisting] = useState<string | null>(null);

  useEffect(() => {
    onBusyChange(busy);
  }, [busy, onBusyChange]);

  // --- is this email already registered? -------------------------------------
  // Asked the moment the email field is left, so the treasurer finds out before
  // filling in the rest - not after pressing Register. The server still refuses
  // a duplicate on its own; this only brings the answer forward.
  const [emailCheck, setEmailCheck] = useState<EmailCheckState>({ status: 'idle' });
  const emailSeq = useRef(0);

  const resetEmailCheck = () => {
    emailSeq.current++; // a check still in flight is for the old address
    setEmailCheck({ status: 'idle' });
  };

  // Takes the value from the field itself, not from `form`: a blur can land in
  // the same moment as the last keystroke, before React has re-rendered, and the
  // form state would still hold the address as it was a keystroke ago.
  const checkEmail = async (raw: string) => {
    const address = raw.trim().toLowerCase();
    if (!EMAIL_RE.test(address)) return;
    if (emailCheck.status !== 'idle' && emailCheck.status !== 'error' && emailCheck.email === address) return;

    const mine = ++emailSeq.current;
    setEmailCheck({ status: 'checking', email: address });
    try {
      const res = await adminFetch<SpotEmailCheck>(
        `/api/admin/spot/check-email?${new URLSearchParams({ email: address })}`,
      );
      if (emailSeq.current !== mine) return;
      setEmailCheck(
        res.registered && res.user_id
          ? { status: 'taken', email: address, user_id: res.user_id, name: res.name || '' }
          : { status: 'free', email: address },
      );
    } catch {
      if (emailSeq.current === mine) setEmailCheck({ status: 'error', email: address });
    }
  };

  // --- which desk UPI account the QR points at -----------------------------------
  // The desk's own accounts, never the website's. Each desk login (onspot1 ...
  // onspot4) always gets its own; a treasurer or super admin picks a desk. The key goes
  // back with the registration and the server checks this login may use it, so
  // the account recorded is the account this QR showed.
  const [payee, setPayee] = useState<SpotPayee | null>(null);
  const [payeeError, setPayeeError] = useState<string | null>(null);
  const [deskKey, setDeskKey] = useState<string | null>(null);
  const payeeSeq = useRef(0);

  const account = payee?.accounts.find((a) => a.key === deskKey) ?? payee?.accounts[0] ?? null;

  const chooseDesk = (key: string) => {
    if (key === account?.key) return;
    setDeskKey(key);
    setCollected(false); // the tick was for the other account's QR
  };

  const loadPayee = useCallback(async () => {
    const mine = ++payeeSeq.current;
    setPayee(null);
    setPayeeError(null);
    // A new QR may be a different account: the tick has to be given for this one.
    setCollected(false);
    try {
      const res = await adminFetch<SpotPayee>('/api/admin/spot/payee');
      if (payeeSeq.current === mine) {
        setPayee(res);
        // Keep the treasurer's choice while it is still on offer.
        setDeskKey((k) => (res.accounts.some((a) => a.key === k) ? k : res.accounts[0]?.key ?? null));
        setProblem(null); // a "wait for the QR" banner is over once it is here
      }
    } catch (e) {
      if (payeeSeq.current === mine) setPayeeError(errorText(e, 'Could not load the UPI account.'));
    }
  }, []);

  useEffect(() => {
    if (form.payment_method === 'UPI') void loadPayee();
    else payeeSeq.current++; // switching back to cash drops any answer in flight
  }, [form.payment_method, loadPayee]);

  // Same intent as the website's payment page. pa is not percent-encoded:
  // some UPI apps fail to read the payee when its "@" arrives as %40.
  const upiLink = payee && account
    ? `upi://pay?pa=${account.upi_id}`
      + `&pn=${encodeURIComponent(account.payee_name)}`
      + `&am=${payee.amount}`
      + `&cu=INR`
      + `&tn=${encodeURIComponent('ZINNIA26 SPOT')}`
    : '';

  const set = <K extends keyof WalkInForm>(key: K, value: WalkInForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldError?.field === key) setFieldError(null);
    // Ticked for cash is not ticked for UPI, and the other way round.
    if (key === 'payment_method' && value !== form.payment_method) {
      setCollected(false);
      onMethodChange(value as SpotPaymentMethod);
    }
  };

  const invalidProps = (key: string) => ({
    'aria-invalid': fieldError?.field === key || undefined,
    'aria-describedby': fieldError?.field === key ? `spot-${key}-error` : undefined,
  });

  const errorFor = (key: string) =>
    fieldError?.field === key ? (
      <p id={`spot-${key}-error`} role="alert" className="mt-1 text-[12px] text-rose-300">
        {fieldError.message}
      </p>
    ) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setProblem(null);
    setExisting(null);

    const invalid = validate(form, collected);
    if (invalid) {
      setFieldError(invalid);
      focusField(invalid.field);
      return;
    }
    if (emailCheck.status === 'taken' && emailCheck.email === form.email.trim().toLowerCase()) {
      focusField('email');
      return;
    }
    if (form.payment_method === 'UPI' && !account) {
      setProblem(payeeError || 'Wait for the UPI QR to load before taking the payment.');
      return;
    }

    setBusy(true);
    try {
      const res = await adminFetch<{
        participant: SpotPerson;
        message: string;
        email_sent: boolean | null;
      }>('/api/admin/spot/participants', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.replace(/\D/g, ''),
          college: form.college.trim(),
          department: form.department.trim(),
          payee_key: form.payment_method === 'UPI' ? account?.key ?? '' : '',
          // The page sends the pass itself right after, so the panel opens
          // without waiting seconds on the mail server.
          defer_email: true,
        }),
      });
      onCreated(res.participant, res.message);
      // College and department usually repeat for the next person in a queue
      // from the same campus, so they stay; everything personal clears. The
      // fields were locked while the request ran, so nothing typed is lost.
      setForm((f) => ({
        ...EMPTY_FORM,
        college: f.college,
        department: f.department,
        payment_method: f.payment_method,
      }));
      setCollected(false);
      setFieldError(null);
      resetEmailCheck();
      focusField('name');
    } catch (err) {
      if (err instanceof AdminError) {
        if (err.data?.user_id && err.code === 'DUPLICATE_EMAIL') setExisting(err.data.user_id);
        if (err.data?.field && WALK_IN_ERROR_FIELDS.has(err.data.field)) {
          setFieldError({ field: err.data.field, message: err.message });
          focusField(err.data.field);
          // The server no longer takes the account this QR showed: put up the
          // current one, to be paid and ticked again.
          if (err.data.field === 'payment_method' && form.payment_method === 'UPI') void loadPayee();
        } else {
          setProblem(err.message);
        }
      } else {
        setProblem(errorText(err, 'Could not register.'));
      }
    } finally {
      setBusy(false);
    }
  };

  const field = (
    key: keyof WalkInForm,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
    /** tidies what is typed or pasted before it is stored */
    clean?: (value: string) => string,
  ) => (
    <div>
      <label htmlFor={`spot-${key}`} className={labelCls}>
        {label}
      </label>
      <input
        {...props}
        id={`spot-${key}`}
        value={form[key] as string}
        onChange={(e) => set(key, (clean ? clean(e.target.value) : e.target.value) as WalkInForm[typeof key])}
        {...invalidProps(key)}
        className={cx(inputCls, 'mt-1', fieldError?.field === key && 'border-rose-400/70')}
      />
      {errorFor(key)}
    </div>
  );

  return (
    <Card>
      <SectionTitle
        title="New walk-in"
        hint={`₹${ON_SPOT_REGISTRATION_FEE}`}
        right={<UserPlus className="w-4 h-4 text-white/30" />}
      />
      <form onSubmit={submit} noValidate className="space-y-3 px-5 pb-5">
        {/* Locked while a registration is saving, so nothing typed for the
            next person can be wiped by this one's reset. */}
        <fieldset disabled={busy} className="m-0 min-w-0 space-y-3 border-0 p-0">
          {field('name', 'Full name', { autoComplete: 'off' })}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="spot-email" className={labelCls}>
                Email
              </label>
              <div className="relative mt-1">
                <input
                  id="spot-email"
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  value={form.email}
                  onChange={(e) => {
                    set('email', e.target.value);
                    if (emailCheck.status !== 'idle') resetEmailCheck();
                  }}
                  onBlur={(e) => void checkEmail(e.currentTarget.value)}
                  {...invalidProps('email')}
                  aria-busy={emailCheck.status === 'checking' || undefined}
                  className={cx(
                    inputCls,
                    'pr-9',
                    (fieldError?.field === 'email' || emailCheck.status === 'taken') && 'border-rose-400/70',
                    emailCheck.status === 'free' && 'border-emerald-500/50',
                  )}
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center"
                >
                  {emailCheck.status === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-indigo-300" />}
                  {emailCheck.status === 'free' && <Check className="w-4 h-4 text-emerald-400" />}
                  {emailCheck.status === 'taken' && <X className="w-4 h-4 text-rose-400" />}
                </span>
              </div>
              <div aria-live="polite" className="text-[12px]">
                {emailCheck.status === 'checking' && <p className="mt-1 text-white/40">Checking…</p>}
                {emailCheck.status === 'free' && <p className="mt-1 text-emerald-300/80">Not registered yet.</p>}
                {emailCheck.status === 'error' && (
                  <p className="mt-1 text-white/40">Could not check now. Registering still refuses a duplicate.</p>
                )}
                {emailCheck.status === 'taken' && (
                  <p className="mt-1 text-rose-300">
                    Already registered as <span className="font-mono">{emailCheck.user_id}</span>
                    {emailCheck.name && ` · ${emailCheck.name}`}.{' '}
                    <button
                      type="button"
                      onClick={() => onOpen({ user_id: emailCheck.user_id, name: emailCheck.name })}
                      className="font-semibold underline underline-offset-2 hover:text-white"
                    >
                      Open it
                    </button>
                  </p>
                )}
              </div>
              {errorFor('email')}
            </div>
            {field(
              'phone',
              'Phone',
              // No maxLength: it would cut a pasted "+91 ..." before tidyPhone saw it.
              { inputMode: 'numeric', autoComplete: 'off', placeholder: '10 digits' },
              tidyPhone,
            )}
          </div>
          {field('college', 'College')}
          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            {field('department', 'Department')}
            <div>
              <label htmlFor="spot-year" className={labelCls}>
                Year
              </label>
              <select
                id="spot-year"
                value={form.year}
                onChange={(e) => set('year', e.target.value)}
                {...invalidProps('year')}
                className={cx(inputCls, 'mt-1', fieldError?.field === 'year' && 'border-rose-400/70')}
              >
                <option value="">—</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              {errorFor('year')}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
            <div>
              <div id="spot-food-label" className={labelCls}>
                Food
              </div>
              <div className="mt-1">
                <Segmented
                  id="spot-food"
                  labelledBy="spot-food-label"
                  value={form.food_preference}
                  disabled={busy}
                  onChange={(v) => set('food_preference', v)}
                  options={[
                    { value: 'VEG', label: 'Veg' },
                    { value: 'NON_VEG', label: 'Non-veg' },
                  ]}
                />
              </div>
            </div>
            <div>
              <div id="spot-method-label" className={labelCls}>
                Paid by
              </div>
              <div className="mt-1">
                <Segmented
                  id="spot-payment_method"
                  labelledBy="spot-method-label"
                  value={form.payment_method}
                  disabled={busy}
                  onChange={(v) => set('payment_method', v)}
                  options={[
                    { value: 'CASH', label: 'Cash' },
                    { value: 'UPI', label: 'UPI' },
                  ]}
                />
              </div>
            </div>
          </div>
          {/* The server's payment errors: no method chosen, or the QR's account gone. */}
          {errorFor('payment_method')}

          {form.payment_method === 'UPI' && payee && !payee.fixed && payee.accounts.length > 1 && (
            <div>
              <div id="spot-desk-upi-label" className={labelCls}>
                UPI account
              </div>
              <div className="mt-1">
                <Segmented
                  id="spot-desk-upi"
                  labelledBy="spot-desk-upi-label"
                  value={account?.key ?? ''}
                  disabled={busy}
                  onChange={chooseDesk}
                  options={payee.accounts.map((a) => ({ value: a.key, label: a.label }))}
                />
              </div>
            </div>
          )}

          {form.payment_method === 'UPI' && (
            <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/25 p-3">
              <div className="w-[128px] shrink-0 rounded-md bg-white p-2">
                {account ? (
                  <QRCodeSVG
                    value={upiLink}
                    level="M"
                    className="block h-auto w-full"
                    aria-label={`UPI payment QR for ${account.label}`}
                  />
                ) : (
                  <div
                    role="status"
                    aria-label="Loading the UPI QR"
                    className="flex aspect-square w-full items-center justify-center bg-[#EEEEEA]"
                  >
                    {payeeError ? (
                      <X className="w-5 h-5 text-rose-500" />
                    ) : (
                      <Loader2 className="w-5 h-5 animate-spin text-[#71767B]" />
                    )}
                  </div>
                )}
              </div>
              <div className="min-w-0 space-y-1.5">
                <div className={labelCls}>Scan to pay ₹{payee?.amount ?? ON_SPOT_REGISTRATION_FEE}</div>
                {account && (
                  <>
                    <Chip tone="accent">{account.label}</Chip>
                    <div className="flex items-center gap-1.5 break-all font-mono text-[12.5px] text-white/85">
                      {account.upi_id}
                      <CopyButton value={account.upi_id} label="UPI ID" />
                    </div>
                    <div className="text-[12px] text-white/45">{account.payee_name}</div>
                  </>
                )}
                {payeeError && (
                  <div className="text-[12px] text-rose-300">
                    {payeeError}{' '}
                    <button
                      type="button"
                      onClick={() => void loadPayee()}
                      className="font-semibold underline underline-offset-2 hover:text-white"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <label
            htmlFor="spot-collected"
            className={cx(
              'flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-[13.5px]',
              collected
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : fieldError?.field === 'collected'
                  ? 'border-rose-400/60 bg-rose-500/10 text-rose-200'
                  : 'border-white/12 bg-black/20 text-white/70',
            )}
          >
            <input
              id="spot-collected"
              type="checkbox"
              checked={collected}
              // Nothing to confirm until the QR - and so the bank - is showing.
              disabled={form.payment_method === 'UPI' && !account}
              onChange={(e) => {
                setCollected(e.target.checked);
                if (fieldError?.field === 'collected') setFieldError(null);
              }}
              {...invalidProps('collected')}
              className="h-4 w-4 accent-emerald-500"
            />
            ₹{ON_SPOT_REGISTRATION_FEE} received{' '}
            {form.payment_method === 'UPI' ? (account ? `in the ${account.label} UPI` : 'by UPI') : 'in cash'}
          </label>
          {errorFor('collected')}
        </fieldset>

        {problem && <Banner>{problem}</Banner>}
        {existing && (
          <Button onClick={() => onOpen({ user_id: existing, name: '' })} className="w-full">
            Open {existing}
          </Button>
        )}

        <Button type="submit" variant="primary" disabled={busy} className="w-full py-2">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
          {busy ? 'Registering…' : 'Register and issue pass'}
        </Button>
      </form>
    </Card>
  );
}

/* ------------------------------------------------------------- team form */

interface MemberSlot {
  key: number;
  value: string;
  check: SpotMemberCheck | null;
  error: string | null;
  checking: boolean;
}

interface TeamBody {
  event_code: string;
  team_name: string;
  topic: string;
  member_user_ids: string[];
}

function MemberInput({
  slot,
  index,
  eventCode,
  canRemove,
  disabled,
  onChange,
  onRemove,
}: {
  slot: MemberSlot;
  index: number;
  eventCode: string;
  canRemove: boolean;
  disabled: boolean;
  onChange: (patch: Partial<MemberSlot>) => void;
  onRemove: () => void;
}) {
  const seq = useRef(0);
  const value = memberId(slot.value);

  useEffect(() => {
    // Every change bumps the sequence, so a lookup still in flight for what was
    // typed before can never land on the field after it has changed.
    const mine = ++seq.current;
    if (!USER_ID_RE.test(value)) {
      onChange({ check: null, error: null, checking: false });
      return;
    }
    onChange({ checking: true, error: null });
    const t = window.setTimeout(async () => {
      try {
        const res = await adminFetch<SpotMemberCheck>(
          `/api/admin/spot/check-member?${new URLSearchParams({ user_id: value, event: eventCode })}`,
        );
        if (seq.current === mine) onChange({ check: res, error: null, checking: false });
      } catch (e) {
        if (seq.current === mine) onChange({ check: null, error: errorText(e, 'Lookup failed.'), checking: false });
      }
    }, 350);
    return () => window.clearTimeout(t);
    // onChange is recreated by the parent on every render; the lookup depends
    // only on what was typed and which event it is for.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, eventCode]);

  const id = `spot-member-${slot.key}`;
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        Member {index + 1}
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id={id}
          value={slot.value}
          disabled={disabled}
          onChange={(e) => onChange({ value: tidyMemberInput(e.target.value) })}
          onFocus={(e) => {
            // Land after the prefilled ZIN26- rather than in front of it.
            const el = e.currentTarget;
            requestAnimationFrame(() => el.setSelectionRange(el.value.length, el.value.length));
          }}
          placeholder="ZIN26-0000"
          autoComplete="off"
          aria-describedby={`${id}-status`}
          className={cx(inputCls, 'font-mono uppercase')}
        />
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            aria-label={`Remove member ${index + 1}`}
            className="rounded-md border border-white/12 bg-white/5 px-2 text-white/40 hover:text-white disabled:opacity-40"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div id={`${id}-status`} aria-live="polite" className="mt-1 min-h-[18px] text-[12px]">
        {slot.checking && <span className="text-white/35">Checking…</span>}
        {!slot.checking && slot.error && <span className="text-rose-300">{slot.error}</span>}
        {!slot.checking && slot.check && (
          <span className={slot.check.blocked_reason ? 'text-rose-300' : 'text-emerald-300'}>
            {slot.check.name} · {slot.check.college}
            {slot.check.blocked_reason && ` — ${slot.check.blocked_reason}`}
          </span>
        )}
      </div>
    </div>
  );
}

function TeamForm({
  card,
  captain,
  prefill,
  busy,
  saving,
  onSubmit,
  onCancel,
}: {
  card: SpotCatalogCard;
  captain: SpotPerson;
  /** UserIDs registered in this group, in order; the captain's teammates are taken from here */
  prefill: string[];
  /** any action on this person's panel is running */
  busy: boolean;
  /** this team is the one being saved */
  saving: boolean;
  onSubmit: (body: TeamBody) => void;
  onCancel: () => void;
}) {
  const nextKey = useRef(1);
  const makeSlot = (value = MEMBER_PREFIX): MemberSlot => ({
    key: nextKey.current++,
    value,
    check: null,
    error: null,
    checking: false,
  });

  const [teamName, setTeamName] = useState('');
  const [topic, setTopic] = useState('');
  // A team registers member by member, then forms from the captain: the others
  // registered in this group fill the member fields, to be checked, not retyped.
  const [groupIds] = useState(() =>
    prefill.filter((id) => id !== captain.user_id).slice(0, Math.max(card.max_team - 1, 0)),
  );
  const [slots, setSlots] = useState<MemberSlot[]>(() =>
    Array.from({ length: Math.max(card.min_team - 1, 1, groupIds.length) }, (_, i) =>
      makeSlot(groupIds[i] ?? MEMBER_PREFIX),
    ),
  );
  const [problem, setProblem] = useState<string | null>(null);

  const patch = (key: number, p: Partial<MemberSlot>) => {
    setSlots((all) => all.map((s) => (s.key === key ? { ...s, ...p } : s)));
    // A message about what was typed before must not sit under what is typed now.
    if ('value' in p) setProblem(null);
  };

  const taken = new Set([captain.user_id, ...slots.map((s) => memberId(s.value)).filter(Boolean)]);
  const teamSize = slots.length + 1;

  const size =
    card.min_team === card.max_team ? `${card.min_team}` : `${card.min_team}–${card.max_team}`;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setProblem(null);

    const ids = slots.map((s) => memberId(s.value)).filter(Boolean);
    if (!teamName.trim()) return setProblem('Give the team a name.');
    if (card.asks_topic && !topic.trim()) return setProblem('Enter the topic the team will present.');
    if (ids.length + 1 < card.min_team)
      return setProblem(`${card.name} needs ${size} members, captain included.`);
    const bad = ids.find((id) => !USER_ID_RE.test(id));
    if (bad) return setProblem(`${bad} does not look like a UserID.`);

    // As on the participant dashboard: every member is looked up as their code
    // is typed, and the team goes in only once each one checks out.
    if (slots.some((sl) => sl.checking)) return setProblem('Wait for the member checks to finish.');
    const failed = slots.find((sl) => memberId(sl.value) && (sl.error || sl.check?.blocked_reason));
    if (failed) {
      const who = memberId(failed.value);
      return setProblem(
        failed.check?.blocked_reason
          ? `${who} cannot join: ${failed.check.blocked_reason}`
          : `${who}: ${failed.error}`,
      );
    }

    onSubmit({
      event_code: card.event_code,
      team_name: teamName.trim(),
      topic: card.asks_topic ? topic.trim() : '',
      member_user_ids: [captain.user_id, ...ids],
    });
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-lg border border-indigo-500/30 bg-indigo-500/[0.06] p-4"
    >
      <div className="flex items-start gap-3">
        <div>
          <div className="text-[14px] font-semibold text-white">Form a team · {card.name}</div>
          <div className="text-[12px] text-white/45">
            {size} members, captain included · confirmed straight away
          </div>
          {groupIds.length > 0 && (
            <div className="mt-0.5 text-[12px] text-indigo-200/80">
              Filled with this group's walk-ins - check each one before registering.
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          aria-label="Close team form"
          className="ml-auto text-white/40 hover:text-white disabled:opacity-30"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <fieldset disabled={busy} className="m-0 min-w-0 space-y-3 border-0 p-0">
        <div>
          <label htmlFor="spot-team-name" className={labelCls}>
            Team name
          </label>
          <input
            id="spot-team-name"
            value={teamName}
            onChange={(e) => {
              setTeamName(e.target.value);
              setProblem(null);
            }}
            className={cx(inputCls, 'mt-1')}
            autoComplete="off"
          />
        </div>

        {card.asks_topic && (
          <div>
            <label htmlFor="spot-team-topic" className={labelCls}>
              Presentation topic
            </label>
            <input
              id="spot-team-topic"
              value={topic}
              maxLength={160}
              onChange={(e) => {
                setTopic(e.target.value);
                setProblem(null);
              }}
              className={cx(inputCls, 'mt-1')}
              autoComplete="off"
            />
          </div>
        )}

        <div>
          <div className={labelCls}>Captain</div>
          <div className="mt-1 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-[13px] text-white/80">
            <span className="font-mono">{captain.user_id}</span> · {captain.name}
          </div>
        </div>

        {slots.map((s, i) => (
          <MemberInput
            key={s.key}
            slot={s}
            index={i + 1}
            eventCode={card.event_code}
            canRemove={teamSize > card.min_team}
            disabled={busy}
            onChange={(p) => patch(s.key, p)}
            onRemove={() => setSlots((all) => all.filter((x) => x.key !== s.key))}
          />
        ))}

        {teamSize < card.max_team && (
          <div>
            <Button onClick={() => setSlots((all) => [...all, makeSlot()])} disabled={busy}>
              <Plus className="w-3.5 h-3.5" />
              Add member
            </Button>
          </div>
        )}
      </fieldset>

      {problem && <Banner>{problem}</Banner>}

      <Button type="submit" variant="primary" disabled={busy} className="w-full py-2">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
        {saving ? 'Registering team…' : 'Register team'}
      </Button>
    </form>
  );
}

/* ----------------------------------------------------------- person panel */

function PersonPanel({
  userId,
  flash,
  passMail,
  onSendPass,
  group,
  onOpen,
}: {
  userId: string;
  flash: Notice | null;
  /** this person's pass email, if one has been sent from this page */
  passMail: PassMail | undefined;
  /** UserIDs registered since the last Refresh - a team arriving together */
  group: string[];
  onSendPass: (userId: string) => void;
  onOpen: (p: OpenTarget) => void;
}) {
  const deskOnly = isDeskOnly(useAdminAuth().user?.role);
  const { data, error, loading, reload } = useAdminQuery<SpotDetail>(
    `/api/admin/spot/participants/${encodeURIComponent(userId)}`,
    0,
  );
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const busyRef = useRef(false);
  const [notice, setNotice] = useState<Notice | null>(flash);
  const [problem, setProblem] = useState<string | null>(null);
  const [teamFor, setTeamFor] = useState<string | null>(null);
  // Kept apart from `notice`, which the next action replaces: a pass that
  // never reached the inbox stays visible until it has been re-sent.
  const emailFailed = passMail?.state === 'failed';
  const sendingPass = passMail?.state === 'sending';

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const stillHere = useCallback(() => mounted.current, []);

  const person = data?.participant;

  const groups = useMemo(() => {
    const open = (data?.catalog || []).filter((c) => c.state !== 'REGISTERED');
    return [
      { label: 'Technical', cards: open.filter((c) => c.category === 'TECH') },
      { label: 'Non-technical', cards: open.filter((c) => c.category === 'NON_TECH') },
    ].filter((g) => g.cards.length > 0);
  }, [data]);

  /**
   * One action at a time per person: while anything runs, every control on
   * this panel is disabled, so two writes cannot race past the 3-event cap
   * or the clash rules against the same stale read.
   */
  const act = async (key: string, run: () => Promise<{ message: string } | null>): Promise<boolean> => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusyKey(key);
    setProblem(null);
    setNotice(null);
    try {
      const res = await run();
      if (!mounted.current || !res) return false;
      setNotice({ tone: 'ok', text: res.message });
      await reload();
      return true;
    } catch (e) {
      if (mounted.current) {
        setProblem(errorText(e, 'That did not work.'));
        // A refused or unclear write: show what the server now holds.
        reload();
      }
      return false;
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusyKey(null);
    }
  };

  const who = person ? `${person.name} (${userId})` : userId;

  const register = (card: SpotCatalogCard) =>
    act(`reg:${card.event_code}`, () =>
      withWarningConfirm(
        (confirm) =>
          adminFetch<{ message: string }>('/api/admin/spot/events/register', {
            method: 'POST',
            body: JSON.stringify({ user_id: userId, event_code: card.event_code, confirm_warnings: confirm }),
          }),
        `${who} · ${card.name}`,
        stillHere,
      ),
    );

  const submitTeam = (card: SpotCatalogCard, body: TeamBody) =>
    act(`team:${card.event_code}`, () =>
      withWarningConfirm(
        (confirm) =>
          adminFetch<{ message: string }>('/api/admin/spot/teams', {
            method: 'POST',
            body: JSON.stringify({ ...body, confirm_warnings: confirm }),
          }),
        `${who} · ${card.name} team`,
        stillHere,
      ),
    ).then((ok) => {
      if (ok) setTeamFor((cur) => (cur === card.event_code ? null : cur));
    });

  const remove = (eventCode: string, eventName: string, isTeam: boolean, online: boolean) => {
    const what = isTeam
      ? `Cancel the ${eventName} team for ${who}?\n\nThis removes it for EVERY member of the team.`
      : `Remove ${eventName} for ${who}?`;
    const note = online ? '\n\nThis was registered ONLINE, and nobody will be emailed about the change.' : '';
    if (!window.confirm(what + note)) return;
    act(`cancel:${eventCode}`, () =>
      adminFetch<{ message: string }>('/api/admin/spot/events/cancel', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, event_code: eventCode }),
      }),
    );
  };


  if (loading && !data) {
    return (
      <Card>
        <Spinner label="Loading participant…" />
      </Card>
    );
  }
  if (!data || !person) {
    return (
      <Card>
        <div className="space-y-3 p-5">
          <Banner>{error || 'Participant not found.'}</Banner>
          <Button onClick={() => reload()}>
            <RotateCw className="w-3.5 h-3.5" />
            Try again
          </Button>
        </div>
      </Card>
    );
  }

  const approved = person.payment_status === 'APPROVED';
  const pay = data.payment;
  const busy = !!busyKey;

  return (
    <div className="space-y-4">
      {notice && <Banner tone={notice.tone}>{notice.text}</Banner>}
      {passMail && (
        <Banner tone={passMail.state === 'failed' ? 'warn' : 'ok'}>
          <span className="inline-flex items-center gap-2" aria-live="polite">
            {sendingPass && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {passMail.text}
          </span>
        </Banner>
      )}
      {problem && <Banner>{problem}</Banner>}
      {error && (
        <Banner tone="warn">
          Could not refresh this record: {error}{' '}
          <button type="button" onClick={() => reload()} className="font-semibold underline">
            Try again
          </button>
        </Banner>
      )}

      {/* the pass */}
      <Card>
        <div className="flex flex-col gap-5 p-5 sm:flex-row">
          <div className="shrink-0 self-start rounded-md bg-white p-2.5">
            {approved ? (
              <QRCodeSVG value={person.user_id} size={132} aria-label={`Master QR for ${person.user_id}`} />
            ) : (
              <div className="grid h-[132px] w-[132px] place-items-center text-center text-[11px] text-black/50">
                Pass issued once payment is approved
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-2xl font-semibold tracking-tight text-white">
                {person.user_id}
              </span>
              <CopyButton value={person.user_id} label="UserID" />
              <PaymentStatusChip status={person.payment_status} />
              {pay?.is_spot && <Chip tone="accent">On-spot</Chip>}
            </div>
            <div className="text-[15px] text-white/90">{person.name}</div>
            <div className="text-[12.5px] leading-relaxed text-white/50">
              {person.college}
              {person.department && ` · ${person.department}`}
              {person.year && ` · Year ${person.year}`}
              <br />
              {person.email} · {person.phone}
              {person.food_preference && ` · ${person.food_preference === 'VEG' ? 'Veg' : 'Non-veg'}`}
            </div>
            {pay && (
              <div className="font-mono text-[11.5px] text-white/40">
                ₹{pay.amount ?? '—'}
                {pay.txn_ref && ` · UTR ${pay.txn_ref}`}
                {pay.approval_note && ` · ${pay.approval_note}`}
              </div>
            )}
            {approved && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  onClick={() => onSendPass(userId)}
                  disabled={sendingPass}
                  variant={emailFailed ? 'primary' : 'ghost'}
                >
                  {sendingPass ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Resend pass email
                </Button>
                {emailFailed && (
                  <Chip tone="warn" title="The last attempt to email the pass failed">
                    Pass email not sent
                  </Chip>
                )}
              </div>
            )}
          </div>
        </div>
        {!approved && (
          <div className="px-5 pb-5">
            <Banner tone="warn">
              Payment is {person.payment_status.toLowerCase()}
              {pay?.txn_ref ? '' : ' and no payment was submitted'}, so no pass has been issued.{' '}
              {deskOnly ? (
                <>
                  Send them to the treasurer to approve it - the desk cannot. Events can still be registered here.
                </>
              ) : (
                <>
                  Open their record on{' '}
                  <Link
                    to={`/admin/payments?status=ALL&q=${encodeURIComponent(person.user_id)}`}
                    className="underline"
                  >
                    Payments
                  </Link>{' '}
                  to approve it - use Bypass for cash, and write down the amount taken. Events can still be
                  registered here.
                </>
              )}
            </Banner>
          </div>
        )}
      </Card>

      {/* events */}
      <Card>
        <SectionTitle title="Events" hint={`${data.counted_used} of ${data.counted_max} used`} />

        <div className="space-y-4 px-5 pb-5">
          {data.registrations.length > 0 ? (
            <ul className="divide-y divide-white/6 rounded-md border border-white/10">
              {data.registrations.map((r) => {
                const isTeam = !!r.team_id;
                const cancelKey = `cancel:${r.event_code}`;
                return (
                  <li key={r.reg_id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] text-white/90">{r.event_name}</div>
                      {isTeam && (
                        <div className="text-[11.5px] text-white/40">
                          Team {r.team_name}
                          {r.is_captain ? ' · captain' : ` · captain ${r.captain_user_id}`}
                          {r.status === 'PENDING_ACCEPTANCE' && ' · waiting on invites'}
                        </div>
                      )}
                    </div>
                    <Chip tone={r.source === 'SPOT' ? 'accent' : 'neutral'}>
                      {r.source === 'SPOT' ? 'Desk' : 'Online'}
                    </Chip>
                    {isTeam && !r.is_captain && r.captain_user_id ? (
                      <Button onClick={() => onOpen({ user_id: r.captain_user_id!, name: '' })} disabled={busy}>
                        Open captain
                      </Button>
                    ) : (
                      <Button
                        variant="danger"
                        disabled={busy}
                        onClick={() => remove(r.event_code, r.event_name, isTeam, r.source !== 'SPOT')}
                      >
                        {busyKey === cancelKey ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        {isTeam ? 'Cancel team' : 'Remove'}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-white/40">No events yet.</p>
          )}

          {groups.map((g) => (
            <div key={g.label}>
              <div className={cx(labelCls, 'mb-1.5')}>{g.label}</div>
              <ul className="space-y-1.5">
                {g.cards.map((c) => {
                  const available = c.state === 'AVAILABLE';
                  const size =
                    c.min_team === c.max_team ? `${c.min_team}` : `${c.min_team}–${c.max_team}`;
                  return (
                    <li key={c.event_code} className="rounded-md border border-white/8 bg-black/15">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <div className={cx('text-[13.5px]', available ? 'text-white/90' : 'text-white/40')}>
                            {c.name}
                            <span className="ml-2 font-mono text-[11px] text-white/30">
                              {c.max_team > 1 ? `team of ${size}` : 'solo'}
                            </span>
                          </div>
                          {!available && c.reason && (
                            <div className="text-[11.5px] text-white/35">{c.reason}</div>
                          )}
                          {available && c.warnings && c.warnings.length > 0 && (
                            <div className="text-[11.5px] text-amber-300/80">{c.warnings[0]}</div>
                          )}
                        </div>
                        {available ? (
                          c.is_team_event ? (
                            <Button
                              onClick={() => setTeamFor(teamFor === c.event_code ? null : c.event_code)}
                              disabled={busy}
                              aria-expanded={teamFor === c.event_code}
                            >
                              <Users className="w-3.5 h-3.5" />
                              Form team
                            </Button>
                          ) : (
                            <Button variant="primary" onClick={() => register(c)} disabled={busy}>
                              {busyKey === `reg:${c.event_code}` && (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              )}
                              Register
                            </Button>
                          )
                        ) : (
                          // evaluate_catalog files a passed close date under FULL too;
                          // the rule id tells the two apart.
                          <Chip tone={c.state === 'FULL' && c.rule !== 'R14' ? 'crit' : 'neutral'}>
                            {c.rule === 'R14' ? 'Closed' : c.state === 'FULL' ? 'Full' : 'Blocked'}
                          </Chip>
                        )}
                      </div>
                      {teamFor === c.event_code && available && (
                        <div className="px-3 pb-3">
                          <TeamForm
                            card={c}
                            captain={person}
                            prefill={group}
                            busy={busy}
                            saving={busyKey === `team:${c.event_code}`}
                            onCancel={() => setTeamFor(null)}
                            onSubmit={(body) => submitTeam(c, body)}
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ page */

/**
 * The desk, keyed by who is signed in and by Refresh: a different desk login,
 * or pressing Refresh, starts the page fresh - the walk-in form, the search,
 * the open person and the group all cleared at once, with no reload and no
 * server round trip. What must outlive a Refresh lives here: pass emails still
 * on their way (and any that failed), and the payment method this desk uses.
 */
export function SpotDesk() {
  const { user } = useAdminAuth();
  const [round, setRound] = useState(0);
  const [method, setMethod] = useState<SpotPaymentMethod>('CASH');
  const [passMail, setPassMail] = useState<Record<string, PassMail>>({});

  // Closing the tab mid-send would leave nobody knowing whether it went.
  const sendingAny = Object.values(passMail).some((m) => m.state === 'sending');
  useEffect(() => {
    if (!sendingAny) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [sendingAny]);

  /**
   * Email someone their pass. Called from event handlers only - right after a
   * walk-in registers, and by "Resend pass email" - never from an effect, so
   * a remount can never send it twice. It does not lock the panel: events can
   * be picked while the mail server takes its few seconds.
   */
  const sendPass = useCallback(async (userId: string) => {
    const uid = userId.toUpperCase();
    setPassMail((all) => ({ ...all, [uid]: { state: 'sending', text: 'Sending the pass email…' } }));
    try {
      const res = await adminFetch<{ message: string }>(
        `/api/admin/spot/participants/${encodeURIComponent(uid)}/send-pass`,
        { method: 'POST' },
      );
      setPassMail((all) => ({ ...all, [uid]: { state: 'sent', text: res.message } }));
    } catch (e) {
      setPassMail((all) => ({
        ...all,
        [uid]: { state: 'failed', text: errorText(e, 'The pass email could not be sent. Try Resend pass email.') },
      }));
    }
  }, []);

  return (
    <SpotDeskPage
      key={`${user?.username ?? ''}:${round}`}
      method={method}
      onMethodChange={setMethod}
      passMail={passMail}
      sendPass={sendPass}
      onRefresh={() => setRound((r) => r + 1)}
    />
  );
}

function SpotDeskPage({
  method,
  onMethodChange,
  passMail,
  sendPass,
  onRefresh,
}: {
  method: SpotPaymentMethod;
  onMethodChange: (m: SpotPaymentMethod) => void;
  passMail: Record<string, PassMail>;
  sendPass: (userId: string) => Promise<void>;
  onRefresh: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  // Bumped on every open, so opening the person already on screen still
  // remounts the panel and fetches them fresh.
  const [openCount, setOpenCount] = useState(0);
  const selectionEpoch = useRef(0);
  const [flash, setFlash] = useState<Notice | null>(null);
  // Walk-ins registered since the last Refresh: usually a team arriving
  // together. Forming the team from the captain fills the others in.
  const [group, setGroup] = useState<OpenTarget[]>([]);
  const [walkInBusy, setWalkInBusy] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const open = useCallback((p: OpenTarget, message: Notice | null = null) => {
    selectionEpoch.current += 1;
    setSelected(p.user_id.toUpperCase());
    setOpenCount((n) => n + 1);
    setFlash(message);
    // On a narrow screen the panel sits below the forms.
    window.setTimeout(() => panelRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 50);
  }, []);

  const groupIds = useMemo(() => group.map((g) => g.user_id), [group]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="text-lg font-semibold tracking-tight text-white">On-spot desk</h1>
        {group.length > 0 && (
          <span
            className="rounded border border-white/12 bg-white/5 px-2 py-0.5 font-mono text-[12px] text-white/55"
            title={groupIds.join(', ')}
          >
            this group: {group.length} registered
          </span>
        )}
        {/* Clears everything for the next participant or team. Waits while a
            walk-in is being saved, so a registration is never cut off. */}
        <Button className="ml-auto" onClick={onRefresh} disabled={walkInBusy}>
          <RotateCw className="w-3.5 h-3.5" />
          Refresh · next group
        </Button>
      </header>

      {/* A pass that failed to send, for someone the desk has already moved on
          from. The open person's own panel shows theirs. */}
      {Object.entries(passMail).some(([uid, m]) => m.state === 'failed' && uid !== selected) && (
        <Banner tone="warn">
          <div className="space-y-1.5">
            <div>Pass email not sent - the pass works, but it is not in their inbox:</div>
            {Object.entries(passMail)
              .filter(([uid, m]) => m.state === 'failed' && uid !== selected)
              .map(([uid]) => (
                <div key={uid} className="flex flex-wrap items-center gap-2">
                  <span className="font-mono">{uid}</span>
                  <Button onClick={() => open({ user_id: uid, name: '' })}>Open</Button>
                  <Button onClick={() => void sendPass(uid)}>
                    <Send className="w-3.5 h-3.5" />
                    Resend
                  </Button>
                </div>
              ))}
          </div>
        </Banner>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,430px)_minmax(0,1fr)]">
        {/* Left on a desktop, first on a phone: the next walk-in. */}
        <WalkInCard
          initialMethod={method}
          onMethodChange={onMethodChange}
          onBusyChange={setWalkInBusy}
          onOpen={(p) => open(p)}
          onCreated={(person, message) => {
            setGroup((g) =>
              g.some((x) => x.user_id === person.user_id) ? g : [...g, { user_id: person.user_id, name: person.name }],
            );
            open(person, { tone: 'ok', text: message });
            void sendPass(person.user_id);
          }}
        />

        {/* Right on a desktop, below the walk-in on a phone: find someone, and their panel. */}
        <div className="space-y-4 min-w-0">
          <FindCard onOpen={(p) => open(p)} selectionEpoch={selectionEpoch} />

          <div ref={panelRef} className="scroll-mt-20">
            {selected ? (
              <PersonPanel
                key={`${selected}:${openCount}`}
                userId={selected}
                flash={flash}
                passMail={passMail[selected]}
                onSendPass={(uid) => void sendPass(uid)}
                group={groupIds}
                onOpen={(p) => open(p)}
              />
            ) : (
              <Card>
                <div className="px-5 py-12 text-center">
                  <UserPlus className="mx-auto h-6 w-6 text-white/20" />
                  <p className="mt-3 text-sm text-white/50">
                    Register a walk-in, or find someone who is already registered.
                  </p>
                  <p className="mt-1 text-[12.5px] text-white/30">
                    For a team: register each member, then find the captain and Form team - the others fill in.
                    Refresh clears everything for the next group.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
