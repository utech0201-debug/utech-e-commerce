import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function isAdminEmail(email?: string | null) {
  const allowed = (process.env.UTECH_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return !!email && allowed.includes(email.toLowerCase());
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const email = claimsData?.claims?.email as string | undefined;

  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const form = await request.formData();
  const sellerId = String(form.get("sellerId") ?? "").trim();
  const provider = String(form.get("provider") ?? "manual").trim().slice(0, 80);
  const providerReference = String(form.get("providerReference") ?? "").trim().slice(0, 160);

  if (!sellerId) {
    return NextResponse.json({ error: "Seller ID is required." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.schema("private").rpc("record_seller_payout", {
    p_seller_id: sellerId,
    p_provider: provider || "manual",
    p_provider_reference: providerReference || null,
  });

  if (error) {
    const message = error.message.includes("No eligible seller earnings")
      ? "This seller has no eligible earnings available for payout."
      : "Unable to record the payout.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.redirect(new URL("/admin/marketplace/payouts?success=1", request.url), 303);
}
