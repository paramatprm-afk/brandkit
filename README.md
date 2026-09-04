# Brandkit

Brandkit is an AI brand studio for small Thai business owners. The first feature, **Instant
Brand**, takes a short description of a business (in Thai) and generates a starter brand kit:
name ideas, a color palette, a font pairing, logo concept prompts, a bilingual tagline, and
bilingual social media captions.

## Getting Started

1. Copy the environment example and add your Anthropic API key:

   ```bash
   cp .env.local.example .env.local
   # then edit .env.local and set ANTHROPIC_API_KEY
   ```

   Get a key from [console.anthropic.com](https://console.anthropic.com/settings/keys). The key is
   only read server-side, in `app/api/generate/route.ts` — it is never sent to the browser.

2. Install dependencies and run the dev server:

   ```bash
   npm install
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000).

## How it works

- `/` — landing page with the pitch and a "Start" button.
- `/create` — a form where the owner describes their business in Thai (business name is
  optional; what they sell, who their customers are, and the desired vibe are required).
- `/api/generate` — a Next.js route handler that calls the Anthropic API server-side with a
  structured-output schema (see `lib/brandkit.ts`) and returns the generated brand kit as JSON.
- `/results` — renders the generated brand kit: color swatches, a live font-pairing preview,
  logo concept prompts, and Thai/English social post cards with copy buttons. Nothing is
  persisted; results are held in `sessionStorage` for the current browser tab only.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
