-- ============================================================
-- GripCoaching Agent Team — Supabase Schema
-- Run this in Supabase SQL Editor (Settings → SQL Editor)
-- ============================================================

-- ── 1. PROFILES ─────────────────────────────────────────────
-- Extended user profile linked to auth.users via trigger

create table if not exists public.profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  email                   text,
  full_name               text,
  stripe_customer_id      text unique,
  stripe_subscription_id  text,
  subscription_status     text,          -- active | trialing | past_due | canceled | null
  subscription_period_end timestamptz,
  created_at              timestamptz default now()
);

-- Row-level security
alter table public.profiles enable row level security;

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Service role has full access (bypasses RLS automatically)


-- ── 2. ICP DOCUMENTS ────────────────────────────────────────
create table if not exists public.icp_documents (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid unique references public.profiles(id) on delete cascade,
  company_name         text,
  industry             text,
  product_description  text,
  target_job_titles    text[],
  target_company_size  text,
  geographies          text[],
  pain_points          text[],
  value_propositions   text[],
  objections           text[],
  buying_triggers      text[],
  competitors          text[],
  tone_of_voice        text,
  monthly_budget       text,
  completion_pct       integer default 0,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

alter table public.icp_documents enable row level security;

create policy "Users read own ICP"
  on public.icp_documents for select
  using (auth.uid() = user_id);

create policy "Users write own ICP"
  on public.icp_documents for insert
  with check (auth.uid() = user_id);

create policy "Users update own ICP"
  on public.icp_documents for update
  using (auth.uid() = user_id);


-- ── 3. PROGRESS STEPS ───────────────────────────────────────
create table if not exists public.progress_steps (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade,
  step_key     text not null,
  step_label   text not null,
  step_order   integer not null,
  is_completed boolean default false,
  completed_at timestamptz,
  created_at   timestamptz default now(),
  unique(user_id, step_key)
);

alter table public.progress_steps enable row level security;

create policy "Users read own steps"
  on public.progress_steps for select
  using (auth.uid() = user_id);

create policy "Users update own steps"
  on public.progress_steps for update
  using (auth.uid() = user_id);


-- ── 4. TRIGGER: auto-create profile on signup ────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── 5. TRIGGER: seed 10 progress steps on profile creation ──
create or replace function public.handle_new_profile()
returns trigger language plpgsql security definer
as $$
begin
  insert into public.progress_steps (user_id, step_key, step_label, step_order) values
    (new.id, 'onboarding_complete',    'Konto aktiverat & betalning klar',              1),
    (new.id, 'icp_started',            'ICP-Dokumentören startad',                      2),
    (new.id, 'icp_basics_done',        'Grundinfo ifylld (företag, bransch, produkt)',   3),
    (new.id, 'icp_persona_done',       'Målperson & företagsstorlek definierade',        4),
    (new.id, 'icp_pain_points_done',   'Smärtpunkter & köputlösare kartlagda',          5),
    (new.id, 'icp_completed',          'ICP-Dokument 100 % klart',                      6),
    (new.id, 'first_strategy',         'Första strategi skapad med Strategen',          7),
    (new.id, 'first_content',          'Första innehåll skapat med Copywritern',        8),
    (new.id, 'first_campaign',         'Första kampanj lanserad',                       9),
    (new.id, 'first_analysis',         'Första analys genomförd med Data-Analytikern', 10)
  on conflict (user_id, step_key) do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_profile();


-- ── 6. OPTIONAL: chat_history ────────────────────────────────
-- Uncomment if you want to persist chat history to Supabase

-- create table if not exists public.chat_history (
--   id         uuid primary key default gen_random_uuid(),
--   user_id    uuid references public.profiles(id) on delete cascade,
--   agent_slug text not null,
--   role       text not null check (role in ('user', 'assistant')),
--   content    text not null,
--   created_at timestamptz default now()
-- );
-- alter table public.chat_history enable row level security;
-- create policy "Users read own chats"
--   on public.chat_history for select using (auth.uid() = user_id);
-- create policy "Users insert own chats"
--   on public.chat_history for insert with check (auth.uid() = user_id);


-- ── DONE ─────────────────────────────────────────────────────
-- After running this schema:
-- 1. Set Site URL in Supabase Auth settings (Authentication → URL Configuration)
--    Site URL: https://gripcoaching-agents.netlify.app
-- 2. Add Redirect URL: https://gripcoaching-agents.netlify.app/auth/callback
-- 3. Set up environment variables in Netlify (see README or .env.local.example)
