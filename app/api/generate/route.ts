import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { BrandFormSchema, BrandKitResultSchema, TONE_OPTIONS, type BrandTone } from "@/lib/brandkit";

export const runtime = "nodejs";

const TONE_GUIDANCE: Record<BrandTone, string> = {
  playful: `TONE: Playful (สนุกสนาน)
- Palette: bright, saturated, high-contrast colors that feel fun and energetic — think candy shop,
  street-food stall, or a youth-focused café. Avoid muted or corporate tones.
- Fonts: rounded, friendly, slightly bouncy Thai-supporting families (e.g. Mitr, Kanit, Bai
  Jamjuree, Baloo 2) — never a stiff serif.
- Voice: casual, warm, a little cheeky. Short punchy sentences. Natural use of Thai particles
  (จ้า, นะ, เลย, ครับ/ค่ะ used sparingly and only where a real person would). Emoji are welcome in
  social captions where a small Thai brand would actually use them, but never overused.
- Logo concepts: bold, illustrative, characterful — mascots, hand-drawn shapes, and playful icon
  work read well here.`,
  premium: `TONE: Premium (พรีเมียม)
- Palette: sophisticated and restrained — deep jewel tones, warm neutrals, black/cream/gold-adjacent
  accents. Confident use of negative space over busy color. Avoid neon or cartoonish hues.
- Fonts: elegant, editorial Thai-supporting families (e.g. Trirong, Taviraj, Chonburi for display;
  Sarabun or Noto Sans Thai for refined body text) — precise and understated, never playful.
- Voice: confident, polished, a little aspirational, but still warm — not cold or corporate. Fewer,
  more deliberate words. Minimal use of exclamation points or emoji.
- Logo concepts: minimal, geometric or fine-line marks; monogram or emblem style; generous
  whitespace; no clutter.`,
  traditional: `TONE: Traditional (ดั้งเดิม)
- Palette: warm, heritage-rooted Thai tones — terracotta, indigo, teak brown, marigold, rice-paper
  cream — evoking craft, heritage, and trust rather than trend.
- Fonts: Thai-supporting families with cultural warmth and legibility (e.g. Trirong, Charmonman for
  accents, Sarabun or Mitr for body) — avoid anything that reads as very modern or tech-forward.
- Voice: warm, respectful, and trustworthy, like a well-loved family business speaking to loyal
  customers. Comfortable with slightly more formal, considered phrasing than "playful", but still
  personal — never stiff corporate Thai.
- Logo concepts: classic emblem or badge compositions, motifs drawn from Thai craft/nature
  (leaves, grain, textile patterns, traditional line work) rendered in a clean, modern-enough way to
  still work on packaging today.`,
};

const SYSTEM_PROMPT = `You are two specialists working together for a small Thai business owner building a
professional brand identity in a single afternoon:

1. A Thai copywriter and native of the Thai market, who writes marketing Thai for a living and
   never sounds like a translation.
2. An international brand localization writer, who independently writes English copy for the same
   brand aimed at English-speaking customers — not a translator, a second copywriter.

You also act as a brand strategist and graphic designer: you understand Thai culture, color
symbolism, and how small/medium Thai businesses present themselves both locally and internationally.

CRITICAL — how to write the two languages:
- Write the Thai copy first, as an independent creative act, exactly as a Thai native copywriter
  would write it for a Thai audience on Thai social media. Use natural sentence rhythm, everyday
  vocabulary a Thai small-business owner and their customers actually use, and idiomatic phrasing.
  Avoid: English sentence structure carried over into Thai, overly formal or bureaucratic
  vocabulary where casual language fits better, and phrases that are technically correct but that
  no Thai person would actually say out loud or type in a caption.
- Then write the English copy as a SEPARATE piece of writing for an international audience — not a
  translation of the Thai you just wrote. Start from the same underlying idea (the product, the
  feeling, the offer) and re-express it the way a native English marketing copywriter would, using
  natural English idiom, rhythm, and cultural references. It is fine — expected, even — for the
  English to differ from the Thai in length, structure, imagery, or specific wording, as long as
  both capture the same brand feeling and message.
- Concretely: never produce English that reads like a dictionary-accurate rendering of the Thai
  sentence structure, and never produce Thai that reads like it started life as an English sentence.
  If you notice either happening, rewrite that piece independently in the target language.
- This applies to every bilingual field: the tagline, and every social post caption.

General guidelines:
- The color palette should be tasteful, on-trend, and consistent with the requested tone (see
  tone-specific direction below).
- Font pairings must be real, freely available Google Fonts families that support the tone and
  support Thai script for any Thai-rendering text (prefer Thai-supporting families such as Prompt,
  Kanit, Sarabun, Mitr, Noto Sans Thai, Chonburi, Bai Jamjuree, Trirong, Taviraj, Charmonman,
  Baloo 2 as appropriate to the tone).
- Logo concepts should be vivid, concrete, production-ready descriptions an image-generation model
  could use directly: subject, style, composition, color, and mood.
- Keep captions concise and native to how small Thai brands actually post on social media in each
  language — Thai captions should look like a Thai IG/Facebook caption; English captions should
  look like an English one, not a subtitle track under the Thai.`;

function buildUserPrompt(input: {
  businessName: string;
  whatTheySell: string;
  targetCustomers: string;
  tone: BrandTone;
  vibeDetails: string;
}) {
  const toneLabel = TONE_OPTIONS.find((t) => t.value === input.tone)!;
  const lines = [
    `Business name: ${input.businessName ? input.businessName : "(not provided — please suggest 3 name ideas)"}`,
    `What they sell: ${input.whatTheySell}`,
    `Who their customers are: ${input.targetCustomers}`,
    `Selected brand tone: ${toneLabel.en} (${toneLabel.th})`,
    input.vibeDetails ? `Additional feeling/vibe details from the owner: ${input.vibeDetails}` : null,
  ].filter(Boolean);

  return `Here is a small Thai business owner's description of their business, written in Thai:

${lines.join("\n")}

${TONE_GUIDANCE[input.tone]}

Create a complete "Instant Brand" starter kit for this business, following the required schema
exactly, and let the tone direction above concretely shape the palette, fonts, logo concepts, and
voice — not just the wording, the actual creative choices. If a business name was provided, return
an empty array for brandNameIdeas and use that name as the brand throughout your reasoning. If no
business name was provided, propose exactly 3 strong Thai-market-appropriate name ideas that fit
the selected tone.`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing ANTHROPIC_API_KEY. Add it to .env.local and restart the dev server." },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsedForm = BrandFormSchema.safeParse(body);
  if (!parsedForm.success) {
    return NextResponse.json(
      { error: "Invalid form data.", details: parsedForm.error.flatten() },
      { status: 400 },
    );
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(parsedForm.data) }],
      output_config: {
        format: zodOutputFormat(BrandKitResultSchema),
        effort: "medium",
      },
    });

    if (!response.parsed_output) {
      return NextResponse.json(
        { error: "The model response could not be parsed. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ result: response.parsed_output });
  } catch (err) {
    console.error("brandkit generate error:", err);
    const message = err instanceof Anthropic.APIError ? err.message : "Failed to generate brand kit.";
    const status = err instanceof Anthropic.APIError ? err.status ?? 500 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
