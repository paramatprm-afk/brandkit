import type { Metadata } from "next";
import { Prompt, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const prompt = Prompt({
  variable: "--font-heading",
  subsets: ["latin", "thai"],
  weight: ["500", "600", "700"],
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-body",
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Brandkit — สร้างแบรนด์มืออาชีพในบ่ายเดียว",
  description:
    "Brandkit is an AI brand studio for small Thai business owners — a professional brand in an afternoon: logo, packaging & marketing, in Thai and English.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${prompt.variable} ${notoSansThai.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FFFBF5] text-stone-900">{children}</body>
    </html>
  );
}
