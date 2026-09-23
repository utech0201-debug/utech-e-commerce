import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const placements = new Set(["homepage", "shop", "product"]);

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { data: seller } = await supabase.from("sellers").select("id,status").eq("user_id", userId).maybeSingle();
  if (!seller || seller.status !== "approved") return NextResponse.json({ error: "Your seller account must be approved." }, { status: 403 });

  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim().slice(0, 120);
  const body = String(form.get("body") ?? "").trim().slice(0, 300);
  const href = String(form.get("href") ?? "").trim().slice(0, 1000);
  const imageUrl = String(form.get("imageUrl") ?? "").trim().slice(0, 2000) || null;
  const placement = String(form.get("placement") ?? "homepage");
  const productId = String(form.get("productId") ?? "").trim() || null;

  if (title.length < 2 || !href || !placements.has(placement)) {
    return NextResponse.json({ error: "Headline, destination and placement are required." }, { status: 400 });
  }

  if (productId) {
    const { data: product } = await supabase.from("seller_products").select("id").eq("id", productId).eq("seller_id", seller.id).maybeSingle();
    if (!product) return NextResponse.json({ error: "That product is not yours." }, { status: 400 });
  }

  const { error } = await supabase.from("marketplace_ads").insert({
    seller_id: seller.id,
    product_id: productId,
    title,
    body,
    href,
    image_url: imageUrl,
    placement,
    status: "pending",
  });

  if (error) return NextResponse.json({ error: "Unable to submit campaign." }, { status: 400 });
  return NextResponse.redirect(new URL("/seller/ads?created=1", request.url));
}

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" ? body.status : "";
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["paused","pending"].includes(status)) {
    return NextResponse.json({ error: "Invalid campaign update." }, { status: 400 });
  }

  const { data: seller } = await supabase.from("sellers").select("id").eq("user_id", userId).maybeSingle();
  if (!seller) return NextResponse.json({ error: "Seller account not found." }, { status: 403 });

  const { error } = await supabase.from("marketplace_ads").update({ status }).eq("id", id).eq("seller_id", seller.id);
  if (error) return NextResponse.json({ error: "Unable to update campaign." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
