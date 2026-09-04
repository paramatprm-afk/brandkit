# Brandkit

Brandkit is an AI brand studio for small Thai business owners. The first feature, **Instant
Brand**, takes a short description of a business (in Thai) and generates a starter brand kit:
name ideas, a color palette, a font pairing, 3 generated logo images, a bilingual tagline, and
bilingual social media captions.

## Getting Started

1. Copy the environment example and add your API keys:

   ```bash
   cp .env.local.example .env.local
   # then edit .env.local and set ANTHROPIC_API_KEY and OPENAI_API_KEY
   ```

   - `ANTHROPIC_API_KEY` — get one from [console.anthropic.com](https://console.anthropic.com/settings/keys).
     Used by `app/api/generate/route.ts` to generate the brand kit text content.
   - `OPENAI_API_KEY` — get one from [platform.openai.com](https://platform.openai.com/api-keys).
     Used by `app/api/logo/route.ts` (model: `gpt-image-1`) to generate the 3 logo images.

   Both keys are read server-side only — never sent to the browser.

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
- `/api/logo` — a separate route handler that takes one logo concept prompt and calls the OpenAI
  Images API (`gpt-image-1`) server-side, returning the generated image as a base64 data URL.
- `/results` — renders the generated brand kit: color swatches, a live font-pairing preview, the
  3 generated logo images (each with its own loading/retry state and a download button), and
  Thai/English social post cards with copy buttons. Nothing is persisted; results are held in
  `sessionStorage` for the current browser tab only.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
