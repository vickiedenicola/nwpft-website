/* ============================================================
   Research submissions loader
   ------------------------------------------------------------
   Pulls approved, community-submitted studies from a published
   Google Sheet (CSV) and renders them into the matching category
   on the Research page. Approved entries become searchable
   automatically (see the search script in research.html).

   HOW IT WORKS
     submitter -> Google Form -> Google Sheet (Status column)
                  -> you mark "Approved" -> entry appears here

   SETUP (one time)
     1. In your Form's response Sheet, add a column named "Status".
     2. File > Share > Publish to web > pick that sheet > CSV.
     3. Paste the generated CSV link into SHEET_CSV_URL below.
   Until SHEET_CSV_URL is set, this stays dormant and the page
   shows only the hand-curated list. See
   docs/research-submissions-setup.md for the full walkthrough.

   The Sheet's columns are matched by header name (case-insensitive,
   any order). Recognized headers contain: title, url/link, author,
   journal/source, year, category, note/summary, status. Category
   must match one of the page's category headings. Only rows whose
   Status is "approved" are shown. Submitter contact columns are
   ignored here and never published.
   ============================================================ */
(function () {
  'use strict';

  // <-- Paste your published-to-web CSV URL between the quotes to go live.
  var SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSgnGXcQcfWn32obr2j9aZR-0-MH68GWo84z3e3ymhe_4JNm2qA1rfS7ApPEVY09br5fW9RqyM0uCY-/pub?gid=0&single=true&output=csv';

  if (!SHEET_CSV_URL) { return; }

  // ---- tiny CSV parser (handles quoted fields, commas, newlines) ----
  function parseCSV(text) {
    var rows = [], row = [], field = '', inQuotes = false, i = 0;
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

  // Map recognized header keywords to a column index.
  function mapColumns(headers) {
    var idx = {};
    headers.forEach(function (h, i) {
      var k = norm(h);
      if (idx.title == null && /title/.test(k)) { idx.title = i; }
      else if (idx.url == null && /(url|link)/.test(k)) { idx.url = i; }
      else if (idx.authors == null && /author/.test(k)) { idx.authors = i; }
      else if (idx.journal == null && /(journal|source|publication)/.test(k)) { idx.journal = i; }
      else if (idx.year == null && /year/.test(k)) { idx.year = i; }
      else if (idx.category == null && /category/.test(k)) { idx.category = i; }
      else if (idx.note == null && /(note|summary|description|abstract)/.test(k)) { idx.note = i; }
      else if (idx.status == null && /(status|approv)/.test(k)) { idx.status = i; }
    });
    return idx;
  }

  // Build { normalized-category-name -> <ol class="pub-list"> } from the page.
  function categoryLists() {
    var map = {};
    Array.prototype.forEach.call(document.querySelectorAll('.pub-cat'), function (cat) {
      var summary = cat.querySelector('summary');
      var list = cat.querySelector('.pub-list');
      if (!summary || !list) { return; }
      var count = cat.querySelector('.pub-cat-count');
      var name = summary.textContent;
      if (count) { name = name.replace(count.textContent, ''); }
      map[norm(name)] = list;
    });
    return map;
  }

  // Insert a <li class="pub"> into a list keeping newest-first year order.
  function insertByYear(list, li, year) {
    var items = list.querySelectorAll('.pub');
    for (var i = 0; i < items.length; i++) {
      var yEl = items[i].querySelector('.pub-year');
      var y = yEl ? parseInt(yEl.textContent, 10) : 0;
      if (year > (y || 0)) { list.insertBefore(li, items[i]); return; }
    }
    list.appendChild(li);
  }

  // Build a publication <li> from a row object, using textContent only
  // (submissions are user-generated — never inject HTML).
  function buildPub(p) {
    var li = document.createElement('li');
    li.className = 'pub';

    var yearSpan = document.createElement('span');
    yearSpan.className = 'pub-year';
    yearSpan.textContent = p.year || '';
    li.appendChild(yearSpan);

    var body = document.createElement('div');
    body.className = 'pub-body';

    var url = httpUrl(p.url);
    var title;
    if (url) {
      title = document.createElement('a');
      title.href = url;
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
      if (p.authors) { cite.appendChild(document.createTextNode(p.authors + '. ')); }
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

    li.appendChild(body);
    return li;
  }

  function refreshCounts() {
    Array.prototype.forEach.call(document.querySelectorAll('.pub-cat'), function (cat) {
      var count = cat.querySelector('.pub-cat-count');
      if (!count) { return; }
      var n = cat.querySelectorAll('.pub').length;
      count.textContent = n + (n === 1 ? ' study' : ' studies');
    });
  }

  function render(rows) {
    if (!rows.length) { return; }
    var idx = mapColumns(rows[0]);
    if (idx.title == null || idx.status == null) { return; } // need at least a title + an approval gate
    var lists = categoryLists();
    var added = 0;

    for (var r = 1; r < rows.length; r++) {
      var row = rows[r];
      if (!row || !row.length) { continue; }
      var get = function (key) { return idx[key] != null ? (row[idx[key]] || '').trim() : ''; };

      if (norm(get('status')) !== 'approved') { continue; }
      var title = get('title');
      if (!title) { continue; }

      var list = lists[norm(get('category'))];
      if (!list) { continue; } // unknown category -> leave in sheet for a fix

      var year = parseInt(get('year'), 10) || 0;
      var li = buildPub({
        title: title,
        url: get('url'),
        authors: get('authors'),
        journal: get('journal'),
        year: get('year'),
        note: get('note')
      });
      insertByYear(list, li, year);
      added++;
    }

    if (added) {
      refreshCounts();
      // Let the search re-index / re-run if a query is active.
      document.dispatchEvent(new Event('research:updated'));
    }
  }

  fetch(SHEET_CSV_URL, { cache: 'no-store' })
    .then(function (res) { if (!res.ok) { throw new Error('sheet ' + res.status); } return res.text(); })
    .then(function (csv) { render(parseCSV(csv)); })
    .catch(function () { /* silent: keep the hand-curated list if the sheet is unreachable */ });
})();
