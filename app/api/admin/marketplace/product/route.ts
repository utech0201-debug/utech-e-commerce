import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { containsRestrictedMarketplaceContent, marketplacePolicyNotice } from "@/lib/marketplace-policy";


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
  const { data: product, error: lookupError } = await admin
    .from("seller_products")
    .select("id, name, description, category, status")
    .eq("id", productId)
    .eq("status", "pending")
    .maybeSingle();

  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });
  if (!product) return NextResponse.json({ error: "Product is no longer awaiting review." }, { status: 409 });

  if (decision === "approved" && containsRestrictedMarketplaceContent(product.name, product.description, product.category)) {
    return NextResponse.json({ error: marketplacePolicyNotice }, { status: 422 });
  }

  const update = decision === "rejected"
    ? { status: "rejected", rejection_reason: "Rejected during UTECH marketplace review.", updated_at: new Date().toISOString() }
    : { status: "approved", rejection_reason: null, updated_at: new Date().toISOString() };

  const { error } = await admin
    .from("seller_products")
    .update(update)
    .eq("id", productId)
    .eq("status", "pending");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.redirect(new URL("/admin/marketplace", request.url), 303);
}
