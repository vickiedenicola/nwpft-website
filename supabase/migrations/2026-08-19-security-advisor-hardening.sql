-- ============================================================
-- Security Advisor cleanup: pin search_path on touch_updated_at
-- and revoke direct EXECUTE on the definer/trigger functions
-- (they only ever run via triggers / RLS policies).
-- Run once in the Supabase SQL editor.
-- ============================================================

alter function public.touch_updated_at() set search_path = public;

-- Trigger functions: never callable directly, revoking is pure hygiene
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_email_change() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

-- is_admin is used inside RLS policies, so signed-in members must keep it
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- The dashboard-created auto-RLS helper. If this line errors with
-- "must be owner", just delete it and re-run: it means Supabase owns
-- that function and it is already outside anyone's reach.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
