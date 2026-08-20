/*
 * NWPTF member portal - signup / login / account / password-reset logic.
 *
 * Runs on the portal pages, routed by <body data-page="...">
 * (signup | login | account). Sign-in is passwordless: members get a
 * one-time email link (Supabase OTP). Talks to Supabase via the
 * supabase-js v2 CDN bundle loaded on each page; project keys live in
 * assets/portal-config.js. Database schema: supabase/schema.sql.
 *
 * The two option lists below are the single source of truth for the
 * checkbox groups on the signup and account pages - edit them here.
 */
(function () {
  'use strict';

  // Areas of interest - mirrors the publication-archive categories so the
  // mailing list can be segmented with the same taxonomy as the literature.
  var INTERESTS = [
    'Damage & economics',
    'Disease & health',
    'Ecology & impacts on wildlife',
    'Management & control',
    'Spread & human dimensions'
  ];

  // NWPTF subcommittees a member can ask to join.
  var COMMITTEES = ['Research', 'Policy', 'Communications', 'Applied Management'];

  // Professional roles regarding wild pigs (multi-select + free-text other).
  var ROLES = [
    'Researcher',
    'Land manager',
    'Policy maker',
    'Student',
    'State official',
    'Federal official',
    'Agricultural producer',
    'Wild pig removal professional',
    'Outreach specialist',
    'Private entity'
  ];

  // Email preference categories. 'none' is special: it is exclusive and is
  // stored as an empty email_prefs array (= send nothing). Subcommittee
  // mailings are not a preference: joining a subcommittee IS the list.
  var EMAIL_PREFS = [
    { value: 'general', label: 'General NWPTF updates' },
    { value: 'interests', label: 'News in my areas of interest' },
    { value: 'events', label: 'Conferences & events' },
    { value: 'none', label: 'No emails' }
  ];

  // Country dropdown: North America pinned first, then everywhere else.
  var COUNTRIES_TOP = ['United States', 'Canada', 'Mexico'];
  var COUNTRIES = 'Afghanistan|Albania|Algeria|Andorra|Angola|Antigua & Barbuda|Argentina|Armenia|Australia|Austria|Azerbaijan|Bahamas|Bahrain|Bangladesh|Barbados|Belarus|Belgium|Belize|Benin|Bhutan|Bolivia|Bosnia & Herzegovina|Botswana|Brazil|Brunei|Bulgaria|Burkina Faso|Burundi|Cabo Verde|Cambodia|Cameroon|Central African Republic|Chad|Chile|China|Colombia|Comoros|Congo (Republic)|Congo (DRC)|Costa Rica|Cote d\'Ivoire|Croatia|Cuba|Cyprus|Czechia|Denmark|Djibouti|Dominica|Dominican Republic|Ecuador|Egypt|El Salvador|Equatorial Guinea|Eritrea|Estonia|Eswatini|Ethiopia|Fiji|Finland|France|Gabon|Gambia|Georgia|Germany|Ghana|Greece|Grenada|Guatemala|Guinea|Guinea-Bissau|Guyana|Haiti|Honduras|Hungary|Iceland|India|Indonesia|Iran|Iraq|Ireland|Israel|Italy|Jamaica|Japan|Jordan|Kazakhstan|Kenya|Kiribati|Kuwait|Kyrgyzstan|Laos|Latvia|Lebanon|Lesotho|Liberia|Libya|Liechtenstein|Lithuania|Luxembourg|Madagascar|Malawi|Malaysia|Maldives|Mali|Malta|Marshall Islands|Mauritania|Mauritius|Micronesia|Moldova|Monaco|Mongolia|Montenegro|Morocco|Mozambique|Myanmar|Namibia|Nauru|Nepal|Netherlands|New Zealand|Nicaragua|Niger|Nigeria|North Korea|North Macedonia|Norway|Oman|Pakistan|Palau|Panama|Papua New Guinea|Paraguay|Peru|Philippines|Poland|Portugal|Qatar|Romania|Russia|Rwanda|Saint Kitts & Nevis|Saint Lucia|Saint Vincent & the Grenadines|Samoa|San Marino|Sao Tome & Principe|Saudi Arabia|Senegal|Serbia|Seychelles|Sierra Leone|Singapore|Slovakia|Slovenia|Solomon Islands|Somalia|South Africa|South Korea|South Sudan|Spain|Sri Lanka|Sudan|Suriname|Sweden|Switzerland|Syria|Taiwan|Tajikistan|Tanzania|Thailand|Timor-Leste|Togo|Tonga|Trinidad & Tobago|Tunisia|Turkiye|Turkmenistan|Tuvalu|Uganda|Ukraine|United Arab Emirates|United Kingdom|Uruguay|Uzbekistan|Vanuatu|Vatican City|Venezuela|Vietnam|Yemen|Zambia|Zimbabwe'.split('|');

  var page = document.body.getAttribute('data-page') || '';
  var cfg = window.NWPTF_SUPABASE || {};
  var statusBox = document.getElementById('portal-status');
  // Base URL of the current directory, for email redirect links.
  var HERE = location.origin + location.pathname.replace(/[^\/]*$/, '');

  function el(id) { return document.getElementById(id); }

  function setStatus(box, msg, kind) {
    if (!box) return;
    box.textContent = msg || '';
    box.className = 'portal-status' + (kind ? ' ' + kind : '');
    box.style.display = msg ? 'block' : 'none';
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  var CHECK_OPTIONS = {
    interests: INTERESTS,
    committees: COMMITTEES,
    roles: ROLES,
    email_prefs: EMAIL_PREFS
  };

  // Fill every <div data-checks="..."> with its checkbox group.
  document.querySelectorAll('[data-checks]').forEach(function (box) {
    var name = box.getAttribute('data-checks');
    var options = CHECK_OPTIONS[name] || [];
    box.innerHTML = options.map(function (opt) {
      var value = typeof opt === 'string' ? opt : opt.value;
      var label = typeof opt === 'string' ? opt : opt.label;
      return '<label><input type="checkbox" name="' + esc(name) + '" value="' + esc(value) + '"> <span>' + esc(label) + '</span></label>';
    }).join('');
  });

  // Fill every <select data-country> with the country list.
  document.querySelectorAll('select[data-country]').forEach(function (sel) {
    var opts = ['<option value="">Select a country&hellip;</option>'];
    COUNTRIES_TOP.forEach(function (c) { opts.push('<option value="' + esc(c) + '">' + esc(c) + '</option>'); });
    opts.push('<option value="" disabled>──────────</option>');
    COUNTRIES.forEach(function (c) { opts.push('<option value="' + esc(c) + '">' + esc(c) + '</option>'); });
    sel.innerHTML = opts.join('');
  });

  // "No emails" is exclusive: checking it clears the others and vice versa.
  document.querySelectorAll('[data-checks="email_prefs"]').forEach(function (box) {
    box.addEventListener('change', function (e) {
      var t = e.target;
      if (!t || t.name !== 'email_prefs') return;
      if (!t.checked) return;
      box.querySelectorAll('input').forEach(function (i) {
        if (t.value === 'none' ? i.value !== 'none' : i.value === 'none') i.checked = false;
      });
    });
  });

  function checkedValues(form, name) {
    return Array.prototype.map.call(
      form.querySelectorAll('input[name="' + name + '"]:checked'),
      function (i) { return i.value; }
    );
  }
  function setChecked(form, name, values) {
    values = values || [];
    form.querySelectorAll('input[name="' + name + '"]').forEach(function (i) {
      i.checked = values.indexOf(i.value) !== -1;
    });
  }

  if (!cfg.url || !cfg.anonKey) {
    setStatus(statusBox,
      'The member portal is not connected yet. Site admin: add the Supabase project URL and anon key to assets/portal-config.js (see docs/member-portal.md).',
      'error');
    document.querySelectorAll('.portal-form button[type="submit"]').forEach(function (b) { b.disabled = true; });
    return;
  }

  var sb = window.supabase.createClient(cfg.url, cfg.anonKey);

  // Fields shared by the signup metadata and the account-page update.
  function profileFields(form) {
    var f = form.elements;
    return {
      first_name: f.first_name.value.trim(),
      last_name: f.last_name.value.trim(),
      title: f.title.value.trim(),
      affiliation: f.affiliation.value.trim(),
      phone: f.phone.value.trim(),
      country: f.country.value,
      roles: checkedValues(form, 'roles'),
      roles_other: f.roles_other.value.trim(),
      interests: checkedValues(form, 'interests'),
      committees: checkedValues(form, 'committees'),
      email_prefs: checkedValues(form, 'email_prefs').filter(function (v) { return v !== 'none'; })
    };
  }

  async function currentSession() {
    var res = await sb.auth.getSession();
    return res.data ? res.data.session : null;
  }

  // A consumed/expired sign-in link lands on account.html with the error
  // in the URL hash (corporate mail scanners pre-click links and use them
  // up). Detect it so we can explain instead of silently bouncing.
  function hashError() {
    var h = location.hash || '';
    if (/error_code=otp_expired/.test(h)) return 'expired';
    if (/error=access_denied/.test(h)) return 'expired';
    if (/[#&]error=/.test(h)) return 'other';
    return null;
  }

  // 6-digit sign-in code entry (the scanner-proof path). Present on the
  // signup and login pages; revealed after an email is requested, or via
  // the "already have a code" link.
  function revealCodeForm() {
    var cf = el('code-form');
    if (!cf) return;
    cf.hidden = false;
  }
  // The code pairs with the email it was sent to, but the member already
  // typed that email into the main form on this page - reuse it.
  function codeEmail() {
    var main = el('login-form') || el('signup-form');
    return main ? main.elements.email.value.trim() : '';
  }
  function initCodeForm() {
    var cf = el('code-form');
    if (!cf) return;
    cf.addEventListener('submit', async function (e) {
      e.preventDefault();
      var email = codeEmail();
      var token = cf.elements.code.value.trim();
      if (!email) {
        setStatus(statusBox, 'Type your email in the box above first, then the code.', 'error');
        return;
      }
      setStatus(statusBox, 'Checking your code…');
      var r = await sb.auth.verifyOtp({ email: email, token: token, type: 'email' });
      if (r.error) {
        setStatus(statusBox,
          'That code did not work. Codes expire after an hour, and requesting a new email replaces the old code — use the one from the newest email.',
          'error');
        return;
      }
      location.replace('account.html');
    });
    var tog = el('code-toggle');
    if (tog) {
      tog.addEventListener('click', function (e) {
        e.preventDefault();
        revealCodeForm();
        cf.elements.code.focus();
      });
    }
  }

  // ---------------------------------------------------------- signup
  async function initSignup() {
    if (await currentSession()) { location.replace('account.html'); return; }
    var form = el('signup-form');
    initCodeForm();
    setChecked(form, 'email_prefs', ['general', 'interests', 'events']);
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var email = form.elements.email.value.trim();
      setStatus(statusBox, 'Creating your profile…');
      var res = await sb.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true,
          data: profileFields(form),
          emailRedirectTo: HERE + 'account.html'
        }
      });
      if (res.error) { setStatus(statusBox, res.error.message, 'error'); return; }
      form.hidden = true;
      revealCodeForm();
      setStatus(statusBox,
        'One more step — we emailed you at ' + email +
        '. Click the sign-in link in it, or type the 6-digit code from that email below. ' +
        'If it has not arrived in a couple of minutes, check your spam or junk folder.', 'success');
    });
  }

  // ---------------------------------------------------------- login
  async function initLogin() {
    if (await currentSession()) { location.replace('account.html'); return; }
    var form = el('login-form');
    initCodeForm();
    if (/(^|[?&])expired=1/.test(location.search)) {
      setStatus(statusBox,
        'That sign-in link was already used or has expired. Some organizations\u2019 email security opens links automatically and uses them up — request a fresh email below, then type the 6-digit code from it instead of clicking the link.',
        'error');
    }
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var email = form.elements.email.value.trim();
      setStatus(statusBox, 'Sending your sign-in link…');
      var res = await sb.auth.signInWithOtp({
        email: email,
        options: { shouldCreateUser: false, emailRedirectTo: HERE + 'account.html' }
      });
      if (res.error) {
        var friendly = /not allowed|not found|signup/i.test(res.error.message)
          ? 'We could not find a member profile with that email. Check the spelling, or use "Become a member" below.'
          : res.error.message;
        setStatus(statusBox, friendly, 'error'); return;
      }
      revealCodeForm();
      setStatus(statusBox,
        'Check your inbox — an email is on its way to ' + email +
        '. Click its sign-in link, or type the 6-digit code from it below. ' +
        'Not there? Check your spam or junk folder.', 'success');
    });
  }

  // ---------------------------------------------------------- account
  async function initAccount() {
    if (hashError()) { location.replace('login.html?expired=1'); return; }
    var session = await currentSession();
    if (!session) { location.replace('login.html'); return; }
    var user = session.user;

    el('account-email').textContent = user.email || '';
    el('signout-btn').addEventListener('click', async function () {
      await sb.auth.signOut();
      location.replace('login.html');
    });

    var form = el('profile-form');
    var profileStatus = el('profile-status');

    // Load (or lazily create) this member's profile row.
    var res = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (res.error) { setStatus(profileStatus, 'Could not load your profile: ' + res.error.message, 'error'); return; }
    var p = res.data;
    if (!p) {
      var ins = await sb.from('profiles').insert({ id: user.id, email: user.email || '' });
      if (ins.error) { setStatus(profileStatus, 'Could not create your profile: ' + ins.error.message, 'error'); return; }
      p = {};
    }

    var f = form.elements;
    f.first_name.value = p.first_name || '';
    f.last_name.value = p.last_name || '';
    f.title.value = p.title || '';
    f.affiliation.value = p.affiliation || '';
    f.phone.value = p.phone || '';
    f.country.value = p.country || '';
    if (p.country && f.country.value !== p.country) {
      var extra = document.createElement('option');
      extra.value = extra.textContent = p.country;
      f.country.appendChild(extra);
      f.country.value = p.country;
    }
    f.roles_other.value = p.roles_other || '';
    setChecked(form, 'roles', p.roles);
    setChecked(form, 'interests', p.interests);
    setChecked(form, 'committees', p.committees);
    setChecked(form, 'email_prefs',
      (p.email_prefs && p.email_prefs.length) ? p.email_prefs : ['none']);
    el('account-loading').hidden = true;
    form.hidden = false;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      setStatus(profileStatus, 'Saving…');
      var up = await sb.from('profiles').update(profileFields(form)).eq('id', user.id);
      if (up.error) { setStatus(profileStatus, 'Save failed: ' + up.error.message, 'error'); return; }
      setStatus(profileStatus, 'Profile saved.', 'success');
    });

    // Change sign-in email (Supabase sends confirmation links).
    var emailForm = el('email-form');
    emailForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var emailStatus = el('email-status');
      var next = emailForm.elements.new_email.value.trim();
      setStatus(emailStatus, 'Requesting email change…');
      var r = await sb.auth.updateUser({ email: next }, { emailRedirectTo: HERE + 'account.html' });
      if (r.error) { setStatus(emailStatus, r.error.message, 'error'); return; }
      setStatus(emailStatus,
        'Check your inbox — confirmation links were sent to your old and new addresses. ' +
        'The change completes once confirmed.', 'success');
    });

    // Remove membership entirely (via the Cloudflare Pages function,
    // which verifies the session and deletes the auth user; profile
    // row cascades). Works only on the deployed site, not localhost.
    el('delete-btn').addEventListener('click', async function () {
      var sure = window.confirm(
        'Permanently remove your NWPTF membership?\n\n' +
        'This deletes your profile and takes you off every mailing list. It cannot be undone.');
      if (!sure) return;
      var deleteStatus = el('delete-status');
      setStatus(deleteStatus, 'Removing your membership…');
      var sess = await sb.auth.getSession();
      var token = sess.data && sess.data.session && sess.data.session.access_token;
      var resp = null;
      try {
        resp = await fetch('api/delete-account', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token }
        });
      } catch (err) { /* network failure handled below */ }
      if (!resp || !resp.ok) {
        setStatus(deleteStatus,
          'Something went wrong removing your account. Please use the contact form and we will remove it for you.',
          'error');
        return;
      }
      await sb.auth.signOut();
      setStatus(deleteStatus, 'Your membership has been removed. Sorry to see you go.', 'success');
      setTimeout(function () { location.replace('index.html'); }, 2500);
    });

  }

  if (page === 'signup') initSignup();
  else if (page === 'login') initLogin();
  else if (page === 'account') initAccount();
})();
