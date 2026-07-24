# RSSB Pharmacy Invoice Reception System

A serverless Progressive Web App (PWA) for receiving and tracking pharmaceutical
voucher/invoice submissions from pharmacies for RSSB reimbursement, with an
admin dashboard for verification and payment tracking.

## Features

- **Reception desk workflow**: search a pharmacy, check off required
  documents, enter voucher count / invoice total, and generate a printable
  receipt confirming what was received.
- **Live counters**: submissions received today, and how many pharmacies
  (out of the full served list) still haven't submitted this period.
- **Daily / period reports**: filter by date, view totals, export to Excel.
- **Admin dashboard**: add/edit/bulk-import pharmacies (Excel), review
  submissions, mark them verified, then mark **paid** with a payment ID.
- **Email receipts**: an automatic confirmation email is sent to the
  pharmacy (if an email is on file) via SendGrid, through a Vercel
  serverless function — your SendGrid key never touches the browser.
- **PWA**: installable on desktop/mobile, works offline for the shell
  (data operations require connectivity to Supabase).
- **Auth & data**: Supabase handles authentication and Postgres storage,
  with Row Level Security so receptionists and admins have different
  permissions.

## Tech stack

- React + Vite (`vite-plugin-pwa` for the PWA manifest/service worker)
- Supabase (Postgres + Auth + Row Level Security)
- Vercel (hosting + one serverless function for SendGrid)
- SendGrid (email delivery)
- `xlsx` (Excel import/export), `react-to-print` (receipt printing)

---

## 1. Set up Supabase

1. Create a project at https://supabase.com.
2. Open **SQL Editor** and run the contents of `supabase/schema.sql`.
   This creates all tables, the receipt-number generator, RLS policies,
   and a helper view for tracking remaining pharmacies.
3. Go to **Authentication > Users** and create your first user (or have
   them sign up); a `profiles` row is auto-created with role
   `receptionist`.
4. Promote that user to admin by running in SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where id = '<their-auth-uid>';
   ```
   (Find the UID in Authentication > Users.)
5. From **Project Settings > API**, copy the **Project URL** and
   **anon public key** — you'll need these for `.env`.

Create further staff accounts either directly in the Supabase
Authentication tab, or extend the Admin dashboard later with an invite
flow (Supabase supports `auth.admin.inviteUserByEmail` from a
service-role context, e.g. another serverless function, if you want
self-service invites).

## 2. Set up SendGrid

1. Create a SendGrid account and verify a **Single Sender** or a domain
   under **Settings > Sender Authentication**. Since your own inbox is
   Outlook, you can verify your Outlook address as the sender identity,
   or better, verify a domain you control and send from an address like
   `reception@yourdomain.com`.
2. Create an **API Key** (Settings > API Keys) with "Mail Send" access.
3. You'll add this key as `SENDGRID_API_KEY` in Vercel (never in the
   frontend `.env`).

## 3. Local development

```bash
npm install
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
npm run dev
```

The SendGrid serverless function (`api/send-receipt-email.js`) only runs
under Vercel's dev server or once deployed. To test it locally, install
the Vercel CLI and run `vercel dev` instead of `npm run dev`, with
`SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME` set in a
`.env` file (Vercel CLI reads `.env` for both frontend and functions).

## 4. Deploy: GitHub → Vercel

1. Push this project to a new GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: RSSB invoice reception system"
   git branch -M main
   git remote add origin https://github.com/<you>/rssb-invoice-reception.git
   git push -u origin main
   ```
2. In Vercel, click **New Project**, import the GitHub repo. Vercel
   auto-detects Vite (the included `vercel.json` pins the build command
   and output directory, and rewrites all non-`/api` routes to
   `index.html` for client-side routing).
3. In **Project Settings > Environment Variables**, add:
   | Name | Value | Notes |
   |---|---|---|
   | `VITE_SUPABASE_URL` | your Supabase project URL | exposed to browser |
   | `VITE_SUPABASE_ANON_KEY` | your Supabase anon key | exposed to browser, safe due to RLS |
   | `SENDGRID_API_KEY` | your SendGrid key | server-only, do not prefix with `VITE_` |
   | `SENDGRID_FROM_EMAIL` | your verified sender email | server-only |
   | `SENDGRID_FROM_NAME` | e.g. `RSSB Pharmacy Invoice Reception` | server-only |
4. Deploy. Every push to `main` redeploys automatically.
5. Visit the deployed URL — on mobile, use "Add to Home Screen" to
   install the PWA at the reception desk.

## 5. Day-to-day usage

- **Reception page (`/`)**: default view for receptionists. Search the
  pharmacy, tick off requirements, enter voucher count, submit — this
  saves the record and opens the print dialog for the physical receipt.
- **Reports (`/reports`)**: pick a date to see totals and export to
  Excel for handover / archiving.
- **Admin (`/admin`)**, admins only: review submissions by status,
  move them through `submitted → under_review → verified`, then
  **Mark paid** with the RSSB payment reference ID.
- **Pharmacies (`/admin/pharmacies`)**, admins only: add pharmacies one
  by one, or bulk-import an Excel file with columns `pharmacy_code`,
  `pharmacy_name`, `district`, `sector`, `contact_person`, `phone`,
  `email`. Re-importing with the same `pharmacy_code` updates existing
  rows instead of duplicating them.

## 6. Submission periods ("remaining pharmacies" tracking)

The schema seeds one active `submission_periods` row for the current
month. "Remaining pharmacies" is computed as: all active pharmacies
minus those with at least one submission in the active period. To start
a new period (e.g. next month), insert a new row and set the old one's
`is_active` to `false`:

```sql
update public.submission_periods set is_active = false where is_active = true;
insert into public.submission_periods (label, start_date, end_date, is_active)
values ('August 2026', '2026-08-01', '2026-08-31', true);
```

You can wrap this in a small admin UI later if you want it self-service.

## Notes on security

- The Supabase anon key is safe to expose in the frontend — every table
  is protected by Row Level Security policies (see `schema.sql`), so
  only authenticated staff can read data, and only admins can edit the
  pharmacy master list or mark payments.
- The SendGrid key lives only in Vercel's serverless environment and is
  never sent to the browser.
