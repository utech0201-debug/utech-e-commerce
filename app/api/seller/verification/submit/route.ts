import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) return NextResponse.redirect(new URL("/auth/login?next=/seller/verification/submit", request.url));

  const form = await request.formData();
  const legalName = String(form.get("legal_name") ?? "").trim().slice(0,160);
  const country = String(form.get("country") ?? "").trim().slice(0,80);
  const phone = String(form.get("phone") ?? "").trim().slice(0,80);
  const idType = String(form.get("id_type") ?? "");
  if (!legalName || !country || !["national_id","passport","drivers_license","other"].includes(idType)) {
    return NextResponse.redirect(new URL("/seller/verification/submit?error=invalid", request.url));
  }

  const { data: seller } = await supabase.from("sellers").select("id").eq("user_id", userId).maybeSingle();
  if (!seller) return NextResponse.redirect(new URL("/seller/apply", request.url));

  const now = new Date().toISOString();
  const { error } = await supabase.from("seller_verifications").upsert({
    seller_id: seller.id,
    legal_name: legalName,
    country,
    phone: phone || null,
    id_type: idType,
    verification_status: "submitted",
    submitted_at: now,
    updated_at: now,
  }, { onConflict: "seller_id" });
  if (error) return NextResponse.redirect(new URL("/seller/verification/submit?error=save", request.url));

  await supabase.from("sellers").update({ verification_status: "submitted", updated_at: now }).eq("id", seller.id);
  await supabase.from("seller_verification_events").insert({ seller_id: seller.id, event_type: "submitted", note: "Seller submitted identity verification details." });

  return NextResponse.redirect(new URL("/seller/verification", request.url));
}
