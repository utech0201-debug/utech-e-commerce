import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";


const placements = new Set(["homepage", "shop", "product"]);
const statuses = new Set(["draft", "pending", "approved", "paused", "rejected"]);

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email as string | undefined;
  if (!isAdminEmail(email)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const form = await request.formData();
  const action = String(form.get("action") ?? "create");
  const admin = getSupabaseAdmin();

  if (action === "status") {
    const id = String(form.get("id") ?? "");
    const status = String(form.get("status") ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(id) || !statuses.has(status)) {
      return NextResponse.json({ error: "Invalid ad update." }, { status: 400 });
    }
    await admin.from("marketplace_ads").update({ status }).eq("id", id);
    return NextResponse.redirect(new URL("/admin/marketplace/ads", request.url));
  }

  const title = String(form.get("title") ?? "").trim().slice(0, 120);
  const body = String(form.get("body") ?? "").trim().slice(0, 300);
  const href = String(form.get("href") ?? "").trim().slice(0, 1000);
  const imageUrl = String(form.get("imageUrl") ?? "").trim().slice(0, 2000) || null;
  const placement = String(form.get("placement") ?? "homepage");
  const targetCategory = String(form.get("targetCategory") ?? "").trim().slice(0, 80) || null;
  const sellerId = String(form.get("sellerId") ?? "").trim() || null;
  const productId = String(form.get("productId") ?? "").trim() || null;

  if (title.length < 2 || !href || !placements.has(placement)) {
    return NextResponse.json({ error: "Title, destination and placement are required." }, { status: 400 });
  }

  const { error } = await admin.from("marketplace_ads").insert({
    title, body, href, image_url: imageUrl, placement, target_category: targetCategory,
    seller_id: sellerId || null, product_id: productId || null, status: "approved",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.redirect(new URL("/admin/marketplace/ads", request.url));
}
