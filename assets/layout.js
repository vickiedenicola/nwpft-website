/* NWPTF shared layout - injects header + footer on every page */
(function () {
  var page = document.body.getAttribute('data-page') || '';

  function navLink(href, label, key) {
    var cls = (key === page) ? ' class="active"' : '';
    return '<a href="' + href + '"' + cls + '>' + label + '</a>';
  }

  var headerHTML =
    '<div class="topbar"><div class="wrap">' +
      '<span class="topbar-left">Science-based management of invasive wild pigs across North America</span>' +
      '<span class="topbar-social">' +
        '<a href="https://www.facebook.com/NationalWildPigTaskForce" target="_blank" rel="noopener">Facebook</a>' +
        '<a href="https://www.instagram.com/nationalwildpigtaskforce" target="_blank" rel="noopener">Instagram</a>' +
        '<a href="https://www.linkedin.com/company/national-wild-pig-task-force" target="_blank" rel="noopener">LinkedIn</a>' +
        '<a href="https://x.com/NatWildPigTF" target="_blank" rel="noopener">X</a>' +
      '</span>' +
    '</div></div>' +
    '<header class="site-header"><div class="wrap">' +
      '<a class="site-logo" href="index.html"><img src="assets/nwptf-logo.png" alt="National Wild Pig Task Force"></a>' +
      '<nav class="site-nav">' +
        navLink('index.html', 'Home', 'home') +
        navLink('#', 'The Issue', 'issue') +
        navLink('resources.html', 'Resources', 'resources') +
        navLink('#', 'Research', 'research') +
        navLink('#', 'News', 'news') +
        navLink('about.html', 'About', 'about') +
      '</nav>' +
    '</div></header>';

  var footerHTML =
    '<footer class="site-footer"><div class="wrap">' +
      '<div class="footer-top">' +
        '<div class="footer-brand">' +
          '<img src="assets/nwptf-logo-light.png" alt="National Wild Pig Task Force">' +
          '<p>A coordinating body advancing science-based management of invasive wild pigs through research, collaboration, and outreach across North America.</p>' +
        '</div>' +
        '<div class="footer-col">' +
          '<h4>Explore</h4>' +
          '<a href="index.html">Home</a>' +
          '<a href="#">The Issue</a>' +
          '<a href="resources.html">Resources</a>' +
          '<a href="#">Research</a>' +
          '<a href="about.html">About</a>' +
        '</div>' +
        '<div class="footer-col">' +
          '<h4>Connect</h4>' +
          '<a href="mailto:nwptf.chair@gmail.com">nwptf.chair@gmail.com</a>' +
          '<a href="https://www.facebook.com/NationalWildPigTaskForce" target="_blank" rel="noopener">Facebook</a>' +
          '<a href="https://www.instagram.com/nationalwildpigtaskforce" target="_blank" rel="noopener">Instagram</a>' +
          '<a href="https://www.linkedin.com/company/national-wild-pig-task-force" target="_blank" rel="noopener">LinkedIn</a>' +
          '<a href="https://x.com/NatWildPigTF" target="_blank" rel="noopener">X</a>' +
        '</div>' +
      '</div>' +
      '<div class="footer-bottom">' +
        '<span>Copyright &copy; 2026 <a href="https://nwptf.org/" target="_blank" rel="noopener">National Wild Pig Task Force</a></span>' +
        '<span>SCIENCE / COORDINATION / ACTION</span>' +
      '</div>' +
    '</div></footer>';

  var h = document.querySelector('[data-layout="header"]');
  if (h) h.outerHTML = headerHTML;
  var f = document.querySelector('[data-layout="footer"]');
  if (f) f.outerHTML = footerHTML;
})();
