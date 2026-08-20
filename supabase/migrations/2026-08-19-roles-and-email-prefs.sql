-- ============================================================
-- Migration: add wild-pig roles field; retire "subcommittee
-- news" as an email preference (Comms vice-chair feedback:
-- joining a subcommittee IS joining its mailing list).
-- Run once in the Supabase SQL editor.
-- ============================================================

alter table public.profiles add column if not exists roles       text[] not null default '{}';
alter table public.profiles add column if not exists roles_other text   not null default '';

-- Strip the retired preference from any existing rows
update public.profiles set email_prefs = array_remove(email_prefs, 'subcommittee')
 where 'subcommittee' = any(email_prefs);

-- Recreate the view with the new columns (append-only, so replace works)
create or replace view public.mailing_list
with (security_invoker = true) as
  select email, first_name, last_name, title, affiliation, country,
         interests, committees, email_prefs, roles, roles_other
    from public.profiles
   where cardinality(email_prefs) > 0;

-- Refresh column-level privileges
revoke insert, update on public.profiles from anon, authenticated;
grant insert (id, email, first_name, last_name, title, affiliation, phone, country,
              roles, roles_other, interests, committees, email_prefs)
  on public.profiles to authenticated;
grant update (first_name, last_name, title, affiliation, phone, country,
              roles, roles_other, interests, committees, email_prefs)
  on public.profiles to authenticated;

-- Signup trigger now reads roles from signup metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, first_name, last_name, title, affiliation, phone, country,
    roles, roles_other, interests, committees, email_prefs
  ) values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'title', ''),
    coalesce(new.raw_user_meta_data->>'affiliation', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'country', ''),
    coalesce((select array_agg(x) from jsonb_array_elements_text(new.raw_user_meta_data->'roles') as t(x)), '{}'),
    coalesce(new.raw_user_meta_data->>'roles_other', ''),
    coalesce((select array_agg(x) from jsonb_array_elements_text(new.raw_user_meta_data->'interests') as t(x)), '{}'),
    coalesce((select array_agg(x) from jsonb_array_elements_text(new.raw_user_meta_data->'committees') as t(x)), '{}'),
    coalesce((select array_agg(x) from jsonb_array_elements_text(new.raw_user_meta_data->'email_prefs') as t(x)), '{}')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
