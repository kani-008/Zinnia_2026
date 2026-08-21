# ZINNIA 2026 — System Architecture Documentation

## Overview
ZINNIA 2026 is an enterprise-grade symposium platform for the Computer Science & Engineering department, framed within the **Black Cipher / Temporal Core / CHRONOS** sci-fi investigation narrative.

## Monorepo Architecture

```
zinnia/
│
├── apps/
│   ├── website/         # Public Zinnia experience (zinnia.in)
│   └── admin/           # Operational Admin Portal (admin.zinnia.in)
│
├── packages/
│   ├── types/           # Shared TypeScript interfaces
│   ├── ui/              # Shared UI components & design system tokens
│   ├── utils/           # Participant ID generation, QR cryptography, date formatters
│   └── config/          # Official missions, timetable, symposium coordinates
│
├── supabase/
│   ├── migrations/      # 001_create_schema.sql (PostgreSQL tables, indexes, RLS)
│   └── seed/            # Seed data for missions and initial telemetry
│
└── docs/                # Architectural, database, deployment, and security manuals
```

## Security & Verification Lifecycle
```
Participant Registers
       ↓
Generates Cryptographic Agent ID (ZIN26-XXXXXX)
       ↓
Issues Digital Symposium Passport + Single QR Token
       ↓
Scan at Campus Gate (Entry Verification)
       ↓
Scan at Food Counter (Lunch Token Redemption with anti-duplicate guard)
       ↓
Scan at Mission Desks (Check if registered for specific mission)
       ↓
Issuance of Verified Cryptographic E-Certificates
       ↓
1-Click Excel Workbooks Export (.xlsx)
```
