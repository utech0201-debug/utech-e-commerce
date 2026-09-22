import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SellerOrderActions from "@/components/seller/SellerOrderActions";

export const dynamic = "force-dynamic";

function money(value: number | string | null | undefined) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value ?? 0));
}

export default async function SellerOrdersPage() {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) redirect("/auth/login?next=/seller/orders");

  const { data: seller } = await supabase.from("sellers").select("id, store_name").eq("user_id", userId).maybeSingle();
  if (!seller) redirect("/seller/apply");

  const { data: sellerItems } = await supabase
    .from("seller_order_items")
    .select("id, order_item_id, gross_amount, seller_amount, payout_status, fulfillment_status, seller_note, tracking_number, created_at")
    .eq("seller_id", seller.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const orderItemIds = (sellerItems ?? []).map((item) => item.order_item_id);
  const { data: orderItems } = orderItemIds.length
    ? await supabase.from("order_items").select("id, order_id, product_name, product_slug, unit_price, quantity").in("id", orderItemIds)
    : { data: [] };

  const orderIds = [...new Set((orderItems ?? []).map((item) => item.order_id))];
  const { data: orders } = orderIds.length
    ? await supabase.from("orders").select("id, status, payment_status, shipping_full_name, shipping_phone, shipping_address, shipping_city, shipping_country, created_at").in("id", orderIds)
    : { data: [] };

  const itemMap = new Map((orderItems ?? []).map((item) => [item.id, item]));
  const orderMap = new Map((orders ?? []).map((order) => [order.id, order]));

  return (
    <section className="section account-section">
      <div className="container">
        <div className="account-header">
          <div>
            <span className="eyebrow">SELLER CENTER</span>
            <h1 className="section-title">Orders.</h1>
            <p className="section-copy">Manage customer orders, fulfillment and delivery information for {seller.store_name}.</p>
          </div>
          <div className="seller-header-actions">
            <Link className="button button-secondary" href="/seller/dashboard">Dashboard</Link>
            <Link className="button button-secondary" href="/seller/earnings">Earnings</Link>
          </div>
        </div>

        <div className="account-card">
          <div className="account-card-heading">
            <h2>Marketplace orders</h2>
            <span>{sellerItems?.length ?? 0} records</span>
          </div>

          {sellerItems?.length ? (
            <div className="seller-orders-list">
              {sellerItems.map((sellerItem) => {
                const orderItem = itemMap.get(sellerItem.order_item_id);
                const order = orderItem ? orderMap.get(orderItem.order_id) : undefined;
                if (!orderItem || !order) return null;

                return (
                  <article className="seller-order-card" key={sellerItem.id}>
                    <div className="seller-order-card-header">
                      <div>
                        <strong>{orderItem.product_name}</strong>
                        <span>Order #{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleString()}</span>
                      </div>
                      <div className="seller-order-badges">
                        <span className={`seller-payout-status seller-payout-status-${sellerItem.fulfillment_status}`}>{sellerItem.fulfillment_status}</span>
                        <span className={`seller-payout-status seller-payout-status-${sellerItem.payout_status}`}>{sellerItem.payout_status}</span>
                      </div>
                    </div>

                    <div className="seller-order-meta">
                      <span>Qty: {orderItem.quantity}</span>
                      <span>Gross: {money(sellerItem.gross_amount)}</span>
                      <span>Your earnings: {money(sellerItem.seller_amount)}</span>
                      <span>Payment: {order.payment_status}</span>
                    </div>

                    <div className="seller-order-customer">
                      <strong>Customer</strong>
                      <span>{order.shipping_full_name} · {order.shipping_phone || "No phone"}</span>
                      <span>{order.shipping_address}, {order.shipping_city}, {order.shipping_country}</span>
                    </div>

                    <SellerOrderActions
                      itemId={sellerItem.id}
                      currentStatus={sellerItem.fulfillment_status}
                      sellerNote={sellerItem.seller_note}
                      trackingNumber={sellerItem.tracking_number}
                    />
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty">
              <strong>No seller orders yet.</strong>
              <p>Orders placed through UTECH Checkout will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
