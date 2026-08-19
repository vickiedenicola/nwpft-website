/*
 * Cloudflare Pages Function - self-service membership removal.
 *
 * POST /api/delete-account with the member's Supabase access token as
 * "Authorization: Bearer <token>". The function verifies the token with
 * Supabase (so a member can only ever delete THEMSELVES), then deletes
 * the auth user via the admin API; the profile row cascades away.
 *
 * SETUP (Cloudflare Pages dashboard):
 *   Settings -> Environment variables -> add an ENCRYPTED variable
 *   SUPABASE_SECRET_KEY = the "Secret key" (sb_secret_...) from the
 *   Supabase project's API Keys page. NEVER commit that key here.
 *
 * Only runs when served by Cloudflare Pages; on localhost the account
 * page's remove button reports a friendly failure instead.
 */

const SUPABASE_URL = 'https://umzvqtmbauyqxniaxrgs.supabase.co';
// The publishable (anon) key - safe to commit, same one the site uses.
const ANON_KEY = 'sb_publishable_2_ZskFAKuUR65cMpqKccJg_nZXiF6G1';

export async function onRequestPost(context) {
  const { request, env } = context;

  const secret = env.SUPABASE_SECRET_KEY;
  if (!secret) return json({ error: 'Account removal is not configured.' }, 503);

  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return json({ error: 'Not signed in.' }, 401);

  // Ask Supabase who this token belongs to; rejects invalid/expired tokens.
  const userRes = await fetch(SUPABASE_URL + '/auth/v1/user', {
    headers: { apikey: ANON_KEY, Authorization: auth }
  });
  if (!userRes.ok) return json({ error: 'Not signed in.' }, 401);
  const user = await userRes.json();
  if (!user || !user.id) return json({ error: 'Not signed in.' }, 401);

  const del = await fetch(SUPABASE_URL + '/auth/v1/admin/users/' + user.id, {
    method: 'DELETE',
    headers: { apikey: secret, Authorization: 'Bearer ' + secret }
  });
  if (!del.ok) return json({ error: 'Could not remove the account.' }, 502);

  return json({ ok: true }, 200);
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
