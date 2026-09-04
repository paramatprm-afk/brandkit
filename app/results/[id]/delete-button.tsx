"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteBrandButton({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("ลบแบรนด์นี้ออกจากแดชบอร์ด? การกระทำนี้ย้อนกลับไม่ได้")) return;
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("brands").delete().eq("id", id);
    if (error) {
      alert(error.message);
      setDeleting(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-600 shadow-sm transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {deleting ? "กำลังลบ…" : "ลบ · Delete"}
    </button>
  );
}
