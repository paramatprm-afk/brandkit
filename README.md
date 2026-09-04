# Brandkit

Brandkit is an AI brand studio for small Thai business owners. The first feature, **Instant
Brand**, takes a short description of a business (in Thai) and generates a starter brand kit:
name ideas, a color palette, a font pairing, 3 generated logo images, a bilingual tagline, and
bilingual social media captions. Logged-in users can save a generated kit and revisit it later
from a dashboard.

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
     Settings > API. Used for email magic-link auth and saving/loading brand kits. **Optional**:
     if unset, the generator works exactly as before, just without login/save/dashboard (those
     routes show a "not configured" message instead of the login/dashboard UI).

   All keys are read server-side only, except the Supabase URL/anon key, which are meant to be
   public (`NEXT_PUBLIC_*`) and are constrained by Row Level Security — see `supabase/schema.sql`.

2. If you're using the save/dashboard feature, set up Supabase:

   - Create a project at [supabase.com](https://supabase.com), then enable **Email** under
     Authentication > Providers (magic link is on by default for the Email provider).
   - Under Authentication > URL Configuration, add `http://localhost:3000/auth/callback` (and
     your production URL's equivalent) as a Redirect URL.
   - Run the SQL in [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL editor to
     create the `brands` table and its Row Level Security policies.

3. Install dependencies and run the dev server:

   ```bash
   npm install
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## How it works

- `/` — landing page with the pitch and a "Start" button.
- `/create` — a form where the owner describes their business in Thai (business name is
  optional; what they sell, who their customers are, and the desired vibe are required).
- `/api/generate` — a Next.js route handler that calls the Anthropic API server-side with a
  structured-output schema (see `lib/brandkit.ts`) and returns the generated brand kit as JSON.
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
  ensures a user can only load their own rows) and rendered with the same UI as `/results`,
  including its previously-generated logo images (no re-generation, no repeat image-API cost)
  and a delete button.
- `proxy.ts` — refreshes the Supabase session cookie on every request (Next.js 16 renamed
  `middleware.ts` to `proxy.ts`); required so Server Components see a valid session.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
