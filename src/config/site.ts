export const REGISTRATION_FEE_PER_HEAD = 250;

export const TREASURER_PAYMENT_CONFIG = {
  upiId: (import.meta.env.VITE_TREASURER_UPI_ID as string) || '9361817740@axl',
  payeeName: (import.meta.env.VITE_TREASURER_PAYEE_NAME as string) || 'Treasurer, Zinnia 2026',
  qrImagePath: '/src/assets/treasurer-upi-qr.png',
};

export const SITE_CONFIG = {
  name: 'ZINNIA 2026',
  tagline: 'CSE Department Symposium // CHRONOS Temporal Protocol',
  date: '24 September 2026',
  time: '09:00 AM - 04:30 PM',
  venue: 'Department of Computer Science & Engineering, Campus Quadrangle',
  primaryEmail: 'zinnia2026@gcee.ac.in',
  registrationFeePerHead: REGISTRATION_FEE_PER_HEAD,
  payment: TREASURER_PAYMENT_CONFIG,
};
