"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export function UpgradeButton({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      if (res.status === 401) {
        router.push("/login?next=/pricing");
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "อัปเกรดไม่สำเร็จ กรุณาลองใหม่");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "อัปเกรดไม่สำเร็จ กรุณาลองใหม่");
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
          "whitespace-nowrap rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {loading ? "กำลังไปหน้าชำระเงิน…" : (children ?? "อัปเกรดเป็น Pro · Upgrade")}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
