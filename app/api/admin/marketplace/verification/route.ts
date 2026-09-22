import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const decisions = ["under_review", "verified", "needs_more_info", "rejected"] as const;
type Decision = (typeof decisions)[number];

function isAdmin(email?: string | null) {
  const allowlist = (process.env.UTECH_ADMIN_EMAILS ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  return !!email && allowlist.includes(email.toLowerCase());
}

function isAllowedTransition(current: string, next: Decision) {
  const transitions: Record<string, Decision[]> = {
    submitted: ["under_review", "verified", "needs_more_info", "rejected"],
    under_review: ["verified", "needs_more_info", "rejected"],
    needs_more_info: ["under_review", "verified", "rejected"],
    rejected: ["under_review", "verified", "needs_more_info"],
  };
  return transitions[current]?.includes(next) ?? false;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const email = claimsData?.claims?.email as string | undefined;

  if (!isAdmin(email)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const form = await request.formData();
  const verificationId = String(form.get("verificationId") ?? "");
  const decision = String(form.get("decision") ?? "") as Decision;
  const note = String(form.get("note") ?? "").trim();

  if (!verificationId || !decisions.includes(decision)) {
    return NextResponse.json({ error: "Invalid verification review request." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: verification, error: fetchError } = await admin
    .from("seller_verifications")
    .select("id, seller_id, verification_status")
    .eq("id", verificationId)
    .maybeSingle();

  if (fetchError || !verification) return NextResponse.json({ error: "Verification case not found." }, { status: 404 });
  if (!isAllowedTransition(verification.verification_status, decision)) {
    return NextResponse.json({ error: "This verification state cannot be changed to that status." }, { status: 409 });
  }

  const now = new Date().toISOString();
  const { error: verificationError } = await admin
    .from("seller_verifications")
    .update({
      verification_status: decision,
      rejection_reason: decision === "rejected" || decision === "needs_more_info" ? (note || null) : null,
      reviewed_at: decision === "under_review" ? null : now,
      updated_at: now,
    })
    .eq("id", verificationId);

  if (verificationError) return NextResponse.json({ error: "Could not update verification status." }, { status: 500 });

  const { error: sellerError } = await admin
    .from("sellers")
    .update({ verification_status: decision, updated_at: now })
    .eq("id", verification.seller_id);

  if (sellerError) {
    await admin.from("seller_verifications").update({
      verification_status: verification.verification_status,
      rejection_reason: null,
      reviewed_at: null,
      updated_at: new Date().toISOString(),
    }).eq("id", verificationId);

    return NextResponse.json({ error: "Could not synchronize seller verification status." }, { status: 500 });
  }

  const { error: eventError } = await admin
    .from("seller_verification_events")
    .insert({
      seller_id: verification.seller_id,
      verification_id: verificationId,
      event_type: decision,
      note: note || null,
    });

  if (eventError) return NextResponse.json({ error: "Verification updated, but the audit event could not be recorded." }, { status: 500 });

  redirect("/admin/marketplace/verification");
}
