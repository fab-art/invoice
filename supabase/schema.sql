-- ============================================================
-- RSSB Pharmacy Invoice Reception System — Supabase Schema
-- Run this in the Supabase SQL editor (Project > SQL Editor)
-- ============================================================

-- Extension for UUID generation
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. PROFILES (extends Supabase auth.users with role info)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'receptionist' check (role in ('admin', 'receptionist')),
  created_at timestamptz default now()
);

-- Auto-create a profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'receptionist');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- 2. PHARMACIES (master list of pharmacies served)
-- ------------------------------------------------------------
create table if not exists public.pharmacies (
  id uuid primary key default gen_random_uuid(),
  pharmacy_code text unique not null,
  pharmacy_name text not null,
  district text not null,
  sector text,
  contact_person text,
  phone text,
  email text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_pharmacies_code on public.pharmacies (pharmacy_code);
create index if not exists idx_pharmacies_district on public.pharmacies (district);

-- ------------------------------------------------------------
-- 3. SUBMISSION PERIODS (e.g. monthly reimbursement cycles)
--    Lets you track "remaining pharmacies" per cycle
-- ------------------------------------------------------------
create table if not exists public.submission_periods (
  id uuid primary key default gen_random_uuid(),
  label text not null,           -- e.g. "July 2026"
  start_date date not null,
  end_date date not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 4. SUBMISSIONS (one row per pharmacy invoice reception event)
-- ------------------------------------------------------------
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  receipt_number text unique not null,
  pharmacy_id uuid not null references public.pharmacies(id),
  period_id uuid references public.submission_periods(id),

  voucher_count integer not null default 0,
  invoice_total_amount numeric(14,2),

  -- Requirement checklist (extend as needed)
  req_signed_vouchers boolean default false,
  req_summary_sheet boolean default false,
  req_stamped_invoice boolean default false,
  req_prescription_copies boolean default false,
  req_bank_details boolean default false,
  requirements_notes text,

  -- Person from the pharmacy who physically delivered the documents
  submitted_by_name text,
  submitted_by_position text,
  submitted_by_contact text,

  received_by uuid references public.profiles(id),
  received_at timestamptz default now(),

  -- Admin verification / payment tracking
  status text not null default 'submitted'
    check (status in ('submitted', 'under_review', 'verified', 'rejected', 'paid')),
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  payment_id text,
  paid_amount numeric(14,2),
  paid_at timestamptz,

  notes text,
  created_at timestamptz default now()
);

create index if not exists idx_submissions_pharmacy on public.submissions (pharmacy_id);
create index if not exists idx_submissions_period on public.submissions (period_id);
create index if not exists idx_submissions_status on public.submissions (status);
create index if not exists idx_submissions_received_at on public.submissions (received_at);

-- Receipt number generator: RSSB-YYYYMMDD-#### (sequence per day)
create sequence if not exists receipt_seq;

create or replace function public.generate_receipt_number()
returns text as $$
declare
  today_str text := to_char(now(), 'YYYYMMDD');
  seq_val int;
begin
  seq_val := nextval('receipt_seq');
  return 'RSSB-' || today_str || '-' || lpad(seq_val::text, 5, '0');
end;
$$ language plpgsql;

-- ------------------------------------------------------------
-- 5. AUDIT LOG (simple activity trail)
-- ------------------------------------------------------------
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity text,
  entity_id text,
  details jsonb,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.pharmacies enable row level security;
alter table public.submission_periods enable row level security;
alter table public.submissions enable row level security;
alter table public.audit_log enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer;

-- Profiles: users can read their own; admins can read/update all
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin());

-- Pharmacies: any authenticated user can read; only admins can write
create policy "pharmacies_select_auth" on public.pharmacies
  for select using (auth.role() = 'authenticated');
create policy "pharmacies_insert_admin" on public.pharmacies
  for insert with check (public.is_admin());
create policy "pharmacies_update_admin" on public.pharmacies
  for update using (public.is_admin());
create policy "pharmacies_delete_admin" on public.pharmacies
  for delete using (public.is_admin());

-- Submission periods: read by all authenticated, write by admin
create policy "periods_select_auth" on public.submission_periods
  for select using (auth.role() = 'authenticated');
create policy "periods_write_admin" on public.submission_periods
  for all using (public.is_admin());

-- Submissions: authenticated users can read all + insert (receptionists create receipts);
-- only admins can update verification/payment fields (enforced at app level + policy below)
create policy "submissions_select_auth" on public.submissions
  for select using (auth.role() = 'authenticated');
create policy "submissions_insert_auth" on public.submissions
  for insert with check (auth.role() = 'authenticated');
create policy "submissions_update_admin_or_owner" on public.submissions
  for update using (public.is_admin() or received_by = auth.uid());

-- Audit log: insert by any authenticated user, read by admin only
create policy "audit_insert_auth" on public.audit_log
  for insert with check (auth.role() = 'authenticated');
create policy "audit_select_admin" on public.audit_log
  for select using (public.is_admin());

-- ------------------------------------------------------------
-- HANDY VIEW: pharmacies with their latest submission per active period
-- Used to compute "remaining pharmacies" for the day/period
-- ------------------------------------------------------------
create or replace view public.pharmacy_period_status as
select
  p.id as pharmacy_id,
  p.pharmacy_code,
  p.pharmacy_name,
  p.district,
  sp.id as period_id,
  sp.label as period_label,
  s.id as submission_id,
  s.status,
  s.received_at
from public.pharmacies p
cross join (select id, label from public.submission_periods where is_active = true limit 1) sp
left join lateral (
  select * from public.submissions s2
  where s2.pharmacy_id = p.id and s2.period_id = sp.id
  order by s2.received_at desc
  limit 1
) s on true
where p.active = true;

-- ------------------------------------------------------------
-- SEED: create the first active submission period (edit dates!)
-- ------------------------------------------------------------
insert into public.submission_periods (label, start_date, end_date, is_active)
values (to_char(now(), 'FMMonth YYYY'), date_trunc('month', now())::date,
        (date_trunc('month', now()) + interval '1 month - 1 day')::date, true)
on conflict do nothing;

-- ------------------------------------------------------------
-- NOTE: after running this, promote your first admin manually:
-- update public.profiles set role = 'admin' where id = '<your-auth-uid>';
-- ------------------------------------------------------------
