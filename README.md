# RSSB Pharmacy Invoice Reception System (Local-First Version)

A serverless Progressive Web App (PWA) for receiving and tracking pharmaceutical
voucher/invoice submissions from pharmacies for RSSB reimbursement, with an
admin dashboard for verification and payment tracking.

**This version runs entirely in the browser, storing all data in IndexedDB.**
No backend, no account setup, no API keys needed — just run it and go. This
is meant as a fast way to try the full workflow locally before we wire in a
real backend (Supabase), authentication, and email receipts as a next step.

## Features

- **Reception desk workflow**: search a pharmacy, check off required
  documents, enter voucher count / invoice total, and generate a printable
  receipt confirming what was received.
- **Live counters**: submissions received today, and how many pharmacies
  (out of the full served list) still haven't submitted this period.
- **Daily reports**: filter by date, view totals, export to Excel.
- **Admin dashboard**: add/edit/bulk-import pharmacies (Excel), review
  submissions, mark them verified, then mark **paid** with a payment ID.
- **PWA**: installable on desktop/mobile.
- **Local data**: everything (pharmacies, submissions, users) is stored in
  the browser's IndexedDB via the `idb` library — nothing leaves the device.

## Tech stack

- React + Vite (`vite-plugin-pwa` for the PWA manifest/service worker)
- IndexedDB (via `idb`) for local, serverless data storage
- `xlsx` for Excel import/export, `react-to-print` for receipt printing

## Run it locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

On first load, the app seeds:

- Two demo accounts (below).
- **10 real pharmacies** (name, code, district) drawn from the served-provider
  list, so the workflow can be tried with realistic data immediately.
- **12 monthly billing periods** for the current year (Jan–Dec), with the
  current month set active. Admins can switch the active period from a
  dropdown at the top of the **Admin** dashboard — submissions and the
  "remaining pharmacies" counter are always scoped to whichever period is
  active.
- The full list of **Rwanda's 30 districts** as a dropdown when adding or
  editing a pharmacy (Pharmacy Manager), instead of free-text entry.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@rssb.local` | `admin123` |
| Receptionist | `reception@rssb.local` | `reception123` |

Sign in as **admin** first to review the seeded pharmacies, add more (one by
one, or bulk import an Excel file with columns `pharmacy_code`,
`pharmacy_name`, `district`, `sector`, `contact_person`, `phone`, `email`)
under **Pharmacies**. Then switch to reception and try submitting a voucher
batch — it prints a receipt styled as an official ledger slip with a
"Received · RSSB" seal mark.

## Design

The interface uses a "public ledger" identity: deep RSSB green (`#0b6b43`)
on a pale sage paper background, `Fraunces` for headings (an official-form
feel) paired with `Inter` for body text and `IBM Plex Mono` for the printed
receipt and tabular data. The one signature element is the printed receipt's
rotated bronze seal — everything else stays quiet and functional so the
data-dense screens (tables, forms, dashboards) stay easy to scan.

## Data persistence & reset

Data lives in IndexedDB under the database name `rssb-reception-db`, scoped
to the browser/profile you're using. To fully reset the demo data (start
fresh), open DevTools > Application > IndexedDB and delete that database,
then reload — it will reseed the two demo accounts.

Note: since this is local-only, data does **not** sync between devices or
browsers, and clearing browser storage will erase it. That's expected for
this stage — see "Next steps" below.

## Deploy to Vercel

This repo is preconfigured for a static Vite deployment:

1. Push this folder to a GitHub repo.
2. In Vercel, **Add New Project** → import the repo. Vercel auto-detects
   the Vite framework preset; `vercel.json` pins the build command
   (`npm run build`) and output directory (`dist`) explicitly so it works
   even without auto-detection.
3. No environment variables are required for this local-first version.
4. `vercel.json` also adds:
   - A SPA rewrite so client-side routes (`/reports`, `/admin`, ...) resolve
     to `index.html` instead of 404ing on refresh.
   - Long-lived immutable caching for hashed files under `/assets/*`.
   - No-cache headers for the PWA service worker/manifest so installed
     clients pick up updates promptly.
5. An `.nvmrc` / `engines.node` pin (`>=18.18.0`) keeps the Vercel build
   environment consistent with local development.

Because all data lives in the visitor's browser (IndexedDB), every device
that opens the deployed URL starts with its own independent, freshly-seeded
copy — see "Next steps" below for wiring in a shared backend.

## Verified working

- `npm install` completes cleanly.
- `npm run build` produces a working production bundle (`dist/`).
- `npm run preview` serves the built app and the page loads correctly.

## Next steps (once you're happy with the workflow)

1. **Swap in a real backend** — re-introduce Supabase (Postgres + Auth +
   Row Level Security) so data is shared across devices and persists
   centrally. The `localDb.js` file is written so each function
   (`listPharmacies`, `createSubmission`, etc.) maps cleanly onto Supabase
   queries — the pages themselves won't need to change much.
2. **Add email receipts** — re-introduce the SendGrid serverless function
   once deployed to Vercel, so pharmacies with an email on file get an
   automatic confirmation.
3. **Deploy** — push to GitHub, import into Vercel (a `vercel.json` is
   already included), add environment variables for Supabase/SendGrid at
   that point.
4. Other ideas: multi-period management UI, receptionist activity log,
   role-based account creation from the Admin panel, offline queueing for
   true offline-first support.
