/*
 * Cloudflare Pages Function — password gate for the NWPTF style guide.
 *
 * Protects /styleguide.html (and /styleguide) with a single shared password
 * via HTTP Basic Auth. Any username is accepted; only the password is checked.
 *
 * SETUP (Cloudflare Pages dashboard):
 *   Settings → Environment variables → add an ENCRYPTED variable named
 *   STYLEGUIDE_PASSWORD with the shared password as its value. Do NOT commit
 *   the password to this repo.
 *
 * NOTE: This only runs when the site is served by Cloudflare Pages. On
 * GitHub Pages it is inert and the style guide is NOT protected.
 */

const PROTECTED_PATHS = ['/styleguide', '/styleguide.html'];
const REALM = 'NWPTF Style Guide';

export async function onRequest(context) {
  const { request, env, next } = context;
  const pathname = new URL(request.url).pathname;

  if (!PROTECTED_PATHS.includes(pathname)) {
    return next();
  }

  const expected = env.STYLEGUIDE_PASSWORD;

  // If no password is configured, fail closed (deny) rather than expose the page.
  if (!expected) {
    return new Response('Style guide access is not configured.', { status: 503 });
  }

  const header = request.headers.get('Authorization') || '';
  if (header.startsWith('Basic ')) {
    let decoded = '';
    try {
      decoded = atob(header.slice(6));
    } catch (e) {
      decoded = '';
    }
    const provided = decoded.slice(decoded.indexOf(':') + 1);
    // Constant-time-ish comparison
    if (provided && provided.length === expected.length && timingSafeEqual(provided, expected)) {
      return next();
    }
  }

  return new Response('Authentication required.', {
    status: 401,
    headers: { 'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"` },
  });
}

function timingSafeEqual(a, b) {
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
