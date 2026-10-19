-- Faith Connect: counsellors, assignments, follow-up and messaging.
-- Safe to run more than once. Paste the whole file into the Supabase SQL editor.

-- 1. New service types used by the add/edit contact forms and Follow-up filters.
alter type public."selectType" add value if not exists 'evangelism';
alter type public."selectType" add value if not exists 'wednesday service';
alter type public."selectType" add value if not exists 'tuesday healing and deliverance service';

-- 2. Counsellors: one row per Clerk user, created or refreshed by the app on
-- sign-in (src/lib/counsellor.ts).
create table if not exists public.counsellors (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  email text,
  first_name text,
  last_name text,
  full_name text,
  image_url text,
  birth_day smallint check (birth_day between 1 and 31),
  birth_month smallint check (birth_month between 1 and 12),
  birth_year smallint check (birth_year between 1900 and 2100),
  birthday_source text check (birthday_source in ('google', 'manual')),
  role text not null default 'counsellor' check (role in ('super_admin', 'counsellor')),
  is_active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.counsellors
  add column if not exists role text not null default 'counsellor'
    check (role in ('super_admin', 'counsellor'));
alter table public.counsellors
  add column if not exists is_active boolean not null default true;

create index if not exists counsellors_email_idx on public.counsellors (lower(email));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists counsellors_set_updated_at on public.counsellors;
create trigger counsellors_set_updated_at
  before update on public.counsellors
  for each row execute function public.set_updated_at();

-- 3. Feedback is linked to the counsellor who wrote it. The free-text
-- "initiator" column stays for older entries and as the display name.
alter table public.feedback
  add column if not exists counsellor_id uuid references public.counsellors (id) on delete set null;

create index if not exists feedback_contact_id_idx on public.feedback (contact_id);
create index if not exists feedback_counsellor_id_idx on public.feedback (counsellor_id);

-- 4. Assigning contacts to counsellors, and what we have learned about
-- whether each number is on WhatsApp.
alter table public.contacts
  add column if not exists assigned_counsellor_id uuid references public.counsellors (id) on delete set null,
  add column if not exists assigned_at timestamptz,
  add column if not exists assigned_by uuid references public.counsellors (id) on delete set null,
  add column if not exists whatsapp_status text not null default 'unknown'
    check (whatsapp_status in ('unknown', 'on_whatsapp', 'not_on_whatsapp')),
  add column if not exists whatsapp_checked_at timestamptz;

create index if not exists contacts_assigned_counsellor_idx on public.contacts (assigned_counsellor_id);

-- 5. Bulk messages: one batch per send, one delivery row per recipient.
create table if not exists public.message_batches (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('sms', 'whatsapp')),
  mode text not null check (mode in ('termii', 'cloud_api', 'manual')),
  body text,
  template_name text,
  counsellor_id uuid references public.counsellors (id) on delete set null,
  recipient_count integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  filters jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.message_deliveries (
  id bigint generated always as identity primary key,
  batch_id uuid not null references public.message_batches (id) on delete cascade,
  contact_id bigint references public.contacts (id) on delete set null,
  phone text not null,
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'failed', 'not_on_whatsapp', 'skipped')),
  error text,
  provider_message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists message_batches_created_idx on public.message_batches (created_at desc);
create index if not exists message_deliveries_batch_idx on public.message_deliveries (batch_id);
create index if not exists message_deliveries_contact_idx on public.message_deliveries (contact_id);

drop trigger if exists message_deliveries_set_updated_at on public.message_deliveries;
create trigger message_deliveries_set_updated_at
  before update on public.message_deliveries
  for each row execute function public.set_updated_at();

-- 6. Only the server (service role key) reads or writes these tables.
alter table public.counsellors enable row level security;
alter table public.message_batches enable row level security;
alter table public.message_deliveries enable row level security;
