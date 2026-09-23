import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";


export default async function MarketplaceAdminPage() {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  const email = claimsData?.claims?.email as string | undefined;

  if (!userId) redirect("/auth/login?next=/admin/marketplace");
  if (!isAdminEmail(email)) {
    return (
      <section className="section account-section">
        <div className="container auth-container">
          <div className="account-card">
            <span className="eyebrow">UTECH ADMIN</span>
            <h1>Access restricted.</h1>
            <p>This area is reserved for authorized UTECH marketplace administrators.</p>
            <a className="button button-secondary" href="/">Back to Store</a>
          </div>
        </div>
      </section>
    );
  }

  const admin = getSupabaseAdmin();
  const [{ data: sellers }, { data: products }, { data: verificationCases }, { data: payoutRows }] = await Promise.all([
    admin.from("sellers").select("id, store_name, store_slug, description, status, commission_rate, verification_status, created_at").order("created_at", { ascending: false }),
    admin.from("seller_products").select("id, seller_id, name, category, price, inventory, status, rejection_reason, created_at, sellers(store_name)").order("created_at", { ascending: false }),
    admin.from("seller_verifications").select("id, verification_status").in("verification_status", ["submitted", "under_review", "needs_more_info"]),
    admin.from("seller_order_items").select("id, seller_id, seller_amount, payout_status").in("payout_status", ["pending", "eligible"]).limit(500),
  ]);

  const sellerRows = sellers ?? [];
  const productRows = products ?? [];
  const pendingSellers = sellerRows.filter((seller) => seller.status === "pending");
  const activeSellers = sellerRows.filter((seller) => seller.status === "approved");
  const suspendedSellers = sellerRows.filter((seller) => seller.status === "suspended");
  const pendingProducts = productRows.filter((product) => product.status === "pending");
  const openEarnings = (payoutRows ?? []).reduce((sum, row) => sum + Number(row.seller_amount ?? 0), 0);

  return (
    <section className="section account-section">
      <div className="container">
        <div className="account-header">
          <div className="seller-header-actions">
            <a className="button button-secondary" href="/admin/marketplace/payouts">Payout Center</a>
            <a className="button button-secondary" href="/admin/marketplace/external-orders">External Orders</a>
            <a className="button button-secondary" href="/admin/marketplace/verification">Verification</a>
            <a className="button button-secondary" href="/admin/marketplace/messages">Contact Inbox</a>
            <a className="button button-secondary" href="/admin/marketplace/ads">Advertising</a>
          </div>
          <div>
            <span className="eyebrow">UTECH ADMIN</span>
            <h1 className="section-title">Marketplace control center.</h1>
            <p className="section-copy">Review sellers and product listings before they become visible in the marketplace, and control seller access when risk changes.</p>
          </div>
        </div>

        <div className="seller-stats">
          <div className="account-card"><span>Pending sellers</span><strong>{pendingSellers.length}</strong></div>
          <div className="account-card"><span>Pending products</span><strong>{pendingProducts.length}</strong></div>
          <div className="account-card"><span>Active sellers</span><strong>{activeSellers.length}</strong></div>
          <div className="account-card"><span>Suspended sellers</span><strong>{suspendedSellers.length}</strong></div>
          <div className="account-card"><span>Verification queue</span><strong>{verificationCases?.length ?? 0}</strong></div>
          <div className="account-card"><span>Open seller earnings</span><strong>${openEarnings.toFixed(2)}</strong></div>
        </div>

        <div className="admin-marketplace-grid">
          <div className="account-card">
            <div className="account-card-heading">
              <h2>Seller applications</h2>
              <span>{pendingSellers.length} pending</span>
            </div>
            {pendingSellers.length ? pendingSellers.map((seller) => (
              <div className="admin-review-row" key={seller.id}>
                <div>
                  <strong>{seller.store_name}</strong>
                  <span>/{seller.store_slug} · identity: {seller.verification_status} · commission: {seller.commission_rate}%</span>
                  <small>{seller.description || "No description provided."}</small>
                </div>
                <div className="admin-review-actions">
                  <form action="/api/admin/marketplace/seller" method="post">
                    <input type="hidden" name="sellerId" value={seller.id} />
                    <input type="hidden" name="decision" value="approved" />
                    <button className="button button-primary" type="submit">Approve</button>
                  </form>
                  <form action="/api/admin/marketplace/seller" method="post">
                    <input type="hidden" name="sellerId" value={seller.id} />
                    <input type="hidden" name="decision" value="rejected" />
                    <button className="button button-secondary" type="submit">Reject</button>
                  </form>
                </div>
              </div>
            )) : <p className="empty">No seller applications waiting for review.</p>}
          </div>

          <div className="account-card">
            <div className="account-card-heading">
              <h2>Product reviews</h2>
              <span>{pendingProducts.length} pending</span>
            </div>
            {pendingProducts.length ? pendingProducts.map((product) => (
              <div className="admin-review-row" key={product.id}>
                <div>
                  <strong>{product.name}</strong>
                  <span>{String((product.sellers as { store_name?: string } | null)?.store_name ?? "Seller")} · {product.category}</span>
                  <small>{product.price} · {product.inventory} in stock</small>
                </div>
                <div className="admin-review-actions">
                  <form action="/api/admin/marketplace/product" method="post">
                    <input type="hidden" name="productId" value={product.id} />
                    <input type="hidden" name="decision" value="approved" />
                    <button className="button button-primary" type="submit">Approve</button>
                  </form>
                  <form action="/api/admin/marketplace/product" method="post">
                    <input type="hidden" name="productId" value={product.id} />
                    <input type="hidden" name="decision" value="rejected" />
                    <button className="button button-secondary" type="submit">Reject</button>
                  </form>
                </div>
              </div>
            )) : <p className="empty">No product listings waiting for review.</p>}
          </div>
        </div>

        <div className="account-card">
          <div className="account-card-heading">
            <h2>Seller access controls</h2>
            <span>{activeSellers.length + suspendedSellers.length} managed sellers</span>
          </div>
          {[...activeSellers, ...suspendedSellers].slice(0, 20).map((seller) => (
            <div className="admin-review-row" key={seller.id}>
              <div>
                <strong>{seller.store_name}</strong>
                <span>/{seller.store_slug} · {seller.status} · identity: {seller.verification_status}</span>
              </div>
              <div className="admin-review-actions">
                {seller.status === "approved" ? (
                  <form action="/api/admin/marketplace/seller" method="post">
                    <input type="hidden" name="sellerId" value={seller.id} />
                    <input type="hidden" name="decision" value="suspended" />
                    <button className="button button-secondary" type="submit">Suspend seller</button>
                  </form>
                ) : (
                  <form action="/api/admin/marketplace/seller" method="post">
                    <input type="hidden" name="sellerId" value={seller.id} />
                    <input type="hidden" name="decision" value="approved" />
                    <button className="button button-primary" type="submit">Restore seller</button>
                  </form>
                )}
              </div>
            </div>
          ))}
          {activeSellers.length + suspendedSellers.length > 20 && <p className="seller-field-help">Showing the first 20 managed sellers.</p>}
        </div>
      </div>
    </section>
  );
}
