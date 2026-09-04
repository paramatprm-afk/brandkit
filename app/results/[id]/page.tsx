import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SupabaseNotConfigured } from "@/components/SupabaseNotConfigured";
import { BrandKitSections } from "@/components/BrandKitSections";
import type { BrandKitResult, LogoImage } from "@/lib/brandkit";
import DeleteBrandButton from "./delete-button";

export default async function SavedBrandPage(props: PageProps<"/results/[id]">) {
  const { id } = await props.params;

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

  // RLS restricts this to the current user's own rows — a non-owner (or a
  // bad id) simply comes back empty, so we can treat that as "not found".
  const { data: brand } = await supabase
    .from("brands")
    .select("id, business_name, kit, logos, created_at")
    .eq("id", id)
    .single();

  if (!brand) {
    notFound();
  }

  const result = brand.kit as BrandKitResult;
  const logos = (brand.logos as LogoImage[] | null) ?? [];
  const createdAt = new Date(brand.created_at as string);

  return (
    <main className="flex-1 px-6 py-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-14">
        <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-orange-600">
              {(brand.business_name as string | null) ?? "แบรนด์ที่บันทึกไว้"}
            </p>
            <h1 className="font-heading text-3xl font-semibold text-stone-900 sm:text-4xl">
              Saved Brand
            </h1>
            <p className="mt-1 text-xs text-stone-500">
              บันทึกเมื่อ {createdAt.toLocaleDateString("th-TH", { dateStyle: "long" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition hover:border-orange-400 hover:text-orange-700"
            >
              ← แดชบอร์ด · Dashboard
            </Link>
            <DeleteBrandButton id={brand.id as string} />
          </div>
        </header>

        <BrandKitSections result={result} initialLogos={logos} />
      </div>
    </main>
  );
}
