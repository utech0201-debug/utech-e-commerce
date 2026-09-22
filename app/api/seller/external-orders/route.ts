import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid order payload." }, { status: 400 });

  const payload = body as Record<string, unknown>;
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!items.length || items.length > 50) return NextResponse.json({ error: "Add between 1 and 50 products." }, { status: 400 });

  const normalizedItems = items.map((item) => {
    const row = item as Record<string, unknown>;
    return { productId: String(row.productId ?? ""), quantity: Number(row.quantity ?? 0), unitPrice: Number(row.unitPrice ?? 0) };
  });

  if (normalizedItems.some((item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1 || !Number.isFinite(item.unitPrice) || item.unitPrice < 0)) {
    return NextResponse.json({ error: "Every item needs a valid product, quantity and price." }, { status: 400 });
  }

  const safePayload = {
    source: String(payload.source ?? "whatsapp"),
    paymentStatus: String(payload.paymentStatus ?? "pending"),
    customerName: String(payload.customerName ?? "").slice(0, 160),
    customerPhone: String(payload.customerPhone ?? "").slice(0, 80),
    customerEmail: String(payload.customerEmail ?? "").slice(0, 160),
    externalReference: String(payload.externalReference ?? "").slice(0, 160),
    sellerNote: String(payload.sellerNote ?? "").slice(0, 2000),
    items: normalizedItems,
  };

  const { data: orderId, error } = await supabase.rpc("create_seller_external_order", { p_payload: safePayload });
  if (error) {
    console.error("External seller order creation failed:", error);
    return NextResponse.json({ error: error.message || "Could not record the external sale." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, orderId });
}
