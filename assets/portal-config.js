/*
 * NWPTF member portal - Supabase project settings.
 *
 * Fill these in from the Supabase dashboard (Project Settings > API):
 *   url     - the project URL, e.g. https://abcdefgh.supabase.co
 *   anonKey - the "anon / public" key. This key is SAFE to commit and ship
 *             to browsers; row-level security is what protects the data.
 *             Never put the service_role key here.
 *
 * While both values are empty the portal pages show a "not configured yet"
 * notice instead of the forms.
 */
window.NWPTF_SUPABASE = {
  url: '',
  anonKey: ''
};
