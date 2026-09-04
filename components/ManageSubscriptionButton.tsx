"use client";

import { useState } from "react";

export function ManageSubscriptionButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "เปิดหน้าจัดการไม่สำเร็จ");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "เปิดหน้าจัดการไม่สำเร็จ");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        onClick={handleClick}
        disabled={loading}
        className={
          className ??
          "whitespace-nowrap rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-orange-400 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {loading ? "กำลังเปิด…" : "จัดการการสมัครสมาชิก · Manage subscription"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
