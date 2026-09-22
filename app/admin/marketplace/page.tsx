import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function isAdminEmail(email?: string | null) {
  const allowed = (process.env.UTECH_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return !!email && allowed.includes(email.toLowerCase());
}

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
  const [{ data: sellers }, { data: products }] = await Promise.all([
    admin.from("sellers").select("id, store_name, store_slug, description, status, commission_rate, created_at").order("created_at", { ascending: false }),
    admin.from("seller_products").select("id, seller_id, name, category, price, inventory, status, rejection_reason, created_at, sellers(store_name)").order("created_at", { ascending: false }),
  ]);

  const pendingSellers = sellers?.filter((seller) => seller.status === "pending") ?? [];
  const pendingProducts = products?.filter((product) => product.status === "pending") ?? [];

  return (
    <section className="section account-section">
      <div className="container">
        <div className="account-header">
          <div className="seller-header-actions">
            <a className="button button-secondary" href="/admin/marketplace/payouts">Payout Center</a>
            <a className="button button-secondary" href="/admin/marketplace/external-orders">External Orders</a>
          </div>
          <div>
            <span className="eyebrow">UTECH ADMIN</span>
            <h1 className="section-title">Marketplace control center.</h1>
            <p className="section-copy">Review sellers and product listings before they become visible in the marketplace.</p>
          </div>
        </div>

        <div className="seller-stats">
          <div className="account-card"><span>Pending sellers</span><strong>{pendingSellers.length}</strong></div>
          <div className="account-card"><span>Pending products</span><strong>{pendingProducts.length}</strong></div>
          <div className="account-card"><span>Total sellers</span><strong>{sellers?.length ?? 0}</strong></div>
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
                  <span>/{seller.store_slug}</span>
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
      </div>
    </section>
  );
}
