export const REGISTRATION_FEE_PER_HEAD = 250;

// Walk-in registration at the venue on the event day. Online stays 250; the
// difference is the incentive to register ahead. Display only - the backend
// still records the online fee, walk-ins are handled at the desk.
export const ON_SPOT_REGISTRATION_FEE = 300;

export const TREASURER_PAYMENT_CONFIG = {
  upiId: (import.meta.env.VITE_TREASURER_UPI_ID as string) || 'kanishkar.m06-1@oksbi',
  payeeName: (import.meta.env.VITE_TREASURER_PAYEE_NAME as string) || 'Kanishkar M',
};

// Participants' WhatsApp group invite (D11).
//
// Handed over at registration alongside the UserID -- it appears on the
// post-registration success screen, in EMAIL #1, and permanently on the
// dashboard, so it lives here rather than inline in three components. WhatsApp
// invite links are revocable: when coordinators rotate the group, this is the
// only place to change, and VITE_WHATSAPP_GROUP_URL overrides it without a
// rebuild of the constant.
export const PARTICIPANTS_WHATSAPP_GROUP_URL =
  (import.meta.env.VITE_WHATSAPP_GROUP_URL as string) ||
  'https://chat.whatsapp.com/DthX9rMcTk9BgLh3gQOHx6?s=sw&p=a&mlu=0&ilr=4';

export const REGISTRATION_USER_MANUAL_URL =
  (import.meta.env.VITE_REGISTRATION_USER_MANUAL_URL as string) ||
  'https://drive.google.com/file/d/1mWcxWw88khKUkovE3mqnjJMCS79JulSh/view?usp=sharing';

export const SITE_CONFIG = {
  name: 'ZINNIA 2026',
  tagline: 'CSE Department Symposium // CHRONOS Temporal Protocol',
  date: '24 September 2026',
  time: '09:00 AM - 04:30 PM',
  venue: 'Department of Computer Science & Engineering, Campus Quadrangle',
  primaryEmail: 'zinnia2026@gcee.ac.in',
  registrationFeePerHead: REGISTRATION_FEE_PER_HEAD,
  payment: TREASURER_PAYMENT_CONFIG,
  whatsappGroupUrl: PARTICIPANTS_WHATSAPP_GROUP_URL,
  userManualUrl: REGISTRATION_USER_MANUAL_URL,
};

// Progress indicator for the registration flow (§4.1). One constant so every
// screen draws the same four steps in the same order.
export const REGISTRATION_STEPS = ['Personal details', 'Email OTP', 'Payment', 'Confirmation'];
