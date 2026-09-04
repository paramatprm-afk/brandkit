import type { SupabaseClient } from "@supabase/supabase-js";

/** Kept in sync with supabase/schema.sql's public.is_pro(uid) definition. */
export const PRO_STATUSES = ["active", "trialing"] as const;

export const FREE_BRAND_LIMIT = 1;

export function isProStatus(status: string | null | undefined) {
  return Boolean(status && (PRO_STATUSES as readonly string[]).includes(status));
}

export interface SubscriptionRow {
  status: string;
  current_period_end: string | null;
}

/** Reads the current user's own subscription row (RLS allows select of own row only). */
export async function getSubscription(
  supabase: SupabaseClient,
  userId: string,
): Promise<SubscriptionRow | null> {
  const { data } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as SubscriptionRow | null) ?? null;
}

export async function getIsPro(supabase: SupabaseClient, userId: string) {
  const subscription = await getSubscription(supabase, userId);
  return isProStatus(subscription?.status);
}
