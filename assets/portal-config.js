/*
 * NWPTF member portal - Supabase project settings.
 *
 * Fill these in from the Supabase dashboard (Project Settings > API):
 *   url     - the project URL, e.g. https://abcdefgh.supabase.co
 *   anonKey - the "anon / public" key. This key is SAFE to commit and ship
 *             to browsers; row-level security is what protects the data.
 *             Never put the service_role key here.
 *
 *   captchaSiteKey - the Cloudflare Turnstile *site* key for the signup and
 *             sign-in forms (Cloudflare dashboard > Turnstile). Public and
 *             safe to commit; the matching *secret* key goes only in
 *             Supabase (Authentication > Attack Protection). Leave it empty
 *             to run the forms without a CAPTCHA.
 *
 * While url and anonKey are empty the portal pages show a "not configured yet"
 * notice instead of the forms.
 */
window.NWPTF_SUPABASE = {
  url: 'https://umzvqtmbauyqxniaxrgs.supabase.co',
  anonKey: 'sb_publishable_2_ZskFAKuUR65cMpqKccJg_nZXiF6G1',
  captchaSiteKey: ''
};
