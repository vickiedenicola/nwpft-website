# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Static website for the National Wild Pig Task Force (NWPTF) — a redesign of nwptf.org. Plain HTML, CSS, and vanilla JavaScript with no build step, no framework, and no package manager.

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
| `about.html` | `about` | Page hero, prose content, value cards, CTA |
| `resources.html` | `resources` | Page hero, filter bar + resource cards with inline JS filter logic |

Several nav items (The Issue, Research, News) link to `#` — those pages are not yet built.

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

- Homepage statistics (31+ states/territories, 6M+ pigs, $2.5B damage) are placeholder figures — need replacement with NWPTF's current data.
- News cards on the homepage are sample content, not live articles.
