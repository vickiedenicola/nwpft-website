# Research Submission Form — build spec

Copy-paste content for the Google Form that feeds the Research page. Build it at
[forms.google.com](https://forms.google.com). Field names are chosen to match
what the website looks for (see `research-submissions-setup.md`), so keep them
close to as written. Fields marked **\*** are required.

---

## Form title
```
Submit a Wild Pig Study
```

## Form description
```
Suggest a peer-reviewed study or authoritative resource for the National Wild
Pig Task Force Research page. Submissions are reviewed before they appear.
Questions marked * are required.
```

---

## Questions

**1. Title of the study \***
- Type: Short answer
- Description: `The full title, as published.`
- Required: yes

**2. Link (URL) \***
- Type: Short answer
- Description: `A direct link to the study — must start with http:// or https://. A DOI link is ideal.`
- Required: yes
- Response validation: **Text → URL** (Google will reject anything that isn't a link)

**3. Authors**
- Type: Short answer
- Description: `For example: "Smith et al." or "Smith, Jones & Lee".`

**4. Journal or source**
- Type: Short answer
- Description: `For example: "Journal of Wildlife Management", or the publishing organization.`

**5. Year**
- Type: Short answer
- Description: `Publication year, e.g. 2024.`
- Response validation: **Number → Whole number** (optionally: between 1900 and 2100)

**6. Category \***
- Type: Multiple choice
- Required: yes
- Description: `Pick the best fit — this decides where it appears on the page.`
- Options (use these exact words — they must match the page's category headings):
  ```
  Management & control
  Damage & economics
  Ecology & impacts on wildlife
  Spread & human dimensions
  Disease & health
  ```

**7. Note / summary**
- Type: Paragraph
- Description: `One or two plain-language sentences on what the study found or why it matters.`

**8. Your name \***
- Type: Short answer
- Description: `For follow-up only — never shown publicly.`
- Required: yes

**9. Your email \***
- Type: Short answer
- Description: `For follow-up only — never shown publicly.`
- Required: yes

---

## Settings

- **Confirmation message** (Settings → Presentation → Confirmation message):
  ```
  Thanks! Your submission has been received and will be reviewed before it appears on the Research page.
  ```
- **Collect email addresses:** not required — the form already asks for an email
  in Q9. (Turn on only if you want Google's verified address too.)
- **Responses → Link to Sheets** → create the responses spreadsheet, then add a
  **Status** column to it (see `research-submissions-setup.md`, Steps 3–5).

---

## Why the exact category words matter

The website files each approved study under the category heading on
`research.html` whose name matches the submitted Category. If the words don't
match one of the five above, the study stays in the sheet (unpublished) until
the category is corrected. Keep the form options and the page headings in sync.
