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

## Two sources, and why

`assets/publications.js` reads two constants:

- **`DATA_URL`** — the archive of record. Ships pointing at `assets/publications.csv`
  in this repo; point it at the Subcommittee's published sheet to hand the archive over.
- **`FALLBACK_URL`** — a last-known-good snapshot, always the committed CSV. Used
  **only** when `DATA_URL` returns no rows.

The fallback matters once `DATA_URL` is a Google Sheet. An outage, an accidentally
un-published sheet, or a botched edit that clears the header row would otherwise
leave the archive completely blank, and the archive is the whole page. With the
fallback, the worst case is a stale list instead of an empty one. Only the last
resort is allowed to surface the error message.

The snapshot is refreshed automatically, so it does not go stale:
`.github/workflows/refresh-archive-fallback.yml` runs `scripts/refresh_archive_fallback.py`
every Monday, and commits `assets/publications.csv` when the sheet has changed.
You can also trigger it from the repo's **Actions** tab (Run workflow) after a
big batch of edits, rather than waiting for Monday.

The script reads the sheet URL out of `publications.js`, so there is no second
copy of it to drift.

**It refuses to write unless the download passes every check**, because the
moment the sheet breaks is the moment the fallback matters — a naive copy would
overwrite a good snapshot with a Google sign-in page. It bails out if the
response is HTML rather than CSV, if the header row is missing expected columns,
if fewer than 40 papers come back, or if the count drops more than 25% against
what is committed. Any of those turns the Actions run red and leaves the existing
snapshot untouched, so a red run is a signal to look at the sheet, not at the
snapshot. If a big legitimate drop ever happens, refresh by hand.

For a manual refresh from a downloaded file:

```
python3 scripts/refresh_archive_fallback.py path/to/sheet.csv   # or - for stdin
```

Note: GitHub disables scheduled workflows in repositories with no pushes for 60
days. If the refresh quietly stops, that is usually why — a manual run re-arms it.

While both constants name the same file, the fallback is skipped (no point
fetching it twice).

## Adding papers

Right now: edit `assets/publications.csv` and commit. Cloudflare Pages redeploys.

### Handing the archive to the Subcommittee

1. Upload `docs/NWPTF-archive-sheet.csv` to Google Drive and open it with Google
   Sheets (Drive converts it). It already contains every paper in the archive, so
   the sheet starts as a complete copy rather than an empty template. Put it
   beside the submissions sheet and give the same editors access.
2. **File → Share → Publish to web →** pick the sheet, choose **CSV**, Publish.
3. In `assets/publications.js`, set `DATA_URL` to that published link. Leave
   `FALLBACK_URL` on `assets/publications.csv`.
4. Commit, then load `/publications` and confirm the paper count matches the sheet.

Row 2 of that file is a grey reference row describing each column. The loader
skips it — it has no four-digit year, no DOI-shaped `doi`, and no `http` url, which
is the test a real row has to pass. Leave it in place; it is what stops seven
editors having to remember the column rules.

After step 3 their edits appear on the site directly, with no code change and no
deploy. The template's guidance and example rows are skipped automatically, so it
can be published as-is.

## Community submissions

The "Suggest a study" form feeds the **archive**, gated on the Research
Subcommittee's approval:

```
submitter → Google Form → review sheet (Status column)
          → Subcommittee sets Status = "Approved"
          → the paper appears in the Publication archive
```

`SUBMISSIONS_URL` in `assets/publications.js` points at that sheet, published to
the web as CSV. The archive loads it alongside `publications.csv`, keeps only
rows whose Status is `Approved`, and de-duplicates by DOI — so once a submission
is folded into `publications.csv` it stops being a second copy, and the curated
file wins on any collision. Set `SUBMISSIONS_URL` to `''` to switch the pipeline
off; an unreachable sheet is non-fatal and the curated archive still renders.

Because the form's headers come from Google Forms and read like "Title of the
study*", columns are matched by keyword rather than exact name. Submitter name
and email match nothing, so contact details are never read, rendered, or made
searchable.

**Getting onto the Featured page is a separate, deliberate act.** `research.html`
is hand-written HTML, so promoting a paper means writing the entry and its note
and committing. That is intentional — approval puts a paper in the archive; it
does not put it in front of every visitor.

For the form and sheet setup, see `docs/research-submissions-setup.md`.
