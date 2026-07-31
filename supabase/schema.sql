-- ============================================================
-- RSSB Pharmacy Invoice Reception System — Supabase Schema
--
-- Run this once in the Supabase SQL editor (Project > SQL Editor).
-- No ORM / migration tool is used — the app talks to these tables
-- directly via @supabase/supabase-js. Column names are quoted
-- camelCase to match the JSON shapes the app already expects.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. USERS (app-level auth: bcrypt password + iron-session cookie,
--    NOT Supabase Auth — this app manages its own login)
-- ------------------------------------------------------------
create table if not exists public."User" (
  id text primary key default gen_random_uuid()::text,
  email text unique not null,
  password text not null,
  "fullName" text not null,
  role text not null default 'RECEPTIONIST',
  "createdAt" timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. PHARMACIES
-- ------------------------------------------------------------
create table if not exists public."Pharmacy" (
  id text primary key default gen_random_uuid()::text,
  "pharmacyCode" text unique not null,
  "pharmacyName" text not null,
  district text not null,
  sector text not null default '',
  "contactPerson" text not null default '',
  phone text not null default '',
  email text not null default '',
  active boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists "idx_Pharmacy_pharmacyName" on public."Pharmacy" ("pharmacyName");
create index if not exists "idx_Pharmacy_active" on public."Pharmacy" (active);

-- ------------------------------------------------------------
-- 3. SUBMISSION PERIODS
-- ------------------------------------------------------------
create table if not exists public."SubmissionPeriod" (
  id text primary key default gen_random_uuid()::text,
  label text not null,
  "startDate" timestamptz not null,
  "endDate" timestamptz not null,
  "isActive" boolean not null default false,
  "createdAt" timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4. SUBMISSIONS
-- ------------------------------------------------------------
create table if not exists public."Submission" (
  id text primary key default gen_random_uuid()::text,
  "receiptNumber" text unique not null,
  "pharmacyId" text not null references public."Pharmacy"(id),
  "periodId" text not null references public."SubmissionPeriod"(id),
  "voucherCount" integer not null default 0,
  "invoiceTotalAmount" double precision not null default 0,
  "submittedByName" text not null,
  "submittedByPosition" text not null default '',
  "receivedById" text not null references public."User"(id),
  "receivedAt" timestamptz not null default now(),
  status text not null default 'SUBMITTED',
  "verifiedById" text references public."User"(id),
  "verifiedAt" timestamptz,
  "paymentId" text,
  "paidAmount" double precision,
  "paidAt" timestamptz,
  notes text not null default '',
  "createdAt" timestamptz not null default now()
);

create index if not exists "idx_Submission_pharmacyId" on public."Submission" ("pharmacyId");
create index if not exists "idx_Submission_periodId" on public."Submission" ("periodId");
create index if not exists "idx_Submission_status" on public."Submission" (status);
create index if not exists "idx_Submission_receivedAt" on public."Submission" ("receivedAt");

-- ------------------------------------------------------------
-- NOTE on security: this app does NOT use Supabase Auth or RLS.
-- All access goes through Next.js API routes using the
-- SUPABASE_SERVICE_ROLE_KEY (server-side only), with the app's own
-- iron-session cookie handling authorization. Do not expose the
-- service-role key to the browser. If you later want to also allow
-- direct client-side access via the anon key, enable RLS and add
-- policies for each table first.
-- ------------------------------------------------------------
