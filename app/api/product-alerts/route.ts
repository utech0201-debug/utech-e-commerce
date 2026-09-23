import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AlertType = "price_drop" | "back_in_stock";

function isAlertType(value: unknown): value is AlertType {
  return value === "price_drop" || value === "back_in_stock";
}

async function getUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET(request: Request) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const productId = new URL(request.url).searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "Product ID is required." }, { status: 400 });

  const { data, error } = await supabase
    .from("product_alerts")
    .select("alert_type,active")
    .eq("user_id", user.id)
    .eq("product_id", productId);

  if (error) return NextResponse.json({ error: "Could not load alerts." }, { status: 500 });

  return NextResponse.json({
    alerts: {
      price_drop: Boolean(data?.some((row) => row.alert_type === "price_drop" && row.active)),
      back_in_stock: Boolean(data?.some((row) => row.alert_type === "back_in_stock" && row.active)),
    },
  });
}

export async function POST(request: Request) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const productId = typeof body?.productId === "string" ? body.productId : "";
  const alertType = body?.alertType;
  if (!productId || !isAlertType(alertType)) {
    return NextResponse.json({ error: "Product ID and alert type are required." }, { status: 400 });
  }

  const { data: product, error: productError } = await supabase
    .from("seller_products")
    .select("id,slug,name,price,inventory,status")
    .eq("id", productId)
    .eq("status", "approved")
    .maybeSingle();

  if (productError || !product) return NextResponse.json({ error: "Product is not available." }, { status: 404 });

  if (alertType === "back_in_stock" && Number(product.inventory) > 0) {
    return NextResponse.json({ error: "This product is already in stock." }, { status: 409 });
  }

  const { error } = await supabase.from("product_alerts").upsert({
    user_id: user.id,
    product_id: product.id,
    alert_type: alertType,
    baseline_price: alertType === "price_drop" ? Number(product.price) : null,
    target_price: null,
    active: true,
    triggered_at: null,
  }, { onConflict: "user_id,product_id,alert_type" });

  if (error) return NextResponse.json({ error: "Could not save alert." }, { status: 500 });

  return GET(new Request(new URL("/api/product-alerts?productId=" + productId, request.url)));
}

export async function DELETE(request: Request) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const productId = typeof body?.productId === "string" ? body.productId : "";
  const alertType = body?.alertType;
  if (!productId || !isAlertType(alertType)) {
    return NextResponse.json({ error: "Product ID and alert type are required." }, { status: 400 });
  }

  const { error } = await supabase
    .from("product_alerts")
    .update({ active: false })
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .eq("alert_type", alertType);

  if (error) return NextResponse.json({ error: "Could not disable alert." }, { status: 500 });

  return GET(new Request(new URL("/api/product-alerts?productId=" + productId, request.url)));
}
