import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ExternalOrderForm from "@/components/seller/ExternalOrderForm";

export const dynamic = "force-dynamic";

export default async function SellerExternalOrdersPage() {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) redirect("/auth/login?next=/seller/external-orders");

  const { data: seller } = await supabase.from("sellers").select("id, store_name, status").eq("user_id", userId).maybeSingle();
  if (!seller) redirect("/seller/apply");
  if (seller.status !== "approved") redirect("/seller/dashboard");

  const [{ data: products }, { data: externalOrders }] = await Promise.all([
    supabase.from("seller_products").select("id, name, price, inventory").eq("seller_id", seller.id).eq("status", "approved").order("name"),
    supabase.from("seller_external_orders").select("id, source, customer_name, gross_amount, seller_amount, payment_status, verification_status, payout_status, created_at").eq("seller_id", seller.id).order("created_at", { ascending: false }).limit(50),
  ]);

  return (
    <section className="section account-section"><div className="container">
      <div className="account-header"><div><span className="eyebrow">SELLER CENTER</span><h1 className="section-title">External sales.</h1><p className="section-copy">Record WhatsApp, phone and offline sales so your marketplace ledger stays complete.</p></div>
        <div className="seller-header-actions"><Link className="button button-secondary" href="/seller/dashboard">Dashboard</Link><Link className="button button-secondary" href="/seller/orders">Orders</Link><Link className="button button-secondary" href="/seller/earnings">Earnings</Link></div>
      </div>

      <div className="account-card"><div className="account-card-heading"><h2>Record a sale</h2><span>Inventory + commission tracked</span></div>
        {products?.length ? <ExternalOrderForm products={products.map((product) => ({ id: product.id, name: product.name, price: Number(product.price), inventory: product.inventory }))} /> : <div className="empty"><strong>No approved products available.</strong><p>Approve at least one product before recording an external sale.</p></div>}
      </div>

      <div className="account-card"><div className="account-card-heading"><h2>Recorded external sales</h2><span>{externalOrders?.length ?? 0} recent records</span></div>
        {externalOrders?.length ? <div className="order-list">{externalOrders.map((order) => <div className="order-row" key={order.id}><div><strong>{order.customer_name || "Customer"} · ${Number(order.gross_amount).toFixed(2)}</strong><span>{order.source} · seller earnings ${Number(order.seller_amount).toFixed(2)}</span><span>{new Date(order.created_at).toLocaleString()}</span></div><div className="seller-order-badges"><span className="seller-payout-status">{order.payment_status}</span><span className="seller-payout-status">{order.verification_status}</span><span className="seller-payout-status">{order.payout_status}</span></div></div>)}</div> : <p className="empty">No external sales have been recorded yet.</p>}
      </div>
    </div></section>
  );
}
