# Publication archive — how it works

The research section is two pages:

| Page | File | What it is |
|---|---|---|
| **Featured research** | `research.html` | Hand-written editorial selection. Each entry is static HTML with a plain-language note. Curated by the Research Subcommittee. |
| **Publication archive** | `publications.html` | The full literature collection, rendered from one CSV with filters for theme, year, and access. |

The archive is where the 1958–2025 backlog goes. Featured stays small on purpose —
it is the answer to "I have twenty minutes, what should I read?"

Featured entries also appear in the archive, so the archive is always the complete
picture. `featured` in the CSV records which ones, but the archive does not use it
for display.

---

## The data file

`assets/publications.csv` — one row per paper. Columns, matched by header name
(case-insensitive, any order):

| Column | Notes |
|---|---|
| `title` | Required. |
| `authors` | Citation form: `Smith`, `Smith & Jones`, or `Smith et al.` |
| `year` | Four digits. |
| `journal` | Unabbreviated. For grey literature, the issuing body. |
| `category` | One of the five site headings. Anything else groups under "Other". |
| `access` | `Open access` or `Subscription`. Blank renders as "Access not recorded". |
| `url` | Only needed when there is no DOI. |
| `doi` | Bare DOI. The page builds `https://doi.org/…` from it. |
| `keywords` | Free text, feeds search only. |
| `region` | State, province, or study area. Shown as a tag. |
| `note` | One sentence. Only matters for featured entries. |
| `featured` | `yes` for papers also on `research.html`. |
| `pdf` | Filename, for the few files we host ourselves. |

Only `title` is required, and a row needs at least one of: a four-digit `year`,
a DOI-shaped `doi`, or an `http` `url`. Rows failing that are treated as
guidance rows and skipped, as are rows whose title begins with `EXAMPLE` — that
is what makes it safe to publish the intake template directly (see below).

## Linking policy

**Link out by DOI; host almost nothing.** A DOI is permanent and always resolves
to the version of record, so it survives a publisher reorganising its site. And
"free to read" is not the same permission as "free to republish" — several open
access papers in the 2025 batch carry licences that forbid redistribution.
Linking out avoids having to make that call paper by paper.

The exception is grey literature with no stable publisher page: government
technical reports, theses, data deposits. Those go in `assets/` and are named in
the `pdf` column.

**Do not paste in publisher abstracts.** They are copyrighted. The `note` column
is one sentence in our own words.

## Adding papers

Right now: edit `assets/publications.csv` and commit. Cloudflare Pages redeploys.

To hand it over to the Research Subcommittee so they can publish without a
redeploy:

1. Have them fill in `docs/NWPTF-publication-intake-template.xlsx`. Its columns
   match this CSV exactly, by design.
2. Upload it to Google Sheets.
3. **File → Share → Publish to web →** pick the sheet, choose **CSV**.
4. In `assets/publications.js`, change `DATA_URL` to that link.

After step 4 their edits appear on the site directly, with no code change and no
deploy. The template's guidance and example rows are skipped automatically, so it
can be published as-is.

## Related

`assets/research-submissions.js` pulls approved community submissions from the
"Suggest a study" form's sheet into **`research.html`** — the featured page.

That predates the split and is worth revisiting: submissions arguably belong in
the archive now, with the featured page reserved for deliberate editorial picks.
Moving it needs a small change, because that loader inserts into the featured
page's `.pub-cat` category blocks and the archive renders one flat list. Left as
is for now so nothing breaks. See `docs/research-submissions-setup.md`.
