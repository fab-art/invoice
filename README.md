# RSSB Pharmacy Invoice Reception System (Local-First)

A serverless Progressive Web App (PWA) for receiving and tracking pharmaceutical
voucher/invoice submissions from pharmacies for RSSB reimbursement.

**Everything runs in the browser — there's no login, no accounts, and no
backend.** Open it and start working. All data (pharmacies, submissions,
billing periods) is stored on-device in IndexedDB.

## Features

- **Reception desk workflow**: search a pharmacy, check off required
  documents, enter voucher count / invoice total, and generate a printable
  receipt confirming what was received.
- **Live counters**: submissions received today, and how many pharmacies
  (out of the full served list) still haven't submitted this period.
- **Daily reports**: filter by date, view totals, export to Excel or PDF,
  and email the report to a supervisor.
- **Verification & payments**: review submissions, mark them verified, then
  mark **paid** with a payment ID.
- **Pharmacy management**: add/edit pharmacies one at a time, or bulk-import
  from an Excel/CSV file.
- **PWA**: installable on desktop/mobile, works offline once loaded.
- **Local data**: everything is stored in the browser's IndexedDB via the
  `idb` library — nothing leaves the device.

## Tech stack

- React + Vite (`vite-plugin-pwa` for the PWA manifest/service worker)
- `react-router-dom` for client-side routing
- IndexedDB (via `idb`) for local, serverless data storage
- `xlsx` for Excel import/export, `jspdf`/`jspdf-autotable` for PDF reports,
  `react-to-print` for receipt printing

## Run it locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

On first load, the app seeds:

- **10 real pharmacies** (name, code, district) drawn from the served-provider
  list, so the workflow can be tried with realistic data immediately.
- **12 monthly billing periods** for the current year (Jan–Dec), with the
  current month set active. Switch the active period from the dropdown at
  the top of **Verification** — submissions and the "remaining pharmacies"
  counter are always scoped to whichever period is active.
- The full list of **Rwanda's 30 districts** as a dropdown when adding or
  editing a pharmacy, instead of free-text entry.

There's nothing to sign in with. The nav bar has a **"Set your name"**
button — that's just a label printed on receipts/reports for whoever is
working the desk, stored locally, and it's entirely optional.

## Pages

| Route | Purpose |
|---|---|
| `/` | Reception desk — log a new submission and print/email a receipt |
| `/reports` | Daily report — filter by date, export Excel/PDF, email a supervisor |
| `/verification` | Review submissions, verify them, mark as paid |
| `/pharmacies` | Add, edit, or bulk-import pharmacies |

## Email drafting

Since this app has no backend/mail server, "emailing" a receipt or report
opens a pre-filled draft in the operator's own default mail client via a
`mailto:` link — the operator reviews it and attaches the just-downloaded
PDF/receipt themselves before hitting send. Set a pharmacy's email address
in **Pharmacies**, and a supervisor email once from **Reports**, and those
addresses will pre-fill automatically from then on.

## Design

The interface uses a "public ledger" identity: deep navy (`#1b2a6b`) and
gold accents on a pale paper background, with a printed-receipt look for
the physical handoff. Layout is mobile-first and responsive — the nav
collapses to a hamburger menu and data tables become stacked cards on
narrow screens, so the whole workflow is usable on a phone or tablet as
well as a desktop.

## Data persistence & reset

Data lives in IndexedDB under the database name `rssb-reception-db`, scoped
to the browser/profile you're using. To fully reset the demo data (start
fresh), open DevTools > Application > IndexedDB and delete that database,
then reload.

Note: since this is local-only, data does **not** sync between devices or
browsers, and clearing browser storage will erase it.

## Deploy to Vercel

This repo is preconfigured for a static Vite deployment:

1. Push this folder to a GitHub repo.
2. In Vercel, **Add New Project** → import the repo. `vercel.json` pins the
   build command (`npm run build`) and output directory (`dist`) explicitly.
3. No environment variables are required — this is fully local-first.
4. `vercel.json` also adds:
   - A SPA rewrite so client-side routes (`/reports`, `/verification`, ...)
     resolve to `index.html` instead of 404ing on refresh.
   - Long-lived immutable caching for hashed files under `/assets/*`.
   - No-cache headers for the PWA service worker/manifest so installed
     clients pick up updates promptly.

Because all data lives in the visitor's browser (IndexedDB), every device
that opens the deployed URL starts with its own independent, freshly-seeded
copy.

## Verified working

- `npm install` completes cleanly.
- `npm run build` produces a working production bundle (`dist/`).
- `npm run preview` serves the built app and the page loads correctly.
- `npm run lint` passes with no errors.

## Next steps (optional, if you outgrow local-only)

1. **Swap in a real backend** — introduce a shared database (e.g. Supabase)
   so data is shared across devices and persists centrally. `localDb.js` is
   written so each function (`listPharmacies`, `createSubmission`, etc.)
   maps cleanly onto real API calls — pages themselves won't need to change.
2. **Real accounts**, if multiple people need distinct audit trails rather
   than a shared per-device operator name.
3. **Send email server-side** (e.g. via SendGrid) instead of `mailto:`
   drafts, so confirmations go out without the operator's own mail client.
