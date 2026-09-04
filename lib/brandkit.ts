import { z } from "zod";

export const BRAND_TONES = ["playful", "premium", "traditional"] as const;
export type BrandTone = (typeof BRAND_TONES)[number];

export const TONE_OPTIONS: { value: BrandTone; th: string; en: string; description: string }[] = [
  {
    value: "playful",
    th: "สนุกสนาน",
    en: "Playful",
    description: "สีสด ฟอนต์กลม ๆ น้ำเสียงร่าเริงเป็นกันเอง",
  },
  {
    value: "premium",
    th: "พรีเมียม",
    en: "Premium",
    description: "โทนสีเรียบหรู ฟอนต์คลาสสิก น้ำเสียงมั่นใจ ประณีต",
  },
  {
    value: "traditional",
    th: "ดั้งเดิม",
    en: "Traditional",
    description: "สีอบอุ่นแบบไทย ฟอนต์มีมรดกทางวัฒนธรรม น้ำเสียงอบอุ่นน่าเชื่อถือ",
  },
];

export const BrandFormSchema = z.object({
  businessName: z.string().trim().max(120).optional().default(""),
  whatTheySell: z.string().trim().min(1).max(600),
  targetCustomers: z.string().trim().min(1).max(600),
  tone: z.enum(BRAND_TONES),
  vibeDetails: z.string().trim().max(400).optional().default(""),
});

export type BrandFormInput = z.infer<typeof BrandFormSchema>;

export const BilingualTextSchema = z.object({
  th: z.string(),
  en: z.string(),
});

export const BrandKitResultSchema = z.object({
  brandNameIdeas: z
    .array(z.string())
    .describe(
      "Exactly 3 brand name ideas if the owner did not supply a business name, otherwise an empty array.",
    ),
  tagline: BilingualTextSchema.describe("A single one-line brand tagline, in Thai and English."),
  palette: z
    .array(
      z.object({
        hex: z.string().describe("A 6-digit hex color code, e.g. #F4A261"),
        name: z.string().describe("A short, evocative name for the color."),
      }),
    )
    .length(5),
  fonts: z.object({
    heading: z.string().describe("Google Fonts family name for headings, e.g. 'Prompt'"),
    body: z.string().describe("Google Fonts family name for body text, e.g. 'Sarabun'"),
    rationale: z.string().describe("One short sentence on why this pairing fits the brand."),
  }),
  logoConcepts: z
    .array(z.string())
    .length(3)
    .describe(
      "3 distinct logo concept descriptions written as detailed prompts suitable for sending to an image-generation model.",
    ),
  socialPosts: z
    .array(BilingualTextSchema)
    .length(5)
    .describe("5 social media post captions, each written in both Thai and English."),
});

export type BrandKitResult = z.infer<typeof BrandKitResultSchema>;

/** A logo image, once generated: a data URL, or null while missing/loading/failed. */
export type LogoImage = string | null;

/** Row shape of the public.brands table (see supabase/schema.sql). */
export interface SavedBrandRow {
  id: string;
  user_id: string;
  business_name: string | null;
  input: BrandFormInput;
  kit: BrandKitResult;
  logos: LogoImage[];
  created_at: string;
}

export function googleFontsUrl(fonts: { heading: string; body: string }) {
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    fonts.heading,
  )}:wght@500;700&family=${encodeURIComponent(fonts.body)}:wght@400;500&display=swap`;
}
