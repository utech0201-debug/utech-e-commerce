import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const UUID = /^[0-9a-f-]{36}$/i;

function parseDate(value: string) {
  const normalized = value.trim();
  if (!normalized) return null;
  const date = new Date(normalized + ":00+00:00");
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  const email = claims?.claims?.email as string | undefined;
  const userId = claims?.claims?.sub as string | undefined;
  if (!isAdminEmail(email) || !userId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const form = await request.formData();
  const action = String(form.get("action") ?? "create");
  const admin = getSupabaseAdmin();

  if (action === "status") {
    const id = String(form.get("id") ?? "");
    const status = String(form.get("status") ?? "");
    if (!UUID.test(id) || !["approved","paused","rejected","expired"].includes(status)) return NextResponse.json({ error: "Invalid update." }, { status: 400 });
    const { error } = await admin.from("marketplace_flash_sales").update({ status, approved_by: status === "approved" ? userId : null }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.redirect(new URL("/admin/marketplace/flash-sales", request.url));
  }

  const title = String(form.get("title") ?? "").trim().slice(0,120);
  const description = String(form.get("description") ?? "").trim().slice(0,300);
  const placement = String(form.get("placement") ?? "homepage");
  const discount = Number(form.get("discountPercent") ?? 0);
  const startsAt = parseDate(String(form.get("startsAt") ?? ""));
  const endsAt = parseDate(String(form.get("endsAt") ?? ""));
  const productIds = form.getAll("productIds").map(String).filter((id) => UUID.test(id));

  if (title.length < 2 || !["homepage","store","both"].includes(placement) || discount < 5 || discount > 90 || !startsAt || !endsAt || new Date(endsAt) <= new Date(startsAt) || !productIds.length) {
    return NextResponse.json({ error: "Complete the campaign details, choose products, and use a 5–90% discount." }, { status: 400 });
  }

  const { data: products, error: productError } = await admin.from("seller_products")
    .select("id,price,seller_id,status").in("id", productIds).eq("status","approved");
  if (productError || !products?.length || products.length !== productIds.length) return NextResponse.json({ error: "One or more selected products are not approved." }, { status: 400 });

  const { data: existingItems } = await admin.from("marketplace_flash_sale_items")
    .select("product_id,marketplace_flash_sales!inner(status,starts_at,ends_at)").in("product_id", productIds);
  const conflict = (existingItems ?? []).some((row: any) => {
    const sale = row.marketplace_flash_sales;
    return ["pending","approved"].includes(sale.status) && new Date(sale.starts_at) < new Date(endsAt) && new Date(sale.ends_at) > new Date(startsAt);
  });
  if (conflict) return NextResponse.json({ error: "At least one product already has an overlapping flash sale." }, { status: 409 });

  const { data: campaign, error } = await admin.from("marketplace_flash_sales").insert({
    seller_id: null, created_by: userId, approved_by: userId, title, description, placement,
    status: "approved", starts_at: startsAt, ends_at: endsAt,
  }).select("id").single();
  if (error || !campaign) return NextResponse.json({ error: error?.message ?? "Could not create sale." }, { status: 400 });

  const items = products.map((product) => ({
    flash_sale_id: campaign.id, product_id: product.id, original_price: Number(product.price),
    sale_price: Number((Number(product.price) * (1 - discount / 100)).toFixed(2)),
  }));
  const { error: itemError } = await admin.from("marketplace_flash_sale_items").insert(items);
  if (itemError) {
    await admin.from("marketplace_flash_sales").delete().eq("id", campaign.id);
    return NextResponse.json({ error: itemError.message }, { status: 400 });
  }

  return NextResponse.redirect(new URL("/admin/marketplace/flash-sales?created=1", request.url));
}
