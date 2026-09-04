import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { BrandFormSchema, BrandKitResultSchema } from "@/lib/brandkit";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are an expert brand strategist and graphic designer who helps small Thai
business owners build a professional, cohesive brand identity in a single afternoon. You deeply
understand Thai culture, aesthetics, color symbolism, and how small/medium Thai businesses market
themselves both locally (in Thai) and to international customers (in English).

Guidelines:
- Every Thai-language piece of text must read naturally and warmly to a Thai native speaker,
  never like a stiff translation.
- Every English-language piece of text must be a genuine adaptation for an English-speaking
  audience, not a literal translation of the Thai.
- The color palette should be tasteful, on-trend, and appropriate for the requested vibe.
- Font pairings must be real, freely available Google Fonts families that support the requested
  vibe, and support Thai script when the body copy will include Thai text (prefer Thai-supporting
  families such as Prompt, Kanit, Sarabun, Mitr, Noto Sans Thai, Chonburi, Bai Jamjuree, Trirong,
  Charmonman when suitable for the vibe).
- Logo concepts should be vivid, concrete, production-ready descriptions an image-generation model
  could use directly: subject, style, composition, color, and mood.
- Keep captions concise and native to how small Thai brands actually post on social media.`;

function buildUserPrompt(input: {
  businessName: string;
  whatTheySell: string;
  targetCustomers: string;
  vibe: string;
}) {
  const lines = [
    `Business name: ${input.businessName ? input.businessName : "(not provided — please suggest 3 name ideas)"}`,
    `What they sell: ${input.whatTheySell}`,
    `Who their customers are: ${input.targetCustomers}`,
    `Desired brand vibe / feeling: ${input.vibe}`,
  ];
  return `Here is a small Thai business owner's description of their business, written in Thai:

${lines.join("\n")}

Create a complete "Instant Brand" starter kit for this business, following the required schema
exactly. If a business name was provided, return an empty array for brandNameIdeas and use that
name as the brand throughout your reasoning. If no business name was provided, propose exactly 3
strong Thai-market-appropriate name ideas.`;
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
