(function () {
  var bar = document.getElementById('filterBar');
  var cards = document.querySelectorAll('#resourceGrid .resource-card');
  bar.addEventListener('click', function (e) {
    var btn = e.target.closest('.filter-btn');
    if (!btn) return;
    bar.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    var f = btn.getAttribute('data-filter');
    cards.forEach(function (c) {
      c.style.display = (f === 'all' || c.getAttribute('data-type') === f) ? '' : 'none';
    });
  });
})();
