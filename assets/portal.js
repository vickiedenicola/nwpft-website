/*
 * NWPTF member portal - signup / login / account / password-reset logic.
 *
 * Runs on the four portal pages, routed by <body data-page="...">
 * (signup | login | account | reset). Talks to Supabase via the
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

  // Email preference categories. 'none' is special: it is exclusive and is
  // stored as an empty email_prefs array (= send nothing).
  var EMAIL_PREFS = [
    { value: 'general', label: 'General NWPTF updates' },
    { value: 'interests', label: 'News in my areas of interest' },
    { value: 'subcommittee', label: 'Subcommittee news' },
    { value: 'events', label: 'Conferences & events' },
    { value: 'none', label: 'No emails' }
  ];

  // Other working groups / associations a member may belong to.
  var AFFILIATIONS = [
    { value: 'NFSDMP', label: 'National Feral Swine Damage Management Program (USDA APHIS)' },
    { value: 'AFWA', label: 'AFWA — Association of Fish & Wildlife Agencies' },
    { value: 'SEAFWA', label: 'SEAFWA — Southeastern Assoc. of Fish & Wildlife Agencies' },
    { value: 'MAFWA', label: 'MAFWA — Midwest Assoc. of Fish & Wildlife Agencies' },
    { value: 'EUROBOAR', label: 'EUROBOAR — European wild boar research network' }
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
    other_affiliations: AFFILIATIONS,
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
      interests: checkedValues(form, 'interests'),
      committees: checkedValues(form, 'committees'),
      other_affiliations: checkedValues(form, 'other_affiliations'),
      other_affiliations_note: f.other_affiliations_note.value.trim(),
      email_prefs: checkedValues(form, 'email_prefs').filter(function (v) { return v !== 'none'; })
    };
  }

  async function currentSession() {
    var res = await sb.auth.getSession();
    return res.data ? res.data.session : null;
  }

  // ---------------------------------------------------------- signup
  async function initSignup() {
    if (await currentSession()) { location.replace('account.html'); return; }
    var form = el('signup-form');
    setChecked(form, 'email_prefs', ['general', 'interests', 'subcommittee', 'events']);
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var f = form.elements;
      if (f.password.value.length < 8) {
        setStatus(statusBox, 'Please choose a password of at least 8 characters.', 'error'); return;
      }
      if (f.password.value !== f.password2.value) {
        setStatus(statusBox, 'The two passwords do not match.', 'error'); return;
      }
      setStatus(statusBox, 'Creating your account…');
      var res = await sb.auth.signUp({
        email: f.email.value.trim(),
        password: f.password.value,
        options: {
          data: profileFields(form),
          emailRedirectTo: HERE + 'account.html'
        }
      });
      if (res.error) { setStatus(statusBox, res.error.message, 'error'); return; }
      form.hidden = true;
      setStatus(statusBox,
        'Almost done — we sent a confirmation link to ' + f.email.value.trim() +
        '. Open it to activate your account, then sign in.', 'success');
    });
  }

  // ---------------------------------------------------------- login
  async function initLogin() {
    if (await currentSession()) { location.replace('account.html'); return; }
    var form = el('login-form');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      setStatus(statusBox, 'Signing in…');
      var res = await sb.auth.signInWithPassword({
        email: form.elements.email.value.trim(),
        password: form.elements.password.value
      });
      if (res.error) { setStatus(statusBox, res.error.message, 'error'); return; }
      location.replace('account.html');
    });
  }

  // ---------------------------------------------------------- account
  async function initAccount() {
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
    f.other_affiliations_note.value = p.other_affiliations_note || '';
    setChecked(form, 'interests', p.interests);
    setChecked(form, 'committees', p.committees);
    setChecked(form, 'other_affiliations', p.other_affiliations);
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

    // Change password (while signed in).
    var pwForm = el('password-form');
    pwForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var pwStatus = el('password-status');
      var pw = pwForm.elements.new_password.value;
      if (pw.length < 8) { setStatus(pwStatus, 'Please choose a password of at least 8 characters.', 'error'); return; }
      var r = await sb.auth.updateUser({ password: pw });
      if (r.error) { setStatus(pwStatus, r.error.message, 'error'); return; }
      pwForm.reset();
      setStatus(pwStatus, 'Password updated.', 'success');
    });
  }

  // ---------------------------------------------------------- password reset
  function initReset() {
    var requestSec = el('reset-request');
    var setSec = el('reset-set');
    function showSetForm() { requestSec.hidden = true; setSec.hidden = false; }

    // Arriving from the emailed recovery link.
    if (/type=recovery/.test(location.hash)) showSetForm();
    sb.auth.onAuthStateChange(function (event) {
      if (event === 'PASSWORD_RECOVERY') showSetForm();
    });

    el('reset-request-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      var email = el('reset-request-form').elements.email.value.trim();
      setStatus(statusBox, 'Sending…');
      var r = await sb.auth.resetPasswordForEmail(email, { redirectTo: HERE + 'reset-password.html' });
      if (r.error) { setStatus(statusBox, r.error.message, 'error'); return; }
      setStatus(statusBox, 'If that address has an account, a reset link is on its way.', 'success');
    });

    el('reset-set-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      var form = el('reset-set-form').elements;
      if (form.new_password.value.length < 8) {
        setStatus(statusBox, 'Please choose a password of at least 8 characters.', 'error'); return;
      }
      if (form.new_password.value !== form.new_password2.value) {
        setStatus(statusBox, 'The two passwords do not match.', 'error'); return;
      }
      var r = await sb.auth.updateUser({ password: form.new_password.value });
      if (r.error) { setStatus(statusBox, r.error.message, 'error'); return; }
      el('reset-set').hidden = true;
      setStatus(statusBox, 'Password updated — you are signed in.', 'success');
      el('reset-done').hidden = false;
    });
  }

  if (page === 'signup') initSignup();
  else if (page === 'login') initLogin();
  else if (page === 'account') initAccount();
  else if (page === 'reset') initReset();
})();
