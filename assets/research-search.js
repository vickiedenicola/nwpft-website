// Client-side search over the publication list. Re-queries the DOM on each
// search, so any study added to the page later is automatically searchable,
// with no index to maintain.
(function () {
  var input = document.getElementById('pub-search-input');
  if (!input) return;
  var status = document.querySelector('.pub-search-status');

  // Count each category from the markup rather than trusting a hand-typed
  // number, so adding a study can't leave a stale "10 studies" label behind.
  Array.prototype.forEach.call(document.querySelectorAll('.pub-cat'), function (c) {
    var badge = c.querySelector('.pub-cat-count');
    if (!badge) { return; }
    var n = c.querySelectorAll('.pub').length;
    badge.textContent = n + (n === 1 ? ' study' : ' studies');
  });

  // Record each category's default open/closed state once (categories are stable).
  Array.prototype.forEach.call(document.querySelectorAll('.pub-cat'), function (c) {
    if (!('openDefault' in c.dataset)) { c.dataset.openDefault = c.hasAttribute('open') ? '1' : '0'; }
  });

  function pubs() { return document.querySelectorAll('.pub'); }
  function cats() { return document.querySelectorAll('.pub-cat'); }
  function textOf(p) {
    if (!p._text) { p._text = (p.textContent || '').toLowerCase().replace(/\s+/g, ' '); }
    return p._text;
  }

  function reset() {
    Array.prototype.forEach.call(pubs(), function (p) { p.hidden = false; });
    Array.prototype.forEach.call(cats(), function (c) {
      c.hidden = false;
      if (c.dataset.openDefault === '1') { c.setAttribute('open', ''); } else { c.removeAttribute('open'); }
    });
    status.textContent = '';
  }

  function run() {
    var raw = input.value.trim();
    if (!raw) { reset(); return; }
    var terms = raw.toLowerCase().split(/\s+/);
    var matches = 0;
    Array.prototype.forEach.call(pubs(), function (p) {
      var hit = terms.every(function (t) { return textOf(p).indexOf(t) !== -1; });
      p.hidden = !hit;
      if (hit) { matches++; }
    });
    Array.prototype.forEach.call(cats(), function (c) {
      var visible = c.querySelectorAll('.pub:not([hidden])').length;
      c.hidden = visible === 0;
      if (visible > 0) { c.setAttribute('open', ''); }
    });
    status.textContent = matches
      ? matches + (matches === 1 ? ' study matches “' : ' studies match “') + raw + '”'
      : 'No studies match “' + raw + '”. Try fewer or different terms.';
  }

  var timer;
  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(run, 120);
  });

  // Kept so anything injected into this page later stays searchable.
  document.addEventListener('research:updated', function () { if (input.value.trim()) { run(); } });
})();
