#!/usr/bin/env python3
"""Refresh assets/publications.csv from the published archive sheet.

assets/publications.csv is the fallback the site serves if the Subcommittee's
published sheet is ever unreachable (see assets/publications.js). It is only
useful if it is reasonably current, so this runs on a schedule.

The catch: the moment the sheet breaks is the moment the fallback matters, and a
naive copy would overwrite a good snapshot with whatever the broken sheet served.
So nothing is written unless the download passes every check below. A failure
exits non-zero, which turns the GitHub Actions run red and leaves the existing
snapshot untouched.

The sheet URL is read out of assets/publications.js so there is one source of
truth for it. Standard library only — the site has no build step or package
manager, and this script is CI-only.
"""

import csv
import io
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JS = ROOT / 'assets' / 'publications.js'
CSV_PATH = ROOT / 'assets' / 'publications.csv'

EXPECTED_COLUMNS = ['title', 'authors', 'year', 'journal', 'category', 'access',
                    'url', 'doi', 'keywords', 'region', 'note', 'featured', 'pdf']

# A sheet that lost most of its rows is a broken sheet, not a small archive.
MIN_PAPERS = 40
MAX_SHRINK = 0.25


def fail(msg):
    print(f'FAIL: {msg}', file=sys.stderr)
    sys.exit(1)


def data_url():
    m = re.search(r"var DATA_URL = '([^']+)'", JS.read_text())
    if not m:
        fail('could not find DATA_URL in assets/publications.js')
    url = m.group(1)
    if not url.startswith('http'):
        fail(f'DATA_URL is not a remote sheet ({url}); nothing to refresh')
    return url


def looks_real(row):
    """The same test assets/publications.js uses to tell a paper from a
    guidance or example row."""
    if re.fullmatch(r'\d{4}', (row.get('year') or '').strip()):
        return True
    if re.match(r'^(https?://(dx\.)?doi\.org/)?10\.\d{4,9}/', row.get('doi') or '', re.I):
        return True
    return bool(re.match(r'^https?://', row.get('url') or '', re.I))


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'nwptf-archive-refresh/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            if res.status != 200:
                fail(f'HTTP {res.status}')
            return res.read().decode('utf-8-sig')
    except Exception as e:                                    # network, DNS, TLS, 4xx, 5xx
        fail(f'could not fetch the sheet: {e}')


def process(raw):
    """Validate a downloaded sheet and write the snapshot. Kept separate from
    fetching so the guards can be exercised without network access."""
    # An un-published or permission-changed sheet serves a Google sign-in page,
    # which is HTML and would otherwise be written straight over the snapshot.
    head = raw.lstrip()[:400].lower()
    if head.startswith('<!doctype') or '<html' in head:
        fail('response is an HTML page, not CSV — the sheet is probably no longer published')

    rows = list(csv.DictReader(io.StringIO(raw)))
    if not rows:
        fail('sheet parsed to zero rows')

    got = [c.strip().lower() for c in (rows[0].keys() if rows else [])]
    missing = [c for c in EXPECTED_COLUMNS if c not in got]
    if missing:
        fail(f'header row is missing columns: {missing}')

    papers = [r for r in rows if (r.get('title') or '').strip()
              and not (r['title'] or '').strip().upper().startswith(('REFERENCE ROW', 'EXAMPLE'))
              and looks_real(r)]
    print(f'{len(rows)} rows downloaded, {len(papers)} of them papers')

    if len(papers) < MIN_PAPERS:
        fail(f'only {len(papers)} papers, below the floor of {MIN_PAPERS} — refusing to shrink the snapshot')

    if CSV_PATH.exists():
        current = [r for r in csv.DictReader(CSV_PATH.open()) if (r.get('title') or '').strip()]
        if current and len(papers) < len(current) * (1 - MAX_SHRINK):
            fail(f'{len(papers)} papers vs {len(current)} committed — a drop that large looks '
                 f'like a broken sheet, not an edit. Refresh by hand if it is real.')

    # Write papers only, in the canonical column order, so the committed file
    # stays pure data and diffs stay readable.
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=EXPECTED_COLUMNS, lineterminator='\n')
    w.writeheader()
    for r in papers:
        w.writerow({c: (r.get(c) or '').strip() for c in EXPECTED_COLUMNS})
    new = buf.getvalue()

    if CSV_PATH.exists() and CSV_PATH.read_text() == new:
        print('snapshot already matches the sheet — nothing to commit')
        return

    CSV_PATH.write_text(new)
    print(f'wrote {CSV_PATH.relative_to(ROOT)} — {len(papers)} papers')


def main(argv):
    # Optional argument: a local CSV file, or "-" for stdin, instead of fetching.
    # Used to verify the guards, and handy for a manual refresh from a download.
    if len(argv) > 1:
        raw = sys.stdin.read() if argv[1] == '-' else Path(argv[1]).read_text(encoding='utf-8-sig')
        print(f'reading from {argv[1]}')
    else:
        url = data_url()
        print(f'fetching {url[:78]}…')
        raw = fetch(url)
    process(raw)


if __name__ == '__main__':
    main(sys.argv)
