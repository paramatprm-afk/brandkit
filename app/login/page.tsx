"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    if (!isSupabaseConfigured()) {
      setStatus("error");
      setError("ยังไม่ได้ตั้งค่า Supabase บนเซิร์ฟเวอร์ (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY)");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setError(error.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-2xl font-semibold text-stone-900">เข้าสู่ระบบ · Log in</h1>
        <p className="mt-2 text-sm text-stone-600">
          กรอกอีเมลของคุณ เราจะส่งลิงก์เข้าสู่ระบบให้ทันที ไม่ต้องใช้รหัสผ่าน
        </p>

        {status === "sent" ? (
          <div className="mt-8 rounded-2xl border border-orange-200 bg-orange-50 p-6 text-center">
            <p className="font-medium text-stone-900">ตรวจสอบอีเมลของคุณ</p>
            <p className="mt-1 text-sm text-stone-600">
              เราได้ส่งลิงก์เข้าสู่ระบบไปที่ <span className="font-medium">{email}</span> แล้ว
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-heading font-medium text-stone-900">อีเมล · Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 shadow-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </label>

            {status === "error" && error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "sending" ? "กำลังส่ง…" : "ส่งลิงก์เข้าสู่ระบบ · Send magic link"}
            </button>
          </form>
        )}

        <Link href="/" className="mt-8 inline-block text-sm text-stone-500 hover:text-orange-700">
          ← กลับหน้าแรก
        </Link>
      </div>
    </main>
  );
}
