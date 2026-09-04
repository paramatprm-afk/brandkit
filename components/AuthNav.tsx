"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function AuthNav() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(
    isSupabaseConfigured() ? undefined : null,
  );

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

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-stone-200 bg-white/80 px-6 py-3 backdrop-blur">
      <Link href="/" className="font-heading font-semibold text-stone-900">
        Brandkit
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        {user === undefined ? null : user ? (
          <>
            <Link href="/dashboard" className="text-stone-600 hover:text-orange-700">
              แดชบอร์ด · Dashboard
            </Link>
            <button onClick={handleSignOut} className="text-stone-600 hover:text-orange-700">
              ออกจากระบบ · Sign out
            </button>
          </>
        ) : (
          <Link href="/login" className="text-stone-600 hover:text-orange-700">
            เข้าสู่ระบบ · Log in
          </Link>
        )}
      </nav>
    </header>
  );
}
