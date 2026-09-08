# NWPTF Website Redesign

A multi-page static site for the National Wild Pig Task Force (NWPTF), built with plain HTML, CSS, and a small amount of JavaScript. No build step or framework required.

## Live site

The current production site is at [nwptf.org](https://nwptf.org/). This repository holds the redesign.

## Structure

```
.
├── index.html          Home
├── about.html          About the Task Force
├── resources.html      Resources library (with a working type filter)
└── assets/
    ├── styles.css           Shared stylesheet
    ├── layout.js            Injects the shared header and footer on every page
    ├── nwptf-logo.png       Logo, transparent background (used in the header)
    ├── nwptf-logo-light.png Logo variant with light lettering (used in the dark footer)
    └── nwptf-pig.jpg        Photography
```

The header and footer live in `assets/layout.js` and are injected into each page, so there is a single place to edit navigation, contact details, and social links.

## Design

- Typography: Playfair Display (headings) and Source Sans 3 (body), both from Google Fonts
- Palette: earthy moss green, tan, and rust on a white background
- Audiences: researchers, policymakers, and land managers

## Running locally

Because the pages share assets via relative paths, open them through a local server rather than double-clicking:

```
python3 -m http.server 8000
```

Then visit http://localhost:8000/.

## Publishing with GitHub Pages

In the repository, go to Settings, then Pages, set the source to "Deploy from a branch," and choose the `main` branch and the `/ (root)` folder. The site will publish to a github.io URL.

## Notes before publishing

- The statistics on the homepage (states affected, population, damage estimate) are commonly cited placeholder figures. Replace them with NWPTF's own current numbers before going live.
- Several inner sections (The Issue, Research, News) are linked in the navigation but not yet built.
