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
| `signup.html` | Become a member — collects the full profile + password |
| `login.html` | Sign in (linked as "Member Login" in the topbar) |
| `account.html` | Profile editor + change email / password / sign out |
| `reset-password.html` | Request a reset link and set a new password |
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
   - *Providers → Email*: leave "Confirm email" ON.
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
country, email (mirror, synced by trigger), `interests text[]`,
`email_opt_in bool`, `other_affiliations text[]` (National Feral Swine Damage Management Program / AFWA / SEAFWA / MAFWA / EUROBOAR),
`other_affiliations_note` (free-text other working groups), role
(member/admin), timestamps.

RLS: members read/update only their own row (and cannot change `role` or
`email` — enforced by column-level grants); admins read all rows. Profile rows
are created automatically by a trigger when someone signs up, from the metadata
the signup form submits.

The interest list mirrors the publication-archive categories so mailing-list
segments match the site's literature taxonomy. To change either checkbox list,
edit the `INTERESTS` / `AFFILIATIONS` arrays at the top of `assets/portal.js` —
existing rows keep whatever values they stored (they're plain text arrays).

## Onboarding the existing roster (~60–125 people)

Do **not** import plaintext passwords. Use invites:

- Dashboard → Authentication → Users → "Invite user" (fine at this volume), or
  the admin API (`auth.admin.inviteUserByEmail`) from a one-off local script
  using the service-role key.
- Each person gets a branded "set your password" email; when they first visit
  `account.html` they complete the rest of their profile.

## Exporting the mailing list

The `mailing_list` view returns everyone who opted in (admins see all rows):

```sql
select * from mailing_list;                                   -- everyone opted in
select * from mailing_list where 'Disease & health' = any(interests);
select * from mailing_list where country <> 'United States';  -- international slice
```

Run in the SQL editor and use "Download CSV", then import into the email tool.
Whether opt-ins should *sync* automatically to the email tool (vs. periodic CSV
export) is still an open decision.

## Deleting an account

Member deletion is admin-only (members are told to contact us): Dashboard →
Authentication → Users → delete the user. The profile row cascades.

## Still open

- Email tool choice (Brevo recommended) and SMTP hookup.
- Open self-signup vs. admin-approval "pending" state — currently **open**
  (no dues as of 2026-06-18).
- Optional admin roster/export page on the site (spec phase 5).
