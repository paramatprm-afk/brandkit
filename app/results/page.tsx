"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { BrandKitResult } from "@/lib/brandkit";

type LogoState =
  | { status: "loading" }
  | { status: "done"; imageDataUrl: string }
  | { status: "error"; message: string };

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
          <LogoConceptsSection concepts={result.logoConcepts} />
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

function LogoConceptsSection({ concepts }: { concepts: string[] }) {
  const [logos, setLogos] = useState<LogoState[]>(() => concepts.map(() => ({ status: "loading" })));

  useEffect(() => {
    const controllers = concepts.map(() => new AbortController());

    async function generate(index: number) {
      setLogos((prev) => prev.map((l, i) => (i === index ? { status: "loading" } : l)));
      try {
        const res = await fetch("/api/logo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: concepts[index] }),
          signal: controllers[index].signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "สร้างโลโก้ไม่สำเร็จ");
        setLogos((prev) =>
          prev.map((l, i) => (i === index ? { status: "done", imageDataUrl: data.imageDataUrl } : l)),
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setLogos((prev) =>
          prev.map((l, i) =>
            i === index
              ? { status: "error", message: err instanceof Error ? err.message : "สร้างโลโก้ไม่สำเร็จ" }
              : l,
          ),
        );
      }
    }

    concepts.forEach((_, i) => generate(i));

    return () => {
      controllers.forEach((c) => c.abort());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concepts.join("|")]);

  function retry(index: number) {
    const controller = new AbortController();
    setLogos((prev) => prev.map((l, i) => (i === index ? { status: "loading" } : l)));
    fetch("/api/logo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: concepts[index] }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "สร้างโลโก้ไม่สำเร็จ");
        setLogos((prev) =>
          prev.map((l, i) => (i === index ? { status: "done", imageDataUrl: data.imageDataUrl } : l)),
        );
      })
      .catch((err) => {
        setLogos((prev) =>
          prev.map((l, i) =>
            i === index
              ? { status: "error", message: err instanceof Error ? err.message : "สร้างโลโก้ไม่สำเร็จ" }
              : l,
          ),
        );
      });
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {concepts.map((concept, i) => (
        <LogoCard
          key={i}
          index={i}
          concept={concept}
          state={logos[i]}
          onRetry={() => retry(i)}
        />
      ))}
    </div>
  );
}

function LogoCard({
  index,
  concept,
  state,
  onRetry,
}: {
  index: number;
  concept: string;
  state: LogoState;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="flex aspect-square items-center justify-center bg-[repeating-conic-gradient(#f5f5f4_0%_25%,#ffffff_0%_50%)] bg-[length:16px_16px]">
        {state.status === "loading" && (
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
        )}
        {state.status === "error" && (
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <p className="text-xs text-red-600">{state.message}</p>
            <button
              onClick={onRetry}
              className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-medium text-stone-600 transition hover:border-orange-400 hover:text-orange-700"
            >
              ลองใหม่ · Retry
            </button>
          </div>
        )}
        {state.status === "done" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={state.imageDataUrl}
            alt={`Logo concept ${index + 1}`}
            className="h-full w-full object-contain p-4"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
          Concept {index + 1}
        </p>
        <p className="text-sm leading-relaxed text-stone-700">{concept}</p>
        {state.status === "done" && (
          <a
            href={state.imageDataUrl}
            download={`brandkit-logo-concept-${index + 1}.png`}
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
          >
            ดาวน์โหลด · Download
          </a>
        )}
      </div>
    </div>
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
