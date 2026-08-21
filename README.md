# ZINNIA 2026 — Master Symposium & Verification Platform

> **CSE Department National-Level Technical Symposium**  
> *Theme: The Black Cipher Temporal Investigation & Chronos Protocol*

---

## 🏛️ Monorepo Architecture

```
zinnia/
│
├── apps/
│   ├── website/         # Public Zinnia Web Experience (zinnia.in)
│   └── admin/           # Dedicated Operational Admin Portal (admin.zinnia.in)
│
├── packages/
│   ├── types/           # Shared TypeScript types
│   ├── ui/              # Shared reusable UI component library
│   ├── utils/           # ID formatters, cryptographic QR encoders & date utils
│   └── config/          # Symposium constants, official missions & configs
│
├── supabase/
│   ├── migrations/      # 001 to 007 SQL schema migrations with RLS
│   ├── functions/       # Supabase Edge Functions (passports, certificates, email)
│   └── seed/            # Seed data (events & admin users)
│
└── docs/                # System architecture, database schema, & deployment guides
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.x
- npm / pnpm

### Installation
```bash
npm install
```

### Running Locally
```bash
# Run public website
npm run dev

# Or build production bundle
npm run build
```

---

## 🛡️ Core Capabilities
- **Public Portal**: Black Cipher interactive 3D-styled Temporal Core, 8-chapter incident dossier, timeline anomaly explorer, 9 official symposium operations, 3-step registration wizard, and Digital Symposium Passport with high-contrast QR code.
- **Admin Portal**: Multi-station operations (Gate Entry, Food/Snack token redemption, Mission access check-in), camera QR scanner with manual fallback, participant dossier manager, certificate generator, and 1-click Excel (.xlsx) exports.
- **Backend**: PostgreSQL database with Row Level Security (RLS) on Supabase.
