/**
 * Whether Supabase env vars are present. Auth/save features are optional
 * infrastructure on top of the core generator, so every call site checks
 * this first — createBrowserClient/createServerClient throw synchronously
 * on a missing URL, and proxy.ts runs on every request.
 */
export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
