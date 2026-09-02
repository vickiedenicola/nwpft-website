// Load and play the hero video only on larger screens and when motion is allowed,
// so phones never download the clip (saves bandwidth, improves load time).
(function () {
  var v = document.querySelector('.hero-video');
  if (!v || !v.dataset.src) return;
  var bigEnough = window.matchMedia('(min-width: 861px)').matches;
  var allowsMotion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (bigEnough && allowsMotion) {
    v.src = v.dataset.src;
    var p = v.play();
    if (p && p.catch) { p.catch(function () {}); }
  }
})();
