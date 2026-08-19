-- ============================================================
-- NWPTF member portal - database schema
--
-- Run this once in the Supabase SQL editor (Dashboard > SQL)
-- of the NWPTF project. Safe to re-run: it drops and recreates
-- its own objects. Full setup guide: docs/member-portal.md
-- ============================================================

-- ---- Profiles table: one row per member, keyed to auth.users ----
create table if not exists public.profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  email                   text not null default '',   -- mirror of auth email, kept in sync by trigger
  first_name              text not null default '',
  last_name               text not null default '',
  title                   text not null default '',
  affiliation             text not null default '',   -- company / agency / university
  phone                   text not null default '',
  country                 text not null default '',
  interests               text[] not null default '{}',
  committees              text[] not null default '{}',       -- Research / Policy / Communications / Applied Management
  email_prefs             text[] not null default '{}',       -- general / interests / subcommittee / events; empty = no emails
  other_affiliations      text[] not null default '{}',       -- NFSDMP / AFWA / SEAFWA / MAFWA / EUROBOAR
  other_affiliations_note text not null default '',           -- free-text "other working groups"
  role                    text not null default 'member' check (role in ('member','admin')),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ---- Column-level privileges ----
-- Members may never set their own role, and email is managed by trigger only.
revoke insert, update on public.profiles from anon, authenticated;
grant insert (id, email, first_name, last_name, title, affiliation, phone, country,
              interests, committees, email_prefs, other_affiliations, other_affiliations_note)
  on public.profiles to authenticated;
grant update (first_name, last_name, title, affiliation, phone, country,
              interests, committees, email_prefs, other_affiliations, other_affiliations_note)
  on public.profiles to authenticated;

-- ---- Admin check (security definer avoids recursive RLS lookups) ----
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---- Row-level security policies ----
drop policy if exists "Members read own profile"    on public.profiles;
drop policy if exists "Members insert own profile"  on public.profiles;
drop policy if exists "Members update own profile"  on public.profiles;
drop policy if exists "Admins read all profiles"    on public.profiles;
drop policy if exists "Admins update all profiles"  on public.profiles;

create policy "Members read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Members insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Members update own profile" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);
create policy "Admins read all profiles"   on public.profiles for select using (public.is_admin());
create policy "Admins update all profiles" on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());

-- ---- Auto-create a profile row when a user signs up ----
-- Signup metadata (raw_user_meta_data) is written by assets/portal.js.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, first_name, last_name, title, affiliation, phone, country,
    interests, committees, email_prefs, other_affiliations, other_affiliations_note
  ) values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'title', ''),
    coalesce(new.raw_user_meta_data->>'affiliation', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'country', ''),
    coalesce((select array_agg(x) from jsonb_array_elements_text(new.raw_user_meta_data->'interests') as t(x)), '{}'),
    coalesce((select array_agg(x) from jsonb_array_elements_text(new.raw_user_meta_data->'committees') as t(x)), '{}'),
    coalesce((select array_agg(x) from jsonb_array_elements_text(new.raw_user_meta_data->'email_prefs') as t(x)), '{}'),
    coalesce((select array_agg(x) from jsonb_array_elements_text(new.raw_user_meta_data->'other_affiliations') as t(x)), '{}'),
    coalesce(new.raw_user_meta_data->>'other_affiliations_note', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---- Keep the email mirror in sync when a user confirms an email change ----
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.profiles
     set email = coalesce(new.email, ''), updated_at = now()
   where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- ---- Maintain updated_at on every profile edit ----
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---- Mailing-list view (respects RLS: admins see everyone who opted in) ----
create or replace view public.mailing_list
with (security_invoker = true) as
  select email, first_name, last_name, title, affiliation, country,
         interests, committees, email_prefs,
         other_affiliations, other_affiliations_note
    from public.profiles
   where cardinality(email_prefs) > 0;

-- ============================================================
-- AFTER RUNNING: promote the site admin (must have signed up first):
--   update public.profiles set role = 'admin'
--    where email = 'vickie.denicola@fieldengine.com';
-- ============================================================
