-- ============================================================
-- Migration: remove the "other affiliations" fields
-- (Chair feedback 2026-08-19: unclear purpose, risk of implying
-- cross-signup to those organizations.)
-- Run once in the Supabase SQL editor.
-- ============================================================

-- Cascade drops the mailing_list view, recreated below
alter table public.profiles drop column if exists other_affiliations cascade;
alter table public.profiles drop column if exists other_affiliations_note cascade;

create or replace view public.mailing_list
with (security_invoker = true) as
  select email, first_name, last_name, title, affiliation, country,
         interests, committees, email_prefs
    from public.profiles
   where cardinality(email_prefs) > 0;

revoke insert, update on public.profiles from anon, authenticated;
grant insert (id, email, first_name, last_name, title, affiliation, phone, country,
              interests, committees, email_prefs)
  on public.profiles to authenticated;
grant update (first_name, last_name, title, affiliation, phone, country,
              interests, committees, email_prefs)
  on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, first_name, last_name, title, affiliation, phone, country,
    interests, committees, email_prefs
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
                  then '{general,interests,subcommittee,events}'::text[] else '{}'::text[] end)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
