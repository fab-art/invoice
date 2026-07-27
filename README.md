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

On first load, the app seeds two demo accounts automatically:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@rssb.local` | `admin123` |
| Receptionist | `reception@rssb.local` | `reception123` |

Sign in as **admin** first and add a few pharmacies (one by one, or bulk
import an Excel file with columns `pharmacy_code`, `pharmacy_name`,
`district`, `sector`, `contact_person`, `phone`, `email`) under
**Pharmacies**. Then switch to reception and try submitting a voucher batch.

## Data persistence & reset

Data lives in IndexedDB under the database name `rssb-reception-db`, scoped
to the browser/profile you're using. To fully reset the demo data (start
fresh), open DevTools > Application > IndexedDB and delete that database,
then reload — it will reseed the two demo accounts.

Note: since this is local-only, data does **not** sync between devices or
browsers, and clearing browser storage will erase it. That's expected for
this stage — see "Next steps" below.

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
