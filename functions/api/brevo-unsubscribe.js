/*
 * Cloudflare Pages Function - writes Brevo unsubscribes back to Supabase.
 *
 * When someone clicks the unsubscribe link in a Brevo campaign, Brevo
 * blocks that address on its side only. A Brevo marketing webhook
 * ("Unsubscribed" event) POSTs here, and this function clears the
 * member's email_prefs, so their account page shows "No emails" and the
 * website and Brevo agree. Clearing the prefs fires the profiles webhook,
 * and brevo-sync.js then removes them from every list.
 *
 * Brevo webhooks cannot send a custom header, so the shared secret rides
 * in the URL: https://nwptf.org/api/brevo-unsubscribe?key=<BREVO_SYNC_SECRET>
 *
 * SETUP: see docs/member-portal.md, "Brevo sync". Needs ENCRYPTED
 * Cloudflare Pages variables BREVO_SYNC_SECRET and SUPABASE_SECRET_KEY
 * (the latter is the same one delete-account.js uses).
 */

const SUPABASE_URL = 'https://umzvqtmbauyqxniaxrgs.supabase.co';

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.BREVO_SYNC_SECRET || !env.SUPABASE_SECRET_KEY) {
    return json({ error: 'Brevo sync is not configured.' }, 503);
  }
  const given = new URL(request.url).searchParams.get('key') || '';
  if (!timingSafeEqual(given, env.BREVO_SYNC_SECRET)) {
    return json({ error: 'Not allowed.' }, 401);
  }

  let event;
  try {
    event = await request.json();
  } catch (e) {
    return json({ error: 'Bad payload.' }, 400);
  }
  if (!event || event.event !== 'unsubscribed') return json({ ok: true, action: 'ignored' }, 200);

  const email = (event.email || '').trim().toLowerCase();
  if (!email) return json({ ok: true, action: 'no email' }, 200);

  // Auth emails (and so the profiles mirror) are stored lowercase.
  const secret = env.SUPABASE_SECRET_KEY;
  const res = await fetch(SUPABASE_URL + '/rest/v1/profiles?email=eq.' + encodeURIComponent(email), {
    method: 'PATCH',
    headers: {
      apikey: secret,
      Authorization: 'Bearer ' + secret,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({ email_prefs: [] })
  });
  if (!res.ok) return json({ error: 'Could not update the member.' }, 502);

  return json({ ok: true, action: 'unsubscribed' }, 200);
}

function timingSafeEqual(a, b) {
  if (!a || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}
