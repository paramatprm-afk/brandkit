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

  if (!user || !user.email) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนอัปเกรด" }, { status: 401 });
  }

  const origin = req.nextUrl.origin;
  const stripe = getStripe();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      metadata: { supabase_user_id: user.id },
      subscription_data: { metadata: { supabase_user_id: user.id } },
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "สร้างเซสชันชำระเงินไม่สำเร็จ" }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("stripe checkout error:", err);
    const message = err instanceof Error ? err.message : "สร้างเซสชันชำระเงินไม่สำเร็จ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
