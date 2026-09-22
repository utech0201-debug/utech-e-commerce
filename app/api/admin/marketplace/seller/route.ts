import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function isAdminEmail(email?: string | null) {
  const allowed = (process.env.UTECH_ADMIN_EMAILS ?? "").split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
  return !!email && allowed.includes(email.toLowerCase());
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email as string | undefined;
  if (!isAdminEmail(email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await request.formData();
  const sellerId = String(form.get("sellerId") ?? "");
  const decision = String(form.get("decision") ?? "");
  if (!sellerId || !["approved", "rejected"].includes(decision)) {
    return NextResponse.json({ error: "Invalid review request" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("sellers")
    .update({ status: decision, updated_at: new Date().toISOString() })
    .eq("id", sellerId)
    .eq("status", "pending");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.redirect(new URL("/admin/marketplace", request.url), 303);
}
