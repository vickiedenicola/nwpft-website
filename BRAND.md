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

- Authentic U.S. feral-swine and NWPTF photography (animals, damage, trapping,
  meetings). Avoid graphic/bloody content.
- Photo bands carry a moss-green scrim so headings stay readable.
- Sourcing & licensing tracked in `IMAGE_CREDITS.md` and `credits.html`.

## Voice & tone

- **Authoritative but plain.** Science-based, never sensational. Explain impact
  in concrete terms (crops, water, wildlife, disease, dollars).
- **Coordinated and collective.** Emphasize partnership across agencies, states,
  and disciplines — "no single agency or state can manage the problem alone."
- **Action-oriented.** Point readers to resources, research, and ways to participate.
- Use "wild pigs" / "feral swine" interchangeably; both are accepted.

## Layout

- Content max-width 1180px (`.wrap`), 2rem side padding.
- Mobile breakpoint at 860px: nav collapses to a hamburger; multi-column grids
  stack to one column.
- Every page injects the shared header/footer from `assets/layout.js` — edit nav,
  footer, and social links there, not per page.
