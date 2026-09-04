import Stripe from "stripe";

let client: Stripe | null = null;

/** Lazily-created singleton — never construct this at module load time, since
 * STRIPE_SECRET_KEY may be unset (see isStripeConfigured). */
export function getStripe() {
  if (!client) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    client = new Stripe(secretKey);
  }
  return client;
}

export function isStripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_PRICE_ID,
  );
}
