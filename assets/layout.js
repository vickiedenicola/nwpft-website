/* NWPTF shared layout - injects header + footer on every page */
(function () {
  var page = document.body.getAttribute('data-page') || '';

  function navLink(href, label, key) {
    var cls = (key === page) ? ' class="active"' : '';
    return '<a href="' + href + '"' + cls + '>' + label + '</a>';
  }

  // ---- Social icons (brand glyphs, CC0 from simple-icons) ----
  var ICONS = {
    facebook: 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.628-5.373-12.001-12-12.001S0 5.416 0 12.044c0 5.628 3.874 10.35 9.101 11.647Z',
    instagram: 'M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0Zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227a3.81 3.81 0 0 1-.899 1.382 3.744 3.744 0 0 1-1.38.896c-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421a3.716 3.716 0 0 1-1.379-.899 3.644 3.644 0 0 1-.9-1.38c-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03Zm0 3.678a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm7.846-10.405a1.441 1.441 0 0 1-2.88 0 1.44 1.44 0 0 1 2.88 0Z',
    linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z'
  };
  function socialA(href, label, key) {
    return '<a href="' + href + '" target="_blank" rel="noopener" aria-label="' + label + '" title="' + label + '">' +
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="' + ICONS[key] + '"/></svg>' +
    '</a>';
  }
  function socialRow(cls) {
    return '<span class="' + cls + '">' +
      socialA('https://www.facebook.com/NationalWildPigTaskForce', 'Facebook', 'facebook') +
      socialA('https://www.instagram.com/nationalwildpigtaskforce', 'Instagram', 'instagram') +
      socialA('https://www.linkedin.com/company/national-wild-pig-task-force', 'LinkedIn', 'linkedin') +
    '</span>';
  }

  var headerHTML =
    '<a class="skip-link" href="#main-content">Skip to content</a>' +
    '<div class="topbar"><div class="wrap">' +
      '<span class="topbar-left">Science-based management of invasive wild pigs across North America</span>' +
      '<span class="topbar-right">' +
        '<a class="topbar-feedback" href="feedback.html">Site Feedback</a>' +
        socialRow('topbar-social') +
      '</span>' +
    '</div></div>' +
    '<header class="site-header"><div class="wrap">' +
      '<a class="site-logo" href="index.html"><img src="assets/nwptf-logo.png" srcset="assets/nwptf-logo.png 1x, assets/nwptf-logo@2x.png 2x" width="900" height="349" alt="National Wild Pig Task Force"></a>' +
      '<button class="nav-toggle" aria-label="Toggle navigation" aria-expanded="false">' +
        '<span></span><span></span><span></span>' +
      '</button>' +
      '<nav class="site-nav">' +
        navLink('index.html', 'Home', 'home') +
        navLink('issue.html', 'The Issue', 'issue') +
        navLink('resources.html', 'Resources', 'resources') +
        navLink('research.html', 'Research', 'research') +
        navLink('events.html', 'Events', 'events') +
        navLink('about.html', 'About', 'about') +
      '</nav>' +
    '</div></header>';

  var footerHTML =
    '<footer class="site-footer"><div class="wrap">' +
      '<div class="footer-top">' +
        '<div class="footer-brand">' +
          '<img src="assets/nwptf-logo.png" srcset="assets/nwptf-logo.png 1x, assets/nwptf-logo@2x.png 2x" width="900" height="349" loading="lazy" alt="National Wild Pig Task Force">' +
          '<p>A technical, scientific, and leadership alliance of federal, tribal, provincial, state, and private partners working to control, reduce the damage caused by, and eradicate free-ranging wild pigs in North America.</p>' +
        '</div>' +
        '<div class="footer-col">' +
          '<h4>Explore</h4>' +
          '<a href="index.html">Home</a>' +
          '<a href="issue.html">The Issue</a>' +
          '<a href="resources.html">Resources</a>' +
          '<a href="research.html">Research</a>' +
          '<a href="events.html">Events</a>' +
          '<a href="governance.html">Governance</a>' +
          '<a href="about.html">About</a>' +
          '<a href="contact.html">Contact</a>' +
        '</div>' +
        '<div class="footer-col">' +
          '<h4>Connect</h4>' +
          '<a href="contact.html">Send us a message</a>' +
          socialRow('footer-social') +
        '</div>' +
      '</div>' +
      '<div class="footer-bottom">' +
        '<span>Copyright &copy; 2026 <a href="https://nwptf.org/" target="_blank" rel="noopener">National Wild Pig Task Force</a> &middot; <a href="credits.html">Image credits</a></span>' +
        '<span>SCIENCE / COORDINATION / ACTION</span>' +
      '</div>' +
    '</div></footer>';

  var h = document.querySelector('[data-layout="header"]');
  if (h) h.outerHTML = headerHTML;
  var f = document.querySelector('[data-layout="footer"]');
  if (f) f.outerHTML = footerHTML;

  // Give the first content section a target for the skip link
  var firstSection = document.querySelector('.site-header ~ section, .site-header + section');
  if (!firstSection) firstSection = document.querySelector('section');
  if (firstSection && !document.getElementById('main-content')) {
    firstSection.id = 'main-content';
    firstSection.setAttribute('tabindex', '-1');
  }

  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
})();
