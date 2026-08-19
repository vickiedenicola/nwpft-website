# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Static website for the National Wild Pig Task Force (NWPTF) — a redesign of nwptf.org. Plain HTML, CSS, and vanilla JavaScript with no build step, no framework, and no package manager.

The one script in the repo, `scripts/refresh_archive_fallback.py`, is **CI-only** — a scheduled GitHub Action runs it to refresh the publication archive's offline snapshot. It is not part of building or serving the site, uses only the Python standard library, and nothing in the browser depends on it. Serving the site is still "copy the files".

## Running locally

Serve via a local HTTP server (required because pages load shared assets via relative paths):

```
python3 -m http.server 8000
```

Then visit http://localhost:8000/. There is no build, lint, or test command.

## Architecture

### Shared layout injection

Pages do **not** contain their own header or footer markup. Instead, each page includes two placeholder `<div>` elements (`data-layout="header"` and `data-layout="footer"`) and loads `assets/layout.js` at the bottom of the body. That script replaces the placeholders with the full header (topbar + sticky nav) and footer HTML at runtime.

- To change navigation links, social links, contact email, or footer content, edit **`assets/layout.js`** — not the individual HTML pages.
- Each page sets `<body data-page="...">` (e.g., `home`, `about`, `resources`), which `layout.js` reads to apply the `.active` class to the correct nav link.

### Pages

| File | `data-page` | Notes |
|---|---|---|
| `index.html` | `home` | Hero, stat strip, audience pathway cards, impact band, news grid, CTA |
| `issue.html` | `issue` | The Issue — background on wild pig impacts |
| `resources.html` | `resources` | Page hero, filter bar + resource cards with inline JS filter logic |
| `research.html` | `research` | **Featured research** — hand-written curated studies in static HTML, grouped in `<details>` category blocks, with an inline search script |
| `publications.html` | `research` | **Publication archive** — the full literature collection, rendered from `assets/publications.csv` by `assets/publications.js` with theme/year/access filters and paging |
| `events.html` | `events` | Meetings and conferences |
| `about.html` | `about` | Page hero, prose content, value cards, CTA |
| `governance.html` | — | Subcommittees and objectives |
| `contact.html`, `credits.html`, `feedback.html`, `styleguide.html` | — | Supporting pages |
| `signup.html`, `login.html`, `account.html` | `signup` / `login` / `account` | **Member portal** — Supabase-backed, passwordless (one-time email sign-in links), all logic in `assets/portal.js`, keys in `assets/portal-config.js`, schema in `supabase/schema.sql`. See `docs/member-portal.md`. `reset-password.html` is a legacy stub. Pages are `noindex` and stay out of `sitemap.xml`. |

### Research section

Two pages, one relationship: `research.html` is a small editorial selection with a
written note per study; `publications.html` is the complete archive. Featured
entries also appear in the archive (`featured=yes` in the CSV), so the archive is
always the full picture.

Policy: **link out by DOI, host almost nothing** — DOIs are permanent, and being
free to read is not permission to republish. Never paste in publisher abstracts;
the `note` column is one original sentence. Full detail, including how to hand the
archive over to a published Google Sheet, is in `docs/publication-archive.md`.

To add papers, edit `assets/publications.csv` — not the HTML. The main nav keeps a
single "Research" link to `research.html`; the archive is reached from that page
and the footer.

### Member portal

Free member profiles (name, title, affiliation, phone, country, areas of
interest, committees, granular email preferences) that feed an interest-segmented
international mailing list. Supabase handles auth/DB/emails via
`@supabase/supabase-js` from CDN — no build step; the only server code is
`functions/api/delete-account.js` (Cloudflare Pages function for
self-service membership removal, needs the `SUPABASE_SECRET_KEY` env var in
the Cloudflare dashboard). Row-level security protects the data; the anon
key in `assets/portal-config.js` is safe to commit. The checkbox option
lists live only in the `INTERESTS`/`COMMITTEES`/`EMAIL_PREFS` arrays at the
top of `assets/portal.js`. Setup, roster invites, and mailing-list export:
`docs/member-portal.md`.

### Styling

Single shared stylesheet at `assets/styles.css`. Uses CSS custom properties defined in `:root` for the color palette:

- `--moss` / `--moss-deep` / `--olive` — greens
- `--tan`, `--rust`, `--bone` — accent and background tones
- `--ink` / `--ink-soft` — text colors
- `--line` — border color

Typography: Playfair Display (headings) and Source Sans 3 (body) loaded from Google Fonts. Mobile breakpoint at 860px hides the nav and switches grids to single-column.

## Conventions

- All asset references use relative paths (`assets/...`) — no leading slash, no absolute URLs.
- Buttons use `.btn` with modifier classes: `.btn-primary` (rust), `.btn-ghost` (transparent), `.btn-dark` (moss).
- Section backgrounds alternate using `.section` (white) and `.section-tan` (bone).
- Resource cards carry a `data-type` attribute that the filter bar JS on `resources.html` reads.

## Pre-launch notes

- The stat strip on `index.html` and `issue.html` carries three figures, each sourced in the footnote list beneath it. Any figure added there needs its own citation in that list. `.stat-row` auto-fits, so two or three both lay out correctly.
- The "6M+" population figure comes from **Mayer 2014** (SRNL-STI-2014-00292, `10.2172/1169581`), a DOE Savannah River National Laboratory compilation — mean 6.3M, range 4.4–11.3M. It was briefly pulled in August 2026 because the markup credited it to USDA APHIS, which never published it; USDA's discomfort was with the misattribution, not the number. Keep the citation pointed at Mayer, and keep the 2014 vintage visible in the label — it is a 2014 estimate, not a current count.
- News cards on the homepage are sample content, not live articles.
