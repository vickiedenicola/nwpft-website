/* ============================================================
   Publication repository
   ------------------------------------------------------------
   Renders the full wild pig literature archive on
   publications.html from a single CSV, with filters for year,
   theme, access, and free-text search.

   WHERE THE DATA COMES FROM
     DATA_URL below. It ships pointing at the copy committed in
     this repo (assets/publications.csv). To hand the archive
     over to the Research Subcommittee, publish their Google
     Sheet to the web as CSV and paste that link in instead —
     the column format is identical, so nothing else changes
     and no redeploy is needed to add a paper.

       Sheet > File > Share > Publish to web > CSV

   COLUMNS (matched by header name, case-insensitive, any order)
     title, authors, year, journal, category, access, url, doi,
     keywords, region, note, featured, pdf
   Only `title` is required. `category` should match one of the
   five site headings; anything else is grouped under "Other".
   `featured` marks entries that also appear, hand-written with
   a note, on research.html — it is not used for display here.

   Rows render in pages of PAGE_SIZE to keep the archive fast
   as it grows toward the full 1958-2025 backlog.
   ============================================================ */
(function () {
  'use strict';

  /* The archive of record. Point this at the Subcommittee's published sheet
     (File > Share > Publish to web > CSV) to let them add papers without a
     commit or a deploy; the column format is identical either way. */
  var DATA_URL = 'assets/publications.csv';

  /* Last-known-good snapshot, committed in this repo. Used only if DATA_URL
     returns nothing — a Google outage, an un-published sheet, or a botched edit
     would otherwise leave the archive blank, and this is the whole page. Keep it
     refreshed from the sheet periodically. Ignored while DATA_URL is the same file. */
  var FALLBACK_URL = 'assets/publications.csv';

  var PAGE_SIZE = 40;

  /* Community submissions ("Suggest a study") — the Research Subcommittee's
     published review sheet. Rows are shown only where Status is "Approved",
     so the Subcommittee, not the site, is the gate. Merged with DATA_URL and
     de-duplicated by DOI, which means a paper stays put once it is folded into
     publications.csv. Set to '' to switch the pipeline off.
     Setup: docs/research-submissions-setup.md */
  var SUBMISSIONS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSgnGXcQcfWn32obr2j9aZR-0-MH68GWo84z3e3ymhe_4JNm2qA1rfS7ApPEVY09br5fW9RqyM0uCY-/pub?gid=0&single=true&output=csv';

  var CATS = [
    'Management & control',
    'Damage & economics',
    'Ecology & impacts on wildlife',
    'Spread & human dimensions',
    'Disease & health'
  ];

  var root = document.getElementById('pub-repo');
  if (!root) { return; }

  var els = {
    search: document.getElementById('repo-search'),
    theme: document.getElementById('repo-theme'),
    year: document.getElementById('repo-year'),
    access: document.getElementById('repo-access'),
    reset: document.getElementById('repo-reset'),
    status: document.getElementById('repo-status'),
    list: document.getElementById('repo-list'),
    more: document.getElementById('repo-more'),
    empty: document.getElementById('repo-empty')
  };

  var all = [], shown = 0, filtered = [];

  // ---- CSV parsing (quoted fields, embedded commas and newlines) ----
  function parseCSV(text) {
    var rows = [], row = [], field = '', inQuotes = false, i = 0;
    if (text.charCodeAt(0) === 0xFEFF) { i = 1; }          // strip BOM
    while (i < text.length) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          inQuotes = false; i++; continue;
        }
        field += c; i++; continue;
      }
      if (c === '"') { inQuotes = true; i++; continue; }
      if (c === ',') { row.push(field); field = ''; i++; continue; }
      if (c === '\r') { i++; continue; }
      if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
      field += c; i++;
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  function norm(s) {
    return (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ').replace(/&/g, 'and');
  }
  function httpUrl(u) {
    u = (u || '').trim();
    return /^https?:\/\//i.test(u) ? u : '';
  }

  /* Header aliases, so one renderer can read both the curated CSV (exact column
     names) and the submissions sheet, whose headers come from a Google Form and
     read like "Title of the study*" or "Journal or source". Each header claims
     the first field it matches; a field is only claimed once. Submitter name and
     email match nothing here, so contact details are never read, rendered, or
     made searchable. */
  var FIELDS = [
    ['title', /title/],
    ['doi', /\bdoi\b/],
    ['url', /url|link/],
    ['authors', /author/],
    ['journal', /journal|source|publication/],
    ['year', /year/],
    ['category', /categ|theme/],
    ['access', /access/],
    ['keywords', /keyword|topic/],
    ['region', /region|state|study area/],
    ['note', /note|summary|description/],
    ['featured', /featured/],
    ['pdf', /\bpdf\b|filename/],
    ['status', /status|approv/]
  ];

  function mapHeaders(head) {
    var idx = {}, taken = {};
    head.forEach(function (h, i) {
      var k = norm(h);
      for (var f = 0; f < FIELDS.length; f++) {
        var name = FIELDS[f][0];
        if (taken[name]) { continue; }
        if (k === name || FIELDS[f][1].test(k)) { idx[name] = i; taken[name] = true; return; }
      }
    });
    return idx;
  }

  function toObjects(rows, requireApproved) {
    if (!rows.length) { return []; }
    var idx = mapHeaders(rows[0]);
    if (idx.title == null) { return []; }
    var out = [];
    for (var r = 1; r < rows.length; r++) {
      if (!rows[r] || !rows[r].length) { continue; }
      var o = {};
      FIELDS.forEach(function (f) {
        o[f[0]] = idx[f[0]] != null ? (rows[r][idx[f[0]]] || '').trim() : '';
      });
      if (!o.title) { continue; }
      // The Subcommittee's review is the gate — unapproved rows never render.
      if (requireApproved && norm(o.status) !== 'approved') { continue; }
      // The intake template ships with a grey guidance row and a worked example.
      // Skip both so a sheet published straight from the template stays clean:
      // guidance rows carry neither a year nor a link, examples are labelled.
      if (/^example\b/i.test(o.title)) { continue; }
      // The guidance row carries prose in every column, so emptiness proves
      // nothing — a real row must have at least one field of the right shape.
      var looksReal = /^\d{4}$/.test((o.year || '').trim()) ||
                      /^(https?:\/\/(dx\.)?doi\.org\/)?10\.\d{4,9}\//i.test(o.doi || '') ||
                      /^https?:\/\//i.test(o.url || '');
      if (!looksReal) { continue; }
      // A DOI is the most durable link; fall back to whatever url was given.
      o._url = httpUrl(o.url) || (o.doi ? 'https://doi.org/' + o.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '') : '');
      o._cat = CATS.filter(function (k) { return norm(k) === norm(o.category); })[0] || 'Other';
      o._year = parseInt(o.year, 10) || 0;
      o._open = /open/i.test(o.access);
      o._sub = !!o.access && !o._open;
      o._hay = [o.title, o.authors, o.journal, o.year, o.category, o.keywords, o.region, o.note]
        .join(' ').toLowerCase();
      out.push(o);
    }
    return out;
  }

  // ---- filter controls ----
  function fillSelect(sel, values, label) {
    var opts = ['<option value="">' + label + '</option>'];
    values.forEach(function (v) {
      opts.push('<option value="' + String(v).replace(/"/g, '&quot;') + '">' + v + '</option>');
    });
    sel.innerHTML = opts.join('');
  }

  function buildControls() {
    var years = [], themes = [];
    all.forEach(function (p) {
      if (p._year && years.indexOf(p._year) === -1) { years.push(p._year); }
      if (themes.indexOf(p._cat) === -1) { themes.push(p._cat); }
    });
    years.sort(function (a, b) { return b - a; });
    themes.sort(function (a, b) {
      var ia = CATS.indexOf(a), ib = CATS.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    fillSelect(els.theme, themes, 'All themes');
    fillSelect(els.year, years, 'All years');
  }

  function activeFilters() {
    return {
      q: (els.search.value || '').trim().toLowerCase(),
      theme: els.theme.value,
      year: els.year.value,
      access: els.access.value
    };
  }

  function apply() {
    var f = activeFilters();
    var terms = f.q ? f.q.split(/\s+/) : [];
    filtered = all.filter(function (p) {
      if (f.theme && p._cat !== f.theme) { return false; }
      if (f.year && String(p._year) !== f.year) { return false; }
      // Access is still being backfilled, so unlabelled rows are their own
      // bucket rather than being silently dropped by either filter.
      if (f.access === 'open' && !p._open) { return false; }
      if (f.access === 'sub' && !p._sub) { return false; }
      if (f.access === 'none' && p.access) { return false; }
      return terms.every(function (t) { return p._hay.indexOf(t) !== -1; });
    });
    shown = 0;
    els.list.innerHTML = '';
    renderPage();
    var any = f.q || f.theme || f.year || f.access;
    els.reset.hidden = !any;
    els.empty.hidden = filtered.length > 0;
  }

  // ---- rendering (textContent only — never inject HTML from the sheet) ----
  function buildPub(p) {
    var li = document.createElement('li');
    li.className = 'pub';

    var y = document.createElement('span');
    y.className = 'pub-year';
    y.textContent = p.year || '';
    li.appendChild(y);

    var body = document.createElement('div');
    body.className = 'pub-body';

    var title;
    if (p._url) {
      title = document.createElement('a');
      title.href = p._url;
      title.target = '_blank';
      title.rel = 'noopener';
    } else {
      title = document.createElement('span');
    }
    title.className = 'pub-title';
    title.textContent = p.title;
    body.appendChild(title);

    if (p.authors || p.journal || p.year) {
      var cite = document.createElement('div');
      cite.className = 'pub-cite';
      // "Smith et al." already ends in a period — don't double it up.
      if (p.authors) {
        cite.appendChild(document.createTextNode(p.authors.replace(/\.\s*$/, '') + '. '));
      }
      if (p.journal) {
        var em = document.createElement('em');
        em.textContent = p.journal;
        cite.appendChild(em);
      }
      if (p.year) { cite.appendChild(document.createTextNode((p.journal ? ', ' : '') + p.year + '.')); }
      body.appendChild(cite);
    }

    if (p.note) {
      var note = document.createElement('p');
      note.className = 'pub-note';
      note.textContent = p.note;
      body.appendChild(note);
    }

    var meta = document.createElement('div');
    meta.className = 'pub-meta';
    [[p._cat, 'pub-tag'],
     [p._open ? 'Open access' : (p._sub ? 'Subscription' : 'Access not recorded'),
      p._open ? 'pub-tag pub-tag-open' : (p._sub ? 'pub-tag pub-tag-sub' : 'pub-tag pub-tag-quiet')],
     [p.region, 'pub-tag pub-tag-quiet']]
      .forEach(function (pair) {
        if (!pair[0]) { return; }
        var s = document.createElement('span');
        s.className = pair[1];
        s.textContent = pair[0];
        meta.appendChild(s);
      });
    if (meta.childNodes.length) { body.appendChild(meta); }

    li.appendChild(body);
    return li;
  }

  function renderPage() {
    var frag = document.createDocumentFragment();
    var end = Math.min(shown + PAGE_SIZE, filtered.length);
    for (var i = shown; i < end; i++) { frag.appendChild(buildPub(filtered[i])); }
    els.list.appendChild(frag);
    shown = end;

    var n = filtered.length;
    els.status.textContent = n
      ? 'Showing ' + shown + ' of ' + n + (n === 1 ? ' paper' : ' papers')
      : '';
    els.more.hidden = shown >= n;
    els.more.textContent = 'Show ' + Math.min(PAGE_SIZE, n - shown) + ' more';
  }

  // ---- events ----
  var timer;
  els.search.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(apply, 120);
  });
  [els.theme, els.year, els.access].forEach(function (s) {
    s.addEventListener('change', apply);
  });
  els.more.addEventListener('click', renderPage);
  els.reset.addEventListener('click', function () {
    els.search.value = '';
    els.theme.value = els.year.value = els.access.value = '';
    apply();
    els.search.focus();
  });

  // ---- load ----
  function load(url, requireApproved, required) {
    return fetch(url, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) { throw new Error(url + ' ' + res.status); }
        return res.text();
      })
      .then(function (csv) { return toObjects(parseCSV(csv), requireApproved); })
      .catch(function (e) {
        // A missing curated file is fatal; an unreachable submissions sheet is not.
        if (required) { throw e; }
        return [];
      });
  }

  // De-duplicate by DOI, else by title, so an approved submission stops being a
  // second copy the moment it is folded into publications.csv. The curated file
  // is loaded first and therefore wins on any collision.
  function dedupe(lists) {
    var seen = {}, out = [];
    lists.forEach(function (list) {
      list.forEach(function (p) {
        var doi = (p.doi || '').replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').toLowerCase();
        if (!doi) {
          var m = /10\.\d{4,9}\/[^\s"?]+/.exec(p._url || '');
          doi = m ? m[0].toLowerCase() : '';
        }
        var key = doi ? 'doi:' + doi : 'title:' + norm(p.title).replace(/[^a-z0-9]/g, '');
        if (seen[key]) { return; }
        seen[key] = true;
        out.push(p);
      });
    });
    return out;
  }

  // Try the archive of record; fall back to the committed snapshot if it yields
  // nothing. Only the last resort is allowed to be fatal.
  function loadCurated() {
    var sameFile = !FALLBACK_URL || FALLBACK_URL === DATA_URL;
    return load(DATA_URL, false, sameFile).then(function (rows) {
      if (rows.length || sameFile) { return rows; }
      return load(FALLBACK_URL, false, true);
    });
  }

  els.status.textContent = 'Loading the archive…';
  Promise.all([
    loadCurated(),
    SUBMISSIONS_URL ? load(SUBMISSIONS_URL, true, false) : Promise.resolve([])
  ])
    .then(function (lists) {
      all = dedupe(lists);
      all.sort(function (a, b) {
        return (b._year - a._year) || a.authors.localeCompare(b.authors);
      });
      if (!all.length) { throw new Error('no rows'); }
      buildControls();
      root.hidden = false;
      apply();
    })
    .catch(function () {
      els.status.textContent = '';
      var p = document.getElementById('repo-error');
      if (p) { p.hidden = false; }
    });
})();
