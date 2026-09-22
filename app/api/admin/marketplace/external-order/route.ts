import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function isAdmin(email: string | undefined) {
  const allowlist = (process.env.UTECH_ADMIN_EMAILS ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  return !!email && allowlist.includes(email.toLowerCase());
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const email = claimsData?.claims?.email as string | undefined;
  if (!isAdmin(email)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const orderId = String(body.orderId ?? "");
  const decision = String(body.decision ?? "");
  if (!orderId || !["approve", "reject"].includes(decision)) return NextResponse.json({ error: "Invalid moderation request." }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data: order, error: fetchError } = await admin.from("seller_external_orders").select("id, payment_status, verification_status").eq("id", orderId).maybeSingle();
  if (fetchError || !order) return NextResponse.json({ error: "External order not found." }, { status: 404 });
  if (order.verification_status !== "pending") return NextResponse.json({ error: "This external order has already been reviewed." }, { status: 409 });

  if (decision === "reject") {
    const { error } = await admin.from("seller_external_orders").update({ verification_status: "rejected", payout_status: "cancelled", updated_at: new Date().toISOString() }).eq("id", orderId);
    if (error) return NextResponse.json({ error: "Could not reject the sale." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const { error } = await admin.from("seller_external_orders").update({
    verification_status: "approved",
    payout_status: order.payment_status === "paid" ? "eligible" : "pending",
    updated_at: new Date().toISOString(),
  }).eq("id", orderId);

  if (error) return NextResponse.json({ error: "Could not approve the sale." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
