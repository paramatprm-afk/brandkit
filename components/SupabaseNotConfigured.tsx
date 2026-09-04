import Link from "next/link";

export function SupabaseNotConfigured() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-stone-600">
        ยังไม่ได้ตั้งค่า Supabase บนเซิร์ฟเวอร์นี้ (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-orange-700"
      >
        ← กลับหน้าแรก
      </Link>
    </main>
  );
}
