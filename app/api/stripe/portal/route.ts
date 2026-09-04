import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isStripeConfigured() || !isSupabaseConfigured()) {
    return NextResponse.json({ error: "การชำระเงินยังไม่ได้ตั้งค่าบนเซิร์ฟเวอร์นี้" }, { status: 500 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const customerId = subscription?.stripe_customer_id as string | undefined;
  if (!customerId) {
    return NextResponse.json(
      { error: "ยังไม่พบข้อมูลการสมัครสมาชิก กรุณาลองใหม่อีกครั้งในอีกสักครู่" },
      { status: 404 },
    );
  }

  const origin = req.nextUrl.origin;
  const stripe = getStripe();

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("stripe portal error:", err);
    const message = err instanceof Error ? err.message : "เปิดหน้าจัดการการสมัครสมาชิกไม่สำเร็จ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
