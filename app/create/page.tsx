"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function CreatePage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [whatTheySell, setWhatTheySell] = useState("");
  const [targetCustomers, setTargetCustomers] = useState("");
  const [vibe, setVibe] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, whatTheySell, targetCustomers, vibe }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      }

      sessionStorage.setItem("brandkit:result", JSON.stringify(data.result));
      sessionStorage.setItem(
        "brandkit:input",
        JSON.stringify({ businessName, whatTheySell, targetCustomers, vibe }),
      );
      router.push("/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 px-6 py-16">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="font-heading text-3xl font-semibold text-stone-900 sm:text-4xl">
          เล่าเรื่องธุรกิจของคุณให้เราฟัง
        </h1>
        <p className="mt-2 text-stone-600">
          ตอบสั้น ๆ เป็นภาษาไทยก็ได้ AI จะช่วยออกแบบแบรนด์ให้ครบทั้งภาษาไทยและอังกฤษ
        </p>

        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-6">
          <Field
            label="ชื่อธุรกิจ (ถ้ามี)"
            hint="Business name — optional, เว้นว่างได้ถ้ายังไม่มีชื่อ"
          >
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="เช่น ร้านกาแฟบ้านสวน"
              maxLength={120}
              className={inputClass}
            />
          </Field>

          <Field label="คุณขายอะไร" hint="What do you sell?" required>
            <textarea
              value={whatTheySell}
              onChange={(e) => setWhatTheySell(e.target.value)}
              placeholder="เช่น กาแฟดริปและเบเกอรี่โฮมเมด ใช้เมล็ดกาแฟจากดอยในไทย"
              required
              maxLength={600}
              rows={3}
              className={inputClass}
            />
          </Field>

          <Field label="ลูกค้าของคุณคือใคร" hint="Who are your customers?" required>
            <textarea
              value={targetCustomers}
              onChange={(e) => setTargetCustomers(e.target.value)}
              placeholder="เช่น คนทำงานวัยเริ่มต้น รักสุขภาพ ชอบถ่ายรูปลงโซเชียล"
              required
              maxLength={600}
              rows={3}
              className={inputClass}
            />
          </Field>

          <Field
            label="อยากให้แบรนด์ให้ความรู้สึกแบบไหน"
            hint="Vibe / feeling — เช่น สนุก, พรีเมียม, ดั้งเดิม"
            required
          >
            <input
              type="text"
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              placeholder="เช่น อบอุ่น เป็นธรรมชาติ พรีเมียมนิด ๆ"
              required
              maxLength={400}
              className={inputClass}
            />
          </Field>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 hover:shadow-orange-600/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                กำลังสร้างแบรนด์ของคุณ…
              </>
            ) : (
              "สร้างแบรนด์ของฉัน · Generate my brand"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-heading font-medium text-stone-900">
        {label}
        {required && <span className="ml-1 text-orange-600">*</span>}
      </span>
      {hint && <span className="text-xs text-stone-500">{hint}</span>}
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 shadow-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20";
