# Brandkit

Brandkit is an AI brand studio for small Thai business owners. The first feature, **Instant
Brand**, takes a short description of a business (in Thai) and generates a starter brand kit:
name ideas, a color palette, a font pairing, 3 generated logo images, a bilingual tagline, and
bilingual social media captions. Logged-in users can save a generated kit and revisit it later
from a dashboard. **Free** accounts can save 1 brand kit; a **Pro** monthly subscription (Stripe)
unlocks unlimited saved kits and the Packaging tab's PNG/PDF export.

## Getting Started

1. Copy the environment example and add your API keys:

   ```bash
   cp .env.local.example .env.local
   ```

   - `ANTHROPIC_API_KEY` — get one from [console.anthropic.com](https://console.anthropic.com/settings/keys).
     Used by `app/api/generate/route.ts` to generate the brand kit text content.
   - `OPENAI_API_KEY` — get one from [platform.openai.com](https://platform.openai.com/api-keys).
     Used by `app/api/logo/route.ts` (model: `gpt-image-1`) to generate the 3 logo images.
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from your Supabase project's
     Settings > API. Used for email magic-link auth and saving/loading brand kits.
   - `SUPABASE_SERVICE_ROLE_KEY` — same project, Settings > API. Read only by the Stripe webhook
     to write subscription status, bypassing Row Level Security.
   - `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_ID` — from your Stripe
     dashboard. Power the Pro subscription (checkout, billing portal, webhook sync).

   Everything above is **optional** in the sense that the app degrades gracefully feature-by-
   feature when a group is unset: with no Supabase config, the generator works exactly as before
   but login/save/dashboard/pricing routes show a "not configured" message; with Supabase but no
   Stripe config, login/save/dashboard work but upgrading shows a "not configured" message instead
   of starting checkout. Only `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` are meant
   to be public; every other key here is read server-side only.

2. If you're using the save/dashboard feature, set up Supabase:

   - Create a project at [supabase.com](https://supabase.com), then enable **Email** under
     Authentication > Providers (magic link is on by default for the Email provider).
   - Under Authentication > URL Configuration, add `http://localhost:3000/auth/callback` (and
     your production URL's equivalent) as a Redirect URL.
   - Run the SQL in [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL editor to
     create the `brands` and `subscriptions` tables, their Row Level Security policies, and the
     trigger that enforces the free plan's 1-brand-kit limit at the database level (so it can't be
     bypassed by calling the Supabase API directly — see the "Billing" section below).

3. If you're using the Pro plan, set up Stripe:

   - Create a Product with a recurring **monthly** Price in the
     [Stripe dashboard](https://dashboard.stripe.com/products) — copy its Price ID into
     `STRIPE_PRICE_ID`.
   - Under Developers > Webhooks, add an endpoint at `<your-app-url>/api/stripe/webhook`
     subscribed to `checkout.session.completed`, `customer.subscription.updated`, and
     `customer.subscription.deleted` — copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
   - For local testing, run `stripe listen --forward-to localhost:3000/api/stripe/webhook`
     (prints a temporary webhook secret to use instead) and use Stripe's
     [test card numbers](https://docs.stripe.com/testing) at checkout.

4. Install dependencies and run the dev server:

   ```bash
   npm install
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## How it works

- `/` — landing page with the pitch and a "Start" button.
- `/create` — a form where the owner describes their business in Thai (business name is
  optional; what they sell and who their customers are are required text fields). A required
  **tone selector** — Playful / Premium / Traditional (`lib/brandkit.ts`'s `TONE_OPTIONS`) — plus
  an optional free-text "additional details" field drive the brand's palette, fonts, logo style,
  and voice; see `TONE_GUIDANCE` in `app/api/generate/route.ts` for exactly what each tone changes.
- `/api/generate` — a Next.js route handler that calls the Anthropic API server-side with a
  structured-output schema (see `lib/brandkit.ts`) and returns the generated brand kit as JSON.
  The system prompt treats Thai and English as two independent pieces of copywriting (a Thai
  native copywriter and a separate English localization writer), not source-and-translation, so
  the Thai doesn't read like it started as English and the English isn't a literal rendering of
  the Thai — see the "CRITICAL — how to write the two languages" section of `SYSTEM_PROMPT`.
- `/api/logo` — a separate route handler that takes one logo concept prompt and calls the OpenAI
  Images API (`gpt-image-1`) server-side, returning the generated image as a base64 data URL.
- `/results` — renders the generated brand kit: color swatches, a live font-pairing preview, the
  3 generated logo images (each with its own loading/retry state and a download button), and
  Thai/English social post cards with copy buttons. The freshly-generated kit lives in
  `sessionStorage` (nothing is saved automatically); a logged-in user sees a "Save" button that
  writes it to Supabase.
- `/login` — email magic-link sign in (Supabase Auth). `/auth/callback` completes the link.
- `/dashboard` — lists the current user's saved brand kits, each linking to `/results/[id]`.
- `/results/[id]` — the saved version of a brand kit, loaded from Supabase (Row Level Security
  ensures a user can only load their own rows), with two tabs:
  - **Brand Kit** — the same UI as `/results`, including its previously-generated logo images
    (no re-generation, no repeat image-API cost), plus a delete button.
  - **Packaging** — a simple product-label template rendered as inline SVG, auto-filled with the
    brand's name, colors (an auto-picked background/text/accent role from the 5-color palette —
    see `lib/packaging.ts`), fonts, and logo (if one was generated). Product name and size are
    editable and update the preview live. "Download PNG" and "Download PDF" rasterize that SVG
    to a `<canvas>` (`lib/svg-export.ts`) with the Google Fonts embedded as base64 data URIs first
    — an `<img>`/blob render of an SVG doesn't pick up the page's own `<link>` stylesheet, so
    without this the export would silently fall back to a system font.
- `proxy.ts` — refreshes the Supabase session cookie on every request (Next.js 16 renamed
  `middleware.ts` to `proxy.ts`); required so Server Components see a valid session.
- `/pricing` — public Free vs. Pro comparison. The Pro price is read live from Stripe
  (`stripe.prices.retrieve`). The upgrade button starts Stripe Checkout; an existing Pro user sees
  a "Manage subscription" button (Stripe's Billing Portal) instead.

## Billing & gating

- `app/api/stripe/checkout/route.ts` — starts a Stripe Checkout subscription session for the
  logged-in user (`customer_email` + `metadata.supabase_user_id` for correlation).
- `app/api/stripe/portal/route.ts` — opens the Stripe Billing Portal for the user's existing
  Stripe customer, so they can update payment details or cancel.
- `app/api/stripe/webhook/route.ts` — verifies the Stripe signature, then upserts the user's plan
  into `public.subscriptions` on `checkout.session.completed` / `customer.subscription.updated` /
  `customer.subscription.deleted`, using the Supabase **service role** key to bypass Row Level
  Security (see `lib/supabase/service.ts`). This is the only place that key is used.
- **Free plan limit (1 saved brand kit)** is enforced in `supabase/schema.sql` itself — a
  `before insert` trigger on `public.brands` raises `FREE_PLAN_LIMIT_REACHED` once a non-Pro user
  already has a row. Saves go through the regular client-side Supabase insert (protected by Row
  Level Security either way), so enforcing the limit in the database, not just in the UI, means it
  holds regardless of which client performs the insert. `app/results/page.tsx`'s Save button reads
  the same plan/count ahead of time for a proactive "upgrade to save more" prompt, and also catches
  that specific error as a fallback.
- **Packaging export (PNG/PDF)** is gated per-request: `/results/[id]/page.tsx` looks up the
  user's plan server-side (`lib/subscriptions.ts`) and passes `isPro` down to `PackagingLabel`,
  which shows the live label preview either way but only renders the working Download buttons —
  and only runs the export function — when `isPro` is true. Unlike the save limit, this one is
  enforced in the UI layer rather than the database: exporting has no server cost (it's pure
  client-side canvas rendering, no API calls), so there was nothing worth protecting server-side.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
