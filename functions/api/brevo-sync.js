/*
 * Cloudflare Pages Function - keeps Brevo in step with the member database.
 *
 * Supabase is the source of truth for who gets which emails. A Supabase
 * Database Webhook on public.profiles (INSERT, UPDATE, DELETE) POSTs each
 * change here, and this function mirrors it into Brevo:
 *   - each email_prefs category maps to one Brevo list (LISTS below);
 *     the contact is added to the lists they chose and removed from the rest
 *   - an email change moves the Brevo contact to the new address
 *   - a deleted account deletes the Brevo contact
 *
 * The reverse direction (someone clicks unsubscribe in a Brevo email) is
 * handled by brevo-unsubscribe.js, which clears email_prefs in Supabase -
 * and that update comes back through here and removes them from the lists.
 *
 * SETUP: see docs/member-portal.md, "Brevo sync". Needs two ENCRYPTED
 * Cloudflare Pages variables: BREVO_API_KEY and BREVO_SYNC_SECRET. The
 * Supabase webhook must send the secret as the "x-sync-secret" header.
 */

// email_prefs value -> Brevo list ID. A null entry is skipped until filled in.
const LISTS = {
  general: 6,
  interests: 7,
  events: 3
};

const BREVO = 'https://api.brevo.com/v3';

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.BREVO_API_KEY || !env.BREVO_SYNC_SECRET) {
    return json({ error: 'Brevo sync is not configured.' }, 503);
  }
  const given = request.headers.get('x-sync-secret') || '';
  if (!timingSafeEqual(given, env.BREVO_SYNC_SECRET)) {
    return json({ error: 'Not allowed.' }, 401);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (e) {
    return json({ error: 'Bad payload.' }, 400);
  }
  const { type, record, old_record: old } = payload || {};
  const brevo = brevoClient(env.BREVO_API_KEY);

  if (type === 'DELETE') {
    const email = clean(old && old.email);
    if (email) await brevo.deleteContact(email);
    return json({ ok: true, action: 'deleted' }, 200);
  }

  if (type !== 'INSERT' && type !== 'UPDATE') return json({ ok: true, action: 'ignored' }, 200);

  const email = clean(record && record.email);
  if (!email) return json({ ok: true, action: 'no email' }, 200);

  // Email changed: move the existing Brevo contact to the new address first,
  // so the old address does not linger on the lists.
  const oldEmail = clean(old && old.email);
  if (oldEmail && oldEmail !== email) {
    const moved = await brevo.changeEmail(oldEmail, email);
    // The new address already exists in Brevo (or the old one never did):
    // drop the old contact and let the upsert below handle the new one.
    if (!moved) await brevo.deleteContact(oldEmail);
  }

  const prefs = Array.isArray(record.email_prefs) ? record.email_prefs : [];
  const add = [];
  const remove = [];
  for (const [pref, id] of Object.entries(LISTS)) {
    if (!id) continue;
    (prefs.includes(pref) ? add : remove).push(id);
  }

  // A member with no email preferences who is not in Brevo yet stays out.
  if (!add.length && !(await brevo.exists(email))) {
    return json({ ok: true, action: 'skipped' }, 200);
  }

  const res = await brevo.upsert(email, {
    FIRSTNAME: record.first_name || '',
    LASTNAME: record.last_name || ''
  }, add, remove);
  if (!res.ok) return json({ error: 'Brevo rejected the update.', status: res.status }, 502);

  return json({ ok: true, action: 'synced', lists: add }, 200);
}

function brevoClient(key) {
  const headers = { 'api-key': key, accept: 'application/json', 'content-type': 'application/json' };
  const path = (email) => BREVO + '/contacts/' + encodeURIComponent(email);
  return {
    async exists(email) {
      const r = await fetch(path(email), { headers });
      return r.ok;
    },
    async upsert(email, attributes, listIds, unlinkListIds) {
      const body = { email, attributes, updateEnabled: true };
      if (listIds.length) body.listIds = listIds;
      if (unlinkListIds.length) body.unlinkListIds = unlinkListIds;
      return fetch(BREVO + '/contacts', { method: 'POST', headers, body: JSON.stringify(body) });
    },
    async changeEmail(from, to) {
      const r = await fetch(path(from), {
        method: 'PUT', headers, body: JSON.stringify({ attributes: { EMAIL: to } })
      });
      return r.ok;
    },
    async deleteContact(email) {
      // 404 just means Brevo never had them; nothing to do.
      await fetch(path(email), { method: 'DELETE', headers });
    }
  };
}

function clean(email) {
  return (email || '').trim().toLowerCase();
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
