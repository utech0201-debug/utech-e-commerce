import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import ExternalOrderModeration from "@/components/admin/ExternalOrderModeration";

export const dynamic = "force-dynamic";

function isAdmin(email: string | undefined) {
  const allowlist = (process.env.UTECH_ADMIN_EMAILS ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  return !!email && allowlist.includes(email.toLowerCase());
}

export default async function AdminExternalOrdersPage() {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const email = claimsData?.claims?.email as string | undefined;
  if (!isAdmin(email)) redirect("/");

  const admin = getSupabaseAdmin();
  const { data: orders } = await admin.from("seller_external_orders").select("id, seller_id, source, customer_name, customer_phone, gross_amount, seller_amount, payment_status, verification_status, payout_status, external_reference, created_at").eq("verification_status", "pending").order("created_at", { ascending: false }).limit(100);

  const sellerIds = [...new Set((orders ?? []).map((order) => order.seller_id))];
  const { data: sellers } = sellerIds.length ? await admin.from("sellers").select("id, store_name").in("id", sellerIds) : { data: [] };
  const sellerMap = new Map((sellers ?? []).map((seller) => [seller.id, seller.store_name]));

  return <section className="section account-section"><div className="container">
    <div className="account-header"><div><span className="eyebrow">UTECH ADMIN</span><h1 className="section-title">External orders.</h1><p className="section-copy">Review seller-recorded WhatsApp and offline sales before they become payout eligible.</p></div><div className="seller-header-actions"><Link className="button button-secondary" href="/admin/marketplace">Marketplace</Link><Link className="button button-secondary" href="/admin/marketplace/payouts">Payouts</Link></div></div>
    <div className="account-card"><div className="account-card-heading"><h2>Pending verification</h2><span>{orders?.length ?? 0} records</span></div>{orders?.length ? <div className="order-list">{orders.map((order) => <ExternalOrderModeration key={order.id} order={{ id: order.id, sellerName: sellerMap.get(order.seller_id) ?? "Seller", source: order.source, customerName: order.customer_name, customerPhone: order.customer_phone, grossAmount: Number(order.gross_amount), sellerAmount: Number(order.seller_amount), paymentStatus: order.payment_status, reference: order.external_reference, createdAt: order.created_at }} />)}</div> : <p className="empty">No external sales are waiting for review.</p>}</div>
  </div></section>;
}
