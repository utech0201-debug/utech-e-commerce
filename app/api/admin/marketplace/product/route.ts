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
  const productId = String(form.get("productId") ?? "");
  const decision = String(form.get("decision") ?? "");
  if (!productId || !["approved", "rejected"].includes(decision)) {
    return NextResponse.json({ error: "Invalid review request" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const update = decision === "rejected"
    ? { status: "rejected", rejection_reason: "Rejected during UTECH marketplace review.", updated_at: new Date().toISOString() }
    : { status: "approved", rejection_reason: null, updated_at: new Date().toISOString() };

  const { error } = await admin.from("seller_products").update(update).eq("id", productId).eq("status", "pending");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.redirect(new URL("/admin/marketplace", request.url), 303);
}
