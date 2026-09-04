import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * A Supabase client authenticated with the service role key — bypasses Row
 * Level Security entirely. Only for trusted server contexts with no user
 * session of their own, i.e. the Stripe webhook (after its signature is
 * verified). Never import this from a client component or an API route
 * that hasn't independently verified who's calling it.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase service role is not configured (SUPABASE_SERVICE_ROLE_KEY)");
  }
  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function isSupabaseServiceConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
