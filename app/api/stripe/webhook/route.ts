import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { createServiceRoleClient, isSupabaseServiceConfigured } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isStripeConfigured() || !isSupabaseServiceConfigured()) {
    return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const rawBody = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id ?? session.client_reference_id;
        const subscriptionId = session.subscription;
        if (userId && subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
          await upsertSubscription(supabase, userId, subscription);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        if (userId) {
          await upsertSubscription(supabase, userId, subscription);
        } else {
          // Fallback for events that somehow arrive without our metadata:
          // match the row we already have by Stripe customer id.
          await supabase
            .from("subscriptions")
            .update({
              status: subscription.status,
              stripe_subscription_id: subscription.id,
              price_id: subscription.items.data[0]?.price.id ?? null,
              current_period_end: currentPeriodEndIso(subscription),
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_customer_id", subscription.customer as string);
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("stripe webhook handling error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function currentPeriodEndIso(subscription: Stripe.Subscription) {
  const seconds = subscription.items.data[0]?.current_period_end;
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

async function upsertSubscription(
  supabase: ReturnType<typeof createServiceRoleClient>,
  userId: string,
  subscription: Stripe.Subscription,
) {
  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      price_id: subscription.items.data[0]?.price.id ?? null,
      current_period_end: currentPeriodEndIso(subscription),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) {
    console.error("failed to upsert subscription:", error);
    throw error;
  }
}
