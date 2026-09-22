import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function isAdminEmail(email?: string | null) {
  const allowed = (process.env.UTECH_ADMIN_EMAILS ?? "").split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
  return !!email && allowed.includes(email.toLowerCase());
}

const transitions: Record<string, string[]> = {
  pending: ["approved", "rejected"],
  approved: ["suspended"],
  suspended: ["approved"],
};

const decisions = new Set(["approved", "rejected", "suspended"]);

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email as string | undefined;
  if (!isAdminEmail(email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await request.formData();
  const sellerId = String(form.get("sellerId") ?? "").trim();
  const decision = String(form.get("decision") ?? "").trim();
  if (!sellerId || !decisions.has(decision)) {
    return NextResponse.json({ error: "Invalid seller review request" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: seller, error: lookupError } = await admin
    .from("sellers")
    .select("id, status")
    .eq("id", sellerId)
    .maybeSingle();

  if (lookupError) return NextResponse.json({ error: "Could not load seller." }, { status: 500 });
  if (!seller) return NextResponse.json({ error: "Seller not found." }, { status: 404 });

  const allowedNext = transitions[seller.status] ?? [];
  if (!allowedNext.includes(decision)) {
    return NextResponse.json({ error: "That seller status transition is not allowed." }, { status: 409 });
  }

  const { error } = await admin
    .from("sellers")
    .update({ status: decision, updated_at: new Date().toISOString() })
    .eq("id", sellerId)
    .eq("status", seller.status);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.redirect(new URL("/admin/marketplace", request.url), 303);
}
