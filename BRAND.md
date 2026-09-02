# National Wild Pig Task Force — Brand Guide

A quick reference for the NWPTF website's visual and verbal identity. A live,
visual version lives at [`styleguide.html`](styleguide.html).

## Logo

- **File:** `assets/nwptf-logo.png` (full color) with a 2× Retina variant
  (`nwptf-logo@2x.png`), wired via `srcset`.
- A brown wild-pig illustration paired with the wordmark; "PIG" is set in tan.
- **On light backgrounds:** use the logo directly (e.g., the header).
- **On dark backgrounds:** place the full-color logo on a **bone "chip"**
  (bone background, ~14–20px padding, 6px radius) rather than recoloring it — see
  the footer. This keeps the pig and wordmark crisp. (A recolored light variant
  exists but is deprecated because the pig's detail washes out.)
- **Don't:** recolor, stretch, add effects, or place the logo directly on a busy/dark photo.
- **Favicon / app icon:** `favicon.ico`, `assets/favicon-32.png`,
  `assets/apple-touch-icon.png` — the pig mark on a bone background.

## Color palette

Defined as CSS custom properties in `:root` (`assets/styles.css`).

| Token | Hex | Use |
|-------|-----|-----|
| `--moss` | `#3a4a2f` | Primary green (stat strip, mid surfaces) |
| `--moss-deep` | `#2b3723` | Headers, footers, dark sections |
| `--olive` | `#5c6b45` | Card accents, secondary green |
| `--tan` | `#c79a5b` | Highlights, kickers on dark, accents |
| `--rust` | `#a8552e` | Primary CTA, links, active nav |
| `--bone` | `#f4ede0` | Light background, text on dark |
| `--paper` | `#ffffff` | Card / page surface |
| `--ink` | `#23271d` | Body text |
| `--ink-soft` | `#4a5040` | Secondary text |
| `--line` | `#e3ddcf` | Borders / dividers |

**Contrast:** keep body text on the dark green and rust surfaces in bone/white;
avoid light text below ~78% opacity for normal-size copy (WCAG AA 4.5:1).

## Typography

- **Headings:** Playfair Display (700/800), tight line height, slight negative tracking.
- **Body & UI:** Source Sans 3 (400/600/700), 17px base, 1.6 line height.
- **Kicker / eyebrow:** Source Sans 3, uppercase, letter-spaced, rust (or tan on dark).
- Both load from Google Fonts.

## Components

- **Buttons:** `.btn` + `.btn-primary` (rust), `.btn-dark` (moss), `.btn-ghost`
  (outline, for dark backgrounds). Subtle lift on hover.
- **Cards:** white surface, 1px `--line` border, colored top/left accent; hover
  lifts and shifts accent to rust.
- **Tags:** small uppercase labels — olive-on-bone (resources) or rust (news).
- **Sections:** alternate `.section` (white) and `.section-tan` (bone). Full-bleed
  photo bands use a moss scrim for legible overlaid text.
- **Arrows:** internal "more" links use `→`; external links (new tab) use `↗`.

## Imagery

- Authentic U.S. wild-pig and NWPTF photography (animals, damage, trapping,
  meetings). Avoid graphic/bloody content.
- Photo bands carry a moss-green scrim so headings stay readable.
- Sourcing & licensing tracked in `IMAGE_CREDITS.md` and `credits.html`.

## Voice & tone

NWPTF is the steady, science-based voice in the room. Wild pigs are a topic
people joke about and panic about; our job is to be the credible source that
neither jokes nor panics. We convene the conversation rather than fight to be
part of it. Three words anchor the voice:

- **Authoritative.** Speak with the confidence of an organization that
  coordinates the science and the partners. Don't justify our existence or sound
  defensive. State things plainly because we know them.
- **Accessible.** Write in plain language. Professionals and policymakers both
  reward clarity, and jargon makes us sound less credible, not more. Say "crosses
  property lines, jurisdictions, and disciplines," not "operates within a
  multi-stakeholder landscape-scale framework."
- **Human.** Credit the people doing the work: researchers, agency biologists,
  landowners. Warmth comes from being matter-of-fact and from caring about
  people, not from punchlines. A little dry wit is welcome; jokes for the sake of
  jokes are not.

**Always:** lead with what's true and useful; credit the field and the partners,
not ourselves; keep sentences clean and direct; sound like a knowledgeable
colleague.

**Never:** out-joke or out-snark entertainment coverage; use bureaucratic or
academic jargon where a plain word works; sound like we're proving we belong;
**use em dashes** (use commas, colons, or periods instead).

**Audience priority:** 1) natural resource professionals, 2) policymakers
(both primary), 3) landowners (tertiary). Write for the first two by default;
when landowners are the point, name them directly.

**Terminology:** always call the animal "wild pigs" in our own writing. Do not
use "feral swine", "feral hogs", "wild hogs", or "wild boar" except inside
proper nouns and titles we don't control (e.g., USDA APHIS National Feral Swine
Damage Management Program, SEAFWA Wild Hog Working Group, publication titles)
or when explicitly listing the synonyms readers may know.

### By channel

- **Website** (most formal). Authoritative and clear, reserved, informative over
  conversational. Complete declarative sentences; lead each section with its main
  point. Humor minimal to none — this is the reference layer. Every page should
  leave a policymaker with something to act on or cite.
- **Facebook** (most casual). Warm, plain-spoken, light dry wit welcome. A
  relaxed opening line is fine. Name the people behind the work. Close with a real
  call to action that invites engagement. Keep posts tight: lead, point, payoff,
  prompt. Flag strong-language/sensitive source content with a viewer-discretion note.
- **LinkedIn** (professional). Credible, warmer than the website but more measured
  than Facebook. Open with the substance, not a joke. Frame issues around
  coordination, jurisdictions, and turning science into practice. Close with a
  professional CTA (follow for research, or point to nwptf.org once inner pages
  are live).

| | Website | Facebook | LinkedIn |
|---|---|---|---|
| Register | Most formal | Most casual | Professional |
| Humor | None | Light, dry | Minimal, dry |
| Opening | The main point | A relaxed hook is fine | The substance |
| Call to action | Use/cite the resource | Invite conversation | Follow / nwptf.org |
| Primary job | Establish credibility | Build community | Reach professionals |

Across all three: authoritative, accessible, human. No em dashes.

## Layout

- Content max-width 1180px (`.wrap`), 2rem side padding.
- Mobile breakpoint at 860px: nav collapses to a hamburger; multi-column grids
  stack to one column.
- Every page injects the shared header/footer from `assets/layout.js` — edit nav,
  footer, and social links there, not per page.
