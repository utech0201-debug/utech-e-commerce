import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedTransitions: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["ready", "cancelled"],
  ready: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;

  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await request.json();
  const itemId = String(body.itemId ?? "");
  const nextStatus = String(body.status ?? "");
  const sellerNote = body.sellerNote == null ? null : String(body.sellerNote).slice(0, 2000);
  const trackingNumber = body.trackingNumber == null ? null : String(body.trackingNumber).slice(0, 160);

  if (!itemId || !allowedTransitions[nextStatus] && !Object.prototype.hasOwnProperty.call(allowedTransitions, nextStatus)) {
    return NextResponse.json({ error: "Invalid order update." }, { status: 400 });
  }

  const { data: seller } = await supabase
    .from("sellers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!seller) return NextResponse.json({ error: "Seller account not found." }, { status: 404 });

  const { data: item } = await supabase
    .from("seller_order_items")
    .select("id, fulfillment_status")
    .eq("id", itemId)
    .eq("seller_id", seller.id)
    .maybeSingle();

  if (!item) return NextResponse.json({ error: "Order item not found." }, { status: 404 });

  if (item.fulfillment_status !== nextStatus && !allowedTransitions[item.fulfillment_status]?.includes(nextStatus)) {
    return NextResponse.json(
      { error: `Cannot move an order from ${item.fulfillment_status} to ${nextStatus}.` },
      { status: 409 },
    );
  }

  const { error } = await supabase
    .from("seller_order_items")
    .update({
      fulfillment_status: nextStatus,
      seller_note: sellerNote,
      tracking_number: trackingNumber,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("seller_id", seller.id);

  if (error) {
    console.error("Seller order update failed:", error);
    return NextResponse.json({ error: "Could not update the order." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: nextStatus });
}
