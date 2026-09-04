"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isProStatus, FREE_BRAND_LIMIT } from "@/lib/subscriptions";
import { BrandKitSections } from "@/components/BrandKitSections";
import { UpgradeButton } from "@/components/UpgradeButton";
import type { BrandFormInput, BrandKitResult, LogoImage } from "@/lib/brandkit";

function subscribe() {
  return () => {};
}

function getResultSnapshot() {
  return sessionStorage.getItem("brandkit:result");
}

function getInputSnapshot() {
  return sessionStorage.getItem("brandkit:input");
}

function getServerSnapshot() {
  return null;
}

export default function ResultsPage() {
  const rawResult = useSyncExternalStore(subscribe, getResultSnapshot, getServerSnapshot);
  const rawInput = useSyncExternalStore(subscribe, getInputSnapshot, getServerSnapshot);

  const result = useMemo<BrandKitResult | null>(() => {
    if (!rawResult) return null;
    try {
      return JSON.parse(rawResult) as BrandKitResult;
    } catch {
      return null;
    }
  }, [rawResult]);

  const input = useMemo<BrandFormInput | null>(() => {
    if (!rawInput) return null;
    try {
      return JSON.parse(rawInput) as BrandFormInput;
    } catch {
      return null;
    }
  }, [rawInput]);

  const logosRef = useRef<LogoImage[]>([]);

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

  return (
    <main className="flex-1 px-6 py-16">
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

        <SaveBar result={result} input={input} logosRef={logosRef} />

        <BrandKitSections
          result={result}
          onLogosChange={(logos) => {
            logosRef.current = logos;
          }}
        />
      </div>
    </main>
  );
}

function SaveBar({
  result,
  input,
  logosRef,
}: {
  result: BrandKitResult;
  input: BrandFormInput | null;
  logosRef: React.RefObject<LogoImage[]>;
}) {
  const [user, setUser] = useState<User | null | undefined>(
    isSupabaseConfigured() ? undefined : null,
  );
  const [entitlement, setEntitlement] = useState<{ isPro: boolean; savedCount: number } | null>(
    null,
  );
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error" | "limit">(
    "idle",
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Nothing to reset when logged out: the "log in to save" branch below
    // renders before entitlement is ever read, so stale state here is inert.
    if (!user) return;
    const supabase = createClient();
    Promise.all([
      supabase.from("brands").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("subscriptions").select("status").eq("user_id", user.id).maybeSingle(),
    ]).then(([brandsRes, subRes]) => {
      setEntitlement({
        isPro: isProStatus(subRes.data?.status),
        savedCount: brandsRes.count ?? 0,
      });
    });
  }, [user]);

  const atFreeLimit = Boolean(
    entitlement && !entitlement.isPro && entitlement.savedCount >= FREE_BRAND_LIMIT,
  );

  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaveState("saving");
    setSaveError(null);

    const businessName = input?.businessName?.trim() || result.brandNameIdeas[0] || null;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("brands")
      .insert({
        user_id: user.id,
        business_name: businessName,
        input: input ?? {},
        kit: result,
        logos: logosRef.current,
      })
      .select("id")
      .single();

    if (error || !data) {
      if (error?.message.includes("FREE_PLAN_LIMIT_REACHED")) {
        setSaveState("limit");
        return;
      }
      setSaveState("error");
      setSaveError(error?.message ?? "บันทึกไม่สำเร็จ กรุณาลองใหม่");
      return;
    }

    setSaveState("saved");
    setSavedId(data.id as string);
  }, [user, input, result, logosRef]);

  if (user === undefined) {
    return null;
  }

  if (user === null) {
    return (
      <div className="flex flex-col items-start gap-2 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-600">เข้าสู่ระบบเพื่อบันทึกแบรนด์นี้ไว้ในแดชบอร์ดของคุณ</p>
        <Link
          href="/login"
          className="whitespace-nowrap rounded-full border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
        >
          เข้าสู่ระบบ · Log in to save
        </Link>
      </div>
    );
  }

  if (saveState === "limit" || atFreeLimit) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-700">
          แผน Free บันทึกแบรนด์คิทได้ {FREE_BRAND_LIMIT} แบรนด์ — อัปเกรดเป็น Pro เพื่อบันทึกได้ไม่จำกัด
        </p>
        <UpgradeButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-stone-900">บันทึกแบรนด์นี้ไว้ในแดชบอร์ดของคุณ</p>
        {saveState === "error" && saveError && (
          <p className="mt-1 text-xs text-red-600">{saveError}</p>
        )}
      </div>
      {saveState === "saved" && savedId ? (
        <Link
          href={`/results/${savedId}`}
          className="whitespace-nowrap rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-orange-400 hover:text-orange-700"
        >
          บันทึกแล้ว ✓ · View saved
        </Link>
      ) : (
        <button
          onClick={handleSave}
          disabled={saveState === "saving"}
          className="whitespace-nowrap rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saveState === "saving" ? "กำลังบันทึก…" : "บันทึกแบรนด์นี้ · Save"}
        </button>
      )}
    </div>
  );
}
