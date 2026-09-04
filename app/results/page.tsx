"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { BrandKitResult } from "@/lib/brandkit";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return sessionStorage.getItem("brandkit:result");
}

function getServerSnapshot() {
  return null;
}

export default function ResultsPage() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const result = useMemo<BrandKitResult | null>(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as BrandKitResult;
    } catch {
      return null;
    }
  }, [raw]);

  if (!result) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-stone-600">ยังไม่มีผลลัพธ์แบรนด์ กรุณาเริ่มสร้างใหม่อีกครั้ง</p>
        <Link
          href="/create"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-orange-700"
        >
          ไปสร้างแบรนด์ · Start
        </Link>
      </main>
    );
  }

  const fontQuery = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    result.fonts.heading,
  )}:wght@500;700&family=${encodeURIComponent(result.fonts.body)}:wght@400;500&display=swap`;

  return (
    <main className="flex-1 px-6 py-16">
      <link rel="stylesheet" href={fontQuery} />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-14">
        <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-orange-600">
              แบรนด์ของคุณพร้อมแล้ว
            </p>
            <h1 className="font-heading text-3xl font-semibold text-stone-900 sm:text-4xl">
              Your Instant Brand
            </h1>
          </div>
          <Link
            href="/create"
            className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition hover:border-orange-400 hover:text-orange-700"
          >
            ← สร้างใหม่ · Start over
          </Link>
        </header>

        {result.brandNameIdeas.length > 0 && (
          <Section title="ไอเดียชื่อแบรนด์" subtitle="Brand name ideas">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {result.brandNameIdeas.map((name) => (
                <div
                  key={name}
                  className="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm"
                >
                  <p className="font-heading text-xl font-semibold text-stone-900">{name}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="แท็กไลน์" subtitle="Tagline">
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-8 text-center">
            <p className="font-heading text-2xl font-semibold text-stone-900">
              {result.tagline.th}
            </p>
            <p className="mt-2 text-lg italic text-stone-600">{result.tagline.en}</p>
          </div>
        </Section>

        <Section title="โทนสี" subtitle="Color palette">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {result.palette.map((color) => (
              <div key={color.hex} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                <div className="h-24 w-full" style={{ backgroundColor: color.hex }} />
                <div className="p-3">
                  <p className="text-sm font-medium text-stone-900">{color.name}</p>
                  <p className="font-mono text-xs uppercase text-stone-500">{color.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="คู่ฟอนต์" subtitle="Font pairing">
          <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <p
              className="text-3xl font-semibold text-stone-900"
              style={{ fontFamily: `"${result.fonts.heading}", sans-serif` }}
            >
              {result.fonts.heading} — หัวข้อของคุณจะดูเป็นแบบนี้
            </p>
            <p
              className="mt-3 text-lg text-stone-600"
              style={{ fontFamily: `"${result.fonts.body}", sans-serif` }}
            >
              {result.fonts.body} — เนื้อหาข้อความปกติจะอ่านง่ายและดูเป็นมิตรแบบนี้
            </p>
            <p className="mt-4 text-sm text-stone-500">{result.fonts.rationale}</p>
          </div>
        </Section>

        <Section title="แนวคิดโลโก้" subtitle="Logo concepts">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {result.logoConcepts.map((concept, i) => (
              <div key={i} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-orange-600">
                  Concept {i + 1}
                </p>
                <p className="text-sm leading-relaxed text-stone-700">{concept}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="แคปชันโซเชียล" subtitle="Social media posts">
          <div className="flex flex-col gap-4">
            {result.socialPosts.map((post, i) => (
              <PostCard key={i} index={i + 1} th={post.th} en={post.en} />
            ))}
          </div>
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-baseline gap-2">
        <h2 className="font-heading text-xl font-semibold text-stone-900">{title}</h2>
        <span className="text-sm text-stone-500">· {subtitle}</span>
      </div>
      {children}
    </section>
  );
}

function PostCard({ index, th, en }: { index: number; th: string; en: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${th}\n\n${en}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-orange-600">
          Post {index}
        </span>
        <button
          onClick={handleCopy}
          className="rounded-full border border-stone-300 px-3 py-1 text-xs font-medium text-stone-600 transition hover:border-orange-400 hover:text-orange-700"
        >
          {copied ? "คัดลอกแล้ว ✓" : "คัดลอก · Copy"}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-medium text-stone-400">ไทย</p>
          <p className="text-sm leading-relaxed text-stone-800">{th}</p>
        </div>
        <div className="border-t border-stone-100 pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
          <p className="mb-1 text-xs font-medium text-stone-400">English</p>
          <p className="text-sm leading-relaxed text-stone-800">{en}</p>
        </div>
      </div>
    </div>
  );
}
