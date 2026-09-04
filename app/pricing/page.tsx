import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getIsPro, FREE_BRAND_LIMIT } from "@/lib/subscriptions";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { UpgradeButton } from "@/components/UpgradeButton";
import { ManageSubscriptionButton } from "@/components/ManageSubscriptionButton";

async function getProPriceLabel() {
  if (!isStripeConfigured()) return "ติดต่อสอบถามราคา";
  try {
    const stripe = getStripe();
    const price = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID!);
    if (price.unit_amount == null) return "ติดต่อสอบถามราคา";
    const amount = (price.unit_amount / 100).toLocaleString("th-TH");
    return `${amount} ${price.currency.toUpperCase()} / เดือน`;
  } catch (err) {
    console.error("failed to load Stripe price:", err);
    return "ติดต่อสอบถามราคา";
  }
}

export default async function PricingPage(props: PageProps<"/pricing">) {
  const searchParams = await props.searchParams;
  const cancelled = searchParams?.checkout === "cancelled";

  let isPro = false;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      isPro = await getIsPro(supabase, user.id);
    }
  }

  const proPriceLabel = await getProPriceLabel();

  return (
    <main className="flex-1 px-6 py-16">
      <div className="mx-auto w-full max-w-4xl">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-semibold text-stone-900 sm:text-4xl">
            ราคา · Pricing
          </h1>
          <p className="mt-2 text-stone-600">
            เริ่มต้นฟรี แล้วอัปเกรดเป็น Pro เมื่อพร้อมบันทึกแบรนด์ได้ไม่จำกัดและส่งออกแพ็กเกจจิ้ง
          </p>
          {cancelled && (
            <p className="mx-auto mt-4 max-w-md rounded-xl bg-stone-100 px-4 py-2 text-sm text-stone-600">
              ยกเลิกการชำระเงินแล้ว — ยังใช้แผน Free ได้ตามปกติ
            </p>
          )}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <PlanCard
            title="Free"
            price="฿0"
            priceSuffix="ตลอดไป"
            features={[
              `บันทึกแบรนด์คิทได้สูงสุด ${FREE_BRAND_LIMIT} แบรนด์`,
              "สร้างชื่อ โทนสี ฟอนต์ แท็กไลน์ แคปชัน ได้ไม่จำกัด",
              "สร้างและดาวน์โหลดโลโก้ AI",
            ]}
          >
            <Link
              href="/create"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-orange-400 hover:text-orange-700"
            >
              เริ่มต้นฟรี · Start
            </Link>
          </PlanCard>

          <PlanCard
            title="Pro"
            price={proPriceLabel}
            highlighted
            features={[
              "บันทึกแบรนด์คิทได้ไม่จำกัด",
              "ปลดล็อกแท็บแพ็กเกจจิ้ง (ฉลากสินค้า)",
              "ส่งออกฉลากเป็น PNG และ PDF",
            ]}
          >
            {isPro ? (
              <div className="flex flex-col items-start gap-2">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                  แผนปัจจุบันของคุณ · Current plan
                </span>
                <ManageSubscriptionButton />
              </div>
            ) : (
              <UpgradeButton />
            )}
          </PlanCard>
        </div>
      </div>
    </main>
  );
}

function PlanCard({
  title,
  price,
  priceSuffix,
  features,
  highlighted,
  children,
}: {
  title: string;
  price: string;
  priceSuffix?: string;
  features: string[];
  highlighted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col rounded-2xl border p-8 shadow-sm ${
        highlighted ? "border-orange-300 bg-orange-50/60" : "border-stone-200 bg-white"
      }`}
    >
      <h2 className="font-heading text-xl font-semibold text-stone-900">{title}</h2>
      <p className="mt-3">
        <span className="text-3xl font-bold text-stone-900">{price}</span>
        {priceSuffix && <span className="ml-1 text-sm text-stone-500">{priceSuffix}</span>}
      </p>
      <ul className="mt-6 flex flex-col gap-2.5 text-sm text-stone-700">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-0.5 text-orange-600">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8">{children}</div>
    </div>
  );
}
