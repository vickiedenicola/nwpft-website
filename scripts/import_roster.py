#!/usr/bin/env python3
"""One-off roster import for the NWPTF member portal.

Reads the legacy membership spreadsheet (Chuck's list) and creates a
pre-confirmed Supabase auth user for each member, with profile fields in
user_metadata so the handle_new_user trigger builds their profiles row.
Members sign in afterward with the normal email-code flow; no invite or
password email is sent by this script.

Run locally, never in CI. Needs the project's SECRET (service role) key,
which must never be committed:

    export SUPABASE_SECRET_KEY='sb_secret_...'
    python3 scripts/import_roster.py ~/Downloads/"NWPTF Membership.xlsx"            # dry run
    python3 scripts/import_roster.py ~/Downloads/"NWPTF Membership.xlsx" --apply    # create users

The dry run prints exactly what would be created and flags anything it
would skip (already-registered emails, unknown subcommittee names).

Requires openpyxl (pip install openpyxl) for the .xlsx; everything else
is the standard library.
"""

import json
import os
import re
import sys
import urllib.error
import urllib.request

SUPABASE_URL = "https://umzvqtmbauyqxniaxrgs.supabase.co"

# The portal's canonical subcommittee names (COMMITTEES in assets/portal.js).
KNOWN_COMMITTEES = {"Research", "Policy", "Communications", "Applied Management"}

# Existing-list members received every mailing, so imported profiles keep
# that behavior; members can dial it down on their account page.
DEFAULT_EMAIL_PREFS = ["general", "interests", "events"]

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def api(path, key, method="GET", body=None):
    req = urllib.request.Request(
        SUPABASE_URL + path,
        data=json.dumps(body).encode() if body is not None else None,
        method=method,
        headers={
            "apikey": key,
            "Authorization": "Bearer " + key,
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())


def existing_emails(key):
    """Every email already registered in auth.users (lowercased)."""
    emails, page = set(), 1
    while True:
        data = api(f"/auth/v1/admin/users?page={page}&per_page=1000", key)
        users = data.get("users", data if isinstance(data, list) else [])
        if not users:
            return emails
        for u in users:
            if u.get("email"):
                emails.add(u["email"].strip().lower())
        if len(users) < 1000:
            return emails
        page += 1


def load_rows(xlsx_path):
    import openpyxl

    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    ws = wb.worksheets[0]
    rows = list(ws.iter_rows(values_only=True))
    header = [str(c or "").strip().lower() for c in rows[0]]

    def col(fragment):
        for i, h in enumerate(header):
            if fragment in h:
                return i
        sys.exit(f"Could not find a '{fragment}' column in {xlsx_path}")

    idx = {
        "name": col("name"),
        "email": col("email"),
        "org": col("organization"),
        "title": col("title"),
        "committees": col("subcommitte"),  # sheet header is misspelled
    }
    out = []
    for r in rows[1:]:
        if not any(c is not None and str(c).strip() for c in r):
            continue
        out.append({k: str(r[i] or "").strip() for k, i in idx.items()})
    return out


def to_member(row):
    """Turn a sheet row into (email, user_metadata, warnings)."""
    warnings = []
    email = row["email"].lower()
    if not EMAIL_RE.match(email):
        return None, None, [f"invalid email {row['email']!r}"]

    parts = row["name"].split()
    first, last = (parts[0], " ".join(parts[1:])) if parts else ("", "")
    if len(parts) > 2:
        warnings.append(f"name split as {first!r} / {last!r} - check")

    committees = []
    for c in re.split(r"[\n,;/]+", row["committees"]):
        c = c.strip()
        if not c or c.lower() == "none":
            continue
        if c in KNOWN_COMMITTEES:
            committees.append(c)
        else:
            warnings.append(f"unknown subcommittee {c!r} dropped")

    meta = {
        "first_name": first,
        "last_name": last,
        "title": row["title"],
        "affiliation": row["org"],
        "phone": "",
        "country": "",
        "roles": [],
        "roles_other": "",
        "interests": [],
        "committees": committees,
        "email_prefs": DEFAULT_EMAIL_PREFS,
        "imported_from_roster": True,
    }
    return email, meta, warnings


def main():
    args = [a for a in sys.argv[1:] if a != "--apply"]
    apply = "--apply" in sys.argv
    if len(args) != 1:
        sys.exit(__doc__)
    key = os.environ.get("SUPABASE_SECRET_KEY")
    if not key:
        sys.exit("Set SUPABASE_SECRET_KEY first (Project Settings > API keys).")

    rows = load_rows(args[0])
    taken = existing_emails(key)
    print(f"{len(rows)} rows in sheet; {len(taken)} users already registered.\n")

    to_create, skipped = [], []
    for row in rows:
        email, meta, warnings = to_member(row)
        if email is None:
            skipped.append((row["name"], "; ".join(warnings)))
            continue
        if email in taken:
            skipped.append((row["name"], f"already registered ({email})"))
            continue
        to_create.append((email, meta, warnings))

    for name, why in skipped:
        print(f"  SKIP  {name}: {why}")
    for email, meta, warnings in to_create:
        note = ("  [" + "; ".join(warnings) + "]") if warnings else ""
        print(f"  {'CREATE' if apply else 'would create'}  {email}  "
              f"{meta['first_name']} {meta['last_name']} - {meta['affiliation']}"
              f"  committees={meta['committees']}{note}")

    print(f"\n{len(to_create)} to create, {len(skipped)} skipped.")
    if not apply:
        print("Dry run only. Re-run with --apply to create these users.")
        return

    created, failed = 0, 0
    for email, meta, _ in to_create:
        try:
            api("/auth/v1/admin/users", key, "POST",
                {"email": email, "email_confirm": True, "user_metadata": meta})
            created += 1
        except urllib.error.HTTPError as e:
            failed += 1
            print(f"  FAILED {email}: {e.code} {e.read().decode()[:200]}")
    print(f"\nDone: {created} created, {failed} failed.")


if __name__ == "__main__":
    main()
