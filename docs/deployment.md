# ZINNIA 2026 — Production Deployment Guide

## Vercel / Netlify Setup

### 1. Deploy Public Website (`zinnia.in`)
- Root Directory: `apps/website` or monorepo root
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables:
  ```env
  VITE_SUPABASE_URL=https://xyz.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
  VITE_SITE_URL=https://zinnia.in
  VITE_ADMIN_URL=https://admin.zinnia.in
  ```

### 2. Deploy Admin Portal (`admin.zinnia.in`)
- Connect domain `admin.zinnia.in`
- Both apps connect to the same Supabase database.
