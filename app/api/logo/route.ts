import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

export const runtime = "nodejs";

const LogoRequestSchema = z.object({
  prompt: z.string().trim().min(1).max(2000),
});

function buildImagePrompt(concept: string) {
  return `Design a clean, professional logo for a small business, based on this concept:

${concept}

The logo must be simple, scalable, and memorable — suitable for use on packaging, storefront
signage, and social media profile images. Centered composition on a plain background, no mockup
or product photo, no watermark, no extra text beyond what is explicitly part of the logo mark.`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing OPENAI_API_KEY. Add it to .env.local and restart the dev server." },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = LogoRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "A logo concept prompt is required." }, { status: 400 });
  }

  const client = new OpenAI({ apiKey });

  try {
    const result = await client.images.generate({
      model: "gpt-image-1",
      prompt: buildImagePrompt(parsed.data.prompt),
      size: "1024x1024",
      quality: "medium",
      background: "transparent",
      output_format: "png",
      n: 1,
    });

    const image = result.data?.[0];
    if (!image?.b64_json) {
      return NextResponse.json(
        { error: "No image was returned. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ imageDataUrl: `data:image/png;base64,${image.b64_json}` });
  } catch (err) {
    console.error("brandkit logo generate error:", err);
    const message = err instanceof OpenAI.APIError ? err.message : "Failed to generate logo image.";
    const status = err instanceof OpenAI.APIError ? (err.status ?? 500) : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
