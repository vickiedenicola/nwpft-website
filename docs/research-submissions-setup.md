# Research submissions — setup guide

How to let people submit research articles, have the Research Subcommittee
review them, and have approved ones appear automatically in the **Publication
archive**.

```
submitter → Google Form → review sheet (Status column)
          → Subcommittee gets an email → sets Status = "Approved"
          → the paper appears on publications.html (and is searchable)
```

The approval gate belongs to the Subcommittee, so **share the response sheet
with them** — whoever sets the Status column decides what publishes.

The website code is already in place: `SUBMISSIONS_URL` in
`assets/publications.js`. It stays **dormant** until you paste your
published-sheet link into it (Step 5). A column-format reference lives at
`docs/research-submissions.sample.csv`.

Two notes on how this differs from the earlier setup:

- Approved papers land in the **archive** (`publications.html`), not on the
  Featured page. Featured is hand-written; promoting a paper there is a separate
  editorial decision. See `docs/publication-archive.md`.
- Entries are de-duplicated by DOI against `assets/publications.csv`, so a paper
  already in the curated file will not appear twice.

---

## Step 1 — Create the Google Form

Create a form (forms.google.com) titled e.g. "Submit a wild pig study."
Add these questions. The **field names matter** — the website matches columns
by keyword (title, link/url, author, journal/source, year, category,
note/summary, status), in any order.

| Question | Type | Notes |
|---|---|---|
| Title | Short answer | Required |
| Link (URL) | Short answer | Required. Must start with `http`/`https` |
| Authors | Short answer | e.g. "Smith et al." |
| Journal / source | Short answer | |
| Year | Short answer | Numbers only |
| Category | **Multiple choice** | Use the exact 5 options below |
| Note / summary | Paragraph | One or two plain-language sentences |
| Your name | Short answer | For follow-up; never shown publicly |
| Your email | Short answer | For follow-up; never shown publicly |

**Category options (must match the page headings exactly):**
- Management & control
- Damage & economics
- Ecology & impacts on wildlife
- Spread & human dimensions
- Disease & health

> A submission whose category doesn't match one of these still publishes, but
> groups under **Other** in the archive's theme filter — visible rather than
> silently dropped, so it prompts a fix.

## Step 2 — Link responses to a Sheet

In the Form, **Responses → Link to Sheets → Create new spreadsheet**. Each
submission becomes a row.

## Step 3 — Add a "Status" column

In the responses sheet, add a column named **Status** (right of the existing
columns). Leave it blank for new rows. You'll type `Approved` to publish a row.
Only rows with Status = `Approved` ever appear on the site.

## Step 4 — Get an email on every submission

In the responses sheet: **Extensions → Apps Script**, paste this, save:

```javascript
function onFormSubmit(e) {
  var to = 'vickie.denicola@fieldengine.com';
  var v = e.namedValues || {};
  var title = (v['Title'] || [''])[0];
  var body = Object.keys(v).map(function (k) { return k + ': ' + v[k].join(', '); }).join('\n');
  MailApp.sendEmail(
    to,
    'New research submission: ' + title,
    'A new study was submitted for the NWPTF Publication archive.\n\n' + body +
    '\n\nTo publish it, open the responses sheet and set its Status to "Approved".\n' +
    'To decline, leave Status blank or delete the row.'
  );
}
```

Then add a trigger so it runs automatically: in Apps Script, **Triggers (clock
icon) → Add Trigger** → choose `onFormSubmit`, event source **From spreadsheet**,
event type **On form submit** → Save (authorize when prompted).

## Step 5 — Publish the sheet and connect the site

1. In the responses sheet: **File → Share → Publish to web**.
2. Under "Link", pick the **responses sheet/tab**, and choose **Comma-separated
   values (.csv)**. Click **Publish** and copy the link.
3. In `assets/publications.js`, paste it:
   ```javascript
   var SUBMISSIONS_URL = 'https://docs.google.com/spreadsheets/d/e/XXXX/pub?output=csv';
   ```
4. Commit the change. The Publication archive will now show approved submissions.

> Publishing to web exposes only the columns in that sheet. Keep submitter
> name/email in the sheet (the site ignores them), but if you'd rather they
> never leave Google, put them on a separate, unpublished tab.

---

## Day-to-day

- **Approve:** set the row's **Status** to `Approved`. It appears within a
  minute or two (visitors may need to refresh).
- **Decline / remove:** clear the Status (or delete the row). It disappears.
- **Edit:** change any cell in the row; the site reflects it on next load.

No code changes are ever needed after Step 5 — only the spreadsheet.

## How it behaves on the page

- Approved entries appear in the **Publication archive**, sorted newest first
  alongside the curated papers, and tagged with their theme and access.
- They are covered by the archive's search box and its theme, year, and access
  filters.
- A paper already in `assets/publications.csv` is not shown twice — entries are
  de-duplicated by DOI, and the curated file wins.
- If the sheet is ever unreachable, the archive simply renders the curated file
  — nothing breaks.
- Approving a paper does **not** put it on the Featured page. That page is
  hand-written; promoting a paper there is a separate editorial decision.
