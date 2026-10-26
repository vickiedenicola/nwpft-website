# Member portal — setup and operations

The member portal lets people create a free NWPTF profile, manage their own
contact details, pick areas of interest, and opt in/out of email — the basis for
an international, interest-segmented mailing list.

**Stack:** static pages in this repo + [Supabase](https://supabase.com) for
auth, database, and account emails. No build step, no server code in the repo.
The browser talks to Supabase directly via `@supabase/supabase-js` from the
jsDelivr CDN; row-level security (RLS) in Postgres is what protects the data.

## Files

| File | Purpose |
|---|---|
| `signup.html` | Become a member — collects the full profile; no password (sign-in is by one-time email link) |
| `login.html` | Sign in — enter email, receive a one-time sign-in link (linked from the topbar as "Join or Sign In", or "My Account" when signed in) |
| `account.html` | Profile editor + change email / remove membership / sign out |
| `reset-password.html` | Legacy stub — explains there are no passwords and points to login |
| `admin.html` | Admin-only member roster: search, segment filters, CSV export (linked from the account page for admins) |
| `assets/portal.js` | All portal logic, routed by `data-page`; also the **single source of truth for the interest and affiliation checkbox lists** |
| `assets/portal-config.js` | Supabase project URL + anon key (blank until configured) |
| `supabase/schema.sql` | Database schema: `profiles` table, RLS, triggers |

Portal pages are `noindex` and intentionally left out of `sitemap.xml`.

## One-time setup

1. **Create the Supabase project** — in the existing Pro org (per the June 2026
   decision: no second base fee; project is transferable to a Task Force–owned
   org later if needed). Region: US.
2. **Run the schema** — paste `supabase/schema.sql` into Dashboard → SQL Editor
   and run it. Safe to re-run.
3. **Configure auth** — Dashboard → Authentication:
   - *URL Configuration*: set Site URL to `https://nwptf.org` and add redirect
     URLs `https://nwptf.org/account.html`, `https://nwptf.org/reset-password.html`
     (plus `http://localhost:8000/...` equivalents for local testing).
   - *Providers → Email*: leave "Confirm email" ON. Sign-in is passwordless
     (one-time email links via Supabase OTP); no password settings matter.
4. **Paste the keys** — Project Settings → API: copy the project URL and the
   `anon public` key into `assets/portal-config.js`. The anon key is safe to
   commit; **never** put the `service_role` key in the repo.
5. **Promote the admin** — after vickie.denicola@fieldengine.com signs up, run
   the `update ... set role = 'admin'` statement at the bottom of the schema file.
6. **(Recommended) Custom SMTP** — Authentication → Emails → SMTP. Supabase's
   built-in sender is rate-limited (~2 emails/hour) and fine for testing only;
   for the roster invite and real traffic, plug in an email provider (Brevo was
   the June recommendation).

## Data model

`public.profiles`, one row per user (`id = auth.users.id`):
first_name, last_name, title, affiliation (company/agency/university), phone,
country, email (mirror, synced by trigger), `roles text[]` + `roles_other`
(researcher / land manager / policy maker / student / officials / producer /
removal professional / outreach / private entity), `interests text[]`,
`committees text[]` (the NWPTF subcommittees: Research / Policy /
Communications / Applied Management — always called "subcommittees" in the
UI), `email_prefs text[]` (general / interests / events — empty array means
"no emails"; subcommittee mailings are keyed off `committees` membership
itself, not a preference), role (member/admin), timestamps. (An
"other affiliations" field existed briefly and was removed on chair
feedback 2026-08-19.)

RLS: members read/update only their own row (and cannot change `role` or
`email` — enforced by column-level grants); admins read all rows. Profile rows
are created automatically by a trigger when someone signs up, from the metadata
the signup form submits.

The interest list mirrors the publication-archive categories so mailing-list
segments match the site's literature taxonomy. To change either checkbox list,
edit the `INTERESTS` / `AFFILIATIONS` arrays at the top of `assets/portal.js` —
existing rows keep whatever values they stored (they're plain text arrays).

## Onboarding the existing roster (142 people, decided 2026-08-22)

Use `scripts/import_roster.py` with the legacy membership spreadsheet
(name / email / organization / title / subcommittees). It creates each
member as a pre-confirmed auth user with those fields in `user_metadata`,
so the `handle_new_user` trigger builds their profile row. **No email is
sent by the import** — members sign in later with the normal one-time
code flow, and the chair's announcement email tells them to review and
complete their profile (country, roles, interests, email preferences are
not in the sheet). Imported profiles default `email_prefs` to all three
categories, matching what the legacy list already sent them.

```sh
export SUPABASE_SECRET_KEY='sb_secret_...'   # Project Settings → API keys; never commit
python3 scripts/import_roster.py path/to/roster.xlsx           # dry run
python3 scripts/import_roster.py path/to/roster.xlsx --apply
```

The dry run lists every create/skip (already-registered emails are
skipped, so it is safe to re-run). Invite-link emails were deliberately
avoided: agency mail scanners pre-click links (see docs/email-templates.md).

## Exporting the mailing list

The `mailing_list` view returns everyone receiving at least one email
category (admins see all rows):

```sql
select * from mailing_list;                                   -- anyone getting email
select * from mailing_list where 'general' = any(email_prefs);
select * from mailing_list where 'events' = any(email_prefs); -- conference blast
select * from mailing_list where 'interests' = any(email_prefs)
                              and 'Disease & health' = any(interests);
select * from mailing_list where 'Policy' = any(committees);  -- a subcommittee's list
select * from mailing_list where country <> 'United States';  -- international slice
```

Run in the SQL editor and use "Download CSV" (set the row limit to "No limit"
first; the editor stops at 100 rows by default). Once the Brevo sync below is
live, Brevo lists stay current on their own and this export is only needed
for one-off slices.

## Brevo sync

Supabase is the source of truth for who gets which emails; Brevo copies it.
Two Cloudflare Pages functions do the work:

- `functions/api/brevo-sync.js`: a Supabase Database Webhook sends every
  change to `profiles` here. Each `email_prefs` category maps to one Brevo
  list (the `LISTS` table at the top of the file): members are added to the
  lists they chose and removed from the rest. An email change moves the
  Brevo contact to the new address; a deleted account deletes the contact.
- `functions/api/brevo-unsubscribe.js`: a Brevo webhook calls this when
  someone clicks unsubscribe in a campaign. It clears that member's
  `email_prefs`, so their account page shows "No emails", and that update
  flows back through `brevo-sync.js` and removes them from every list.

Known gap: someone who unsubscribed in Brevo and later ticks email boxes on
the website is added back to the lists, but Brevo keeps them blocklisted
until an admin unblocks the contact in Brevo.

### Setup, in this order

1. **Brevo lists.** Contacts → Lists, folder *NWPTF Active List*:
   *NWPTF – Events* (ID 3), *NWPTF – General* (ID 6), *NWPTF – Interests*
   (ID 7). The IDs live in `LISTS` in `brevo-sync.js`; a new category needs
   a new list and an entry there (a `null` ID is skipped).
2. **Brevo API key.** Settings → SMTP & API → API keys & MCP → Generate
   API key: name *NWPTF website sync*, no expiration, Restricted with only
   **Contacts: All**, MCP off. Leave Brevo's "block unauthorized IPs" off:
   Cloudflare has no fixed IPs. Brevo expires a key after 90 days unused,
   so if the site goes three months with no profile changes the sync
   stops; "Last used on" on that page shows it, and the fix is a new key.
3. **Cloudflare secrets.** Pages → the site → Settings → Environment
   variables → add **encrypted** variables `BREVO_API_KEY` (step 2) and
   `BREVO_SYNC_SECRET` (a long random string, e.g. from
   `openssl rand -hex 32`). `SUPABASE_SECRET_KEY` is already there for
   account deletion. Redeploy so the functions see them.
4. **Supabase webhook.** Database → Webhooks → Create: table `profiles`,
   events Insert, Update and Delete, type HTTP Request, method POST, URL
   `https://nwptf.org/api/brevo-sync`, timeout 5000 ms, and an HTTP header
   `x-sync-secret` set to the `BREVO_SYNC_SECRET` value.
5. **Brevo webhook.** Settings → Webhooks → Marketing → Add: URL
   `https://nwptf.org/api/brevo-unsubscribe?key=<BREVO_SYNC_SECRET>`, event
   *Unsubscribed* only.
6. **Backfill.** Touch every row so each fires the webhook once, which
   fills the lists and fixes anything that drifted. Do it in batches of
   about 15 a few seconds apart; touching all rows at once sends ~150
   requests together and Cloudflare answers most of them with 502:

   ```sql
   with b as (select id from profiles order by id limit 15 offset 0)
   update profiles p set updated_at = now() from b where p.id = b.id;
   -- then offset 15, 30, ... until it updates 0 rows
   ```

   Done 2026-10-26: all 147 profiles synced (General 145, Interests 143,
   Events 145; 2 profiles with no email choices skipped).
7. **Test** with a throwaway account: sign up, change preferences, change
   email, remove the account, and watch each step land in Brevo. Then
   unsubscribe from a test campaign and check the account page shows
   "No emails".

Failed deliveries show up under Database → Webhooks (and in the
`net._http_response` table); re-running step 6 is always safe.

## Bot protection (CAPTCHA)

The signup and sign-in forms carry a Cloudflare Turnstile check, so scripts
can't create junk profiles or fire off sign-in emails. Most people never see
it; Turnstile only shows a box when it is unsure. Setup, in this order:

1. **Cloudflare dashboard → Turnstile → Add widget.** Hostnames `nwptf.org`
   and `www.nwptf.org`, widget mode **Managed**. It gives a *site key* and a
   *secret key*.
2. **Put the site key in `assets/portal-config.js`** (`captchaSiteKey`) and
   deploy. The site key is public and safe to commit.
3. **Then** Supabase → Authentication → Attack Protection → enable CAPTCHA
   protection, provider Turnstile, paste the *secret* key. Doing this before
   step 2 is live makes every signup and sign-in fail.

To switch it off: disable it in Supabase first, then clear `captchaSiteKey`.
Local testing: Cloudflare's test site key `1x00000000000000000000AA` always
passes; don't commit it. The CSP in `_headers` allows
`challenges.cloudflare.com` for this.

## Deleting an account

Members remove themselves with the "Remove my membership" button on
`account.html`, which calls the Cloudflare Pages function
`functions/api/delete-account.js`. That function needs a one-time setup:
Cloudflare Pages dashboard → the site's Settings → Environment variables →
add an **encrypted** variable `SUPABASE_SECRET_KEY` holding the "Secret key"
(`sb_secret_...`) from the Supabase project's API Keys page. Until it is set,
the button reports a friendly failure and members can use the contact form.

Admins can also delete anyone: Dashboard → Authentication → Users → delete
the user. Either way the profile row cascades away with the auth user.

## Still open

- Open self-signup vs. admin-approval "pending" state — currently **open**
  (no dues as of 2026-06-18).
