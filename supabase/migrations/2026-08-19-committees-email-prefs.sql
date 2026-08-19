-- ============================================================
-- Migration: add NWPTF committees + granular email preferences
-- Run once in the Supabase SQL editor. Replaces the single
-- email_opt_in boolean with an email_prefs list:
--   general | interests | subcommittee | events
-- (empty list = "no emails"). Existing opted-in members are
-- carried over with all four categories enabled.
-- ============================================================

alter table public.profiles add column if not exists committees  text[] not null default '{}';
alter table public.profiles add column if not exists email_prefs text[] not null default '{}';

-- Carry over the old opt-in
update public.profiles
   set email_prefs = '{general,interests,subcommittee,events}'
 where email_opt_in and email_prefs = '{}';

-- Drop the old column (cascade removes the old mailing_list view)
alter table public.profiles drop column if exists email_opt_in cascade;

-- Recreate the mailing-list view on the new columns
create or replace view public.mailing_list
with (security_invoker = true) as
  select email, first_name, last_name, title, affiliation, country,
         interests, committees, email_prefs,
         other_affiliations, other_affiliations_note
    from public.profiles
   where cardinality(email_prefs) > 0;

-- Refresh column-level privileges for the new shape
revoke insert, update on public.profiles from anon, authenticated;
grant insert (id, email, first_name, last_name, title, affiliation, phone, country,
              interests, committees, email_prefs, other_affiliations, other_affiliations_note)
  on public.profiles to authenticated;
grant update (first_name, last_name, title, affiliation, phone, country,
              interests, committees, email_prefs, other_affiliations, other_affiliations_note)
  on public.profiles to authenticated;

-- Signup trigger now reads the new fields from signup metadata
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
    coalesce((select array_agg(x) from jsonb_array_elements_text(new.raw_user_meta_data->'email_prefs') as t(x)),
             case when coalesce((new.raw_user_meta_data->>'email_opt_in')::boolean, true)
                  then '{general,interests,subcommittee,events}'::text[] else '{}'::text[] end),
    coalesce((select array_agg(x) from jsonb_array_elements_text(new.raw_user_meta_data->'other_affiliations') as t(x)), '{}'),
    coalesce(new.raw_user_meta_data->>'other_affiliations_note', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
