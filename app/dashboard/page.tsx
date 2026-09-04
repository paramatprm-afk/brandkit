import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SupabaseNotConfigured } from "@/components/SupabaseNotConfigured";
import type { BrandKitResult } from "@/lib/brandkit";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseNotConfigured />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: brands } = await supabase
    .from("brands")
    .select("id, business_name, kit, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="flex-1 px-6 py-16">
      <div className="mx-auto w-full max-w-4xl">
        <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-orange-600">
              {user.email}
            </p>
            <h1 className="font-heading text-3xl font-semibold text-stone-900 sm:text-4xl">
              แบรนด์ที่บันทึกไว้ · My Brands
            </h1>
          </div>
          <Link
            href="/create"
            className="whitespace-nowrap rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
          >
            + สร้างแบรนด์ใหม่ · New brand
          </Link>
        </header>

        {!brands || brands.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
            <p className="text-stone-600">ยังไม่มีแบรนด์ที่บันทึกไว้</p>
            <Link
              href="/create"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-orange-700"
            >
              เริ่มสร้างแบรนด์แรกของคุณ · Start
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {brands.map((brand) => {
              const kit = brand.kit as BrandKitResult;
              return (
                <Link
                  key={brand.id as string}
                  href={`/results/${brand.id}`}
                  className="flex flex-col gap-2 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-orange-300 hover:shadow-md"
                >
                  <p className="font-heading text-lg font-semibold text-stone-900">
                    {(brand.business_name as string | null) ?? "แบรนด์ไม่มีชื่อ"}
                  </p>
                  <p className="text-sm text-stone-600">{kit?.tagline?.th}</p>
                  <div className="mt-2 flex gap-1.5">
                    {kit?.palette?.slice(0, 5).map((color) => (
                      <span
                        key={color.hex}
                        className="h-4 w-4 rounded-full border border-black/5"
                        style={{ backgroundColor: color.hex }}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-stone-400">
                    {new Date(brand.created_at as string).toLocaleDateString("th-TH", {
                      dateStyle: "medium",
                    })}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
