import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SellerDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) redirect("/auth/login?next=/seller/dashboard");

  const { data: seller } = await supabase
    .from("sellers")
     .select("id, store_name, store_slug, description, status, commission_rate, order_method, whatsapp_number, verification_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (!seller) return (
    <section className="section account-section">
      <div className="container auth-container">
        <div className="account-card">
          <span className="eyebrow">SELLER CENTER</span>
          <h1>Start selling on UTECH.</h1>
          <p>You do not have a seller application yet. Apply to open your marketplace store.</p>
          <Link className="button button-primary" href="/seller/apply">Become a Seller</Link>
        </div>
      </div>
    </section>
  );

  const { data: products } = await supabase
    .from("seller_products")
    .select("id, name, price, inventory, status, created_at")
    .eq("seller_id", seller.id)
    .order("created_at", { ascending: false });

  const productIds = (products ?? []).map((product) => product.id);
  const { data: imageRows } = productIds.length
    ? await supabase
        .from("seller_product_images")
        .select("product_id")
        .in("product_id", productIds)
    : { data: [] };

  const imageCounts = new Map<string, number>();
  for (const row of imageRows ?? []) {
    imageCounts.set(row.product_id, (imageCounts.get(row.product_id) ?? 0) + 1);
  }

  const productCount = products?.length ?? 0;
  const approvedCount = products?.filter((product) => product.status === "approved").length ?? 0;

  const { data: sellerOrders } = await supabase
    .from("seller_order_items")
    .select("id, seller_amount, fulfillment_status, payout_status, created_at")
    .eq("seller_id", seller.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const orderRows = sellerOrders ?? [];
  const activeOrders = orderRows.filter((row) =>
    ["pending", "confirmed", "processing", "ready", "shipped"].includes(row.fulfillment_status),
  ).length;
  const deliveredOrders = orderRows.filter((row) => row.fulfillment_status === "delivered").length;
  const pendingPayout = orderRows
    .filter((row) => row.payout_status === "pending")
    .reduce((sum, row) => sum + Number(row.seller_amount ?? 0), 0);
  const recentOrderCount = orderRows.length;

  return (
    <section className="section account-section">
      <div className="container">
        <div className="account-header">
          <div>
            <span className="eyebrow">SELLER CENTER</span>
            <h1 className="section-title">{seller.store_name}</h1>
            <p className="section-copy">Manage your brand, products and UTECH marketplace store.</p>
          </div>
          <div className="seller-header-actions">
            {seller.status === "approved" && (
              <Link className="button button-primary" href="/seller/products/new">Add Product</Link>
            )}
            <span className={`seller-status seller-status-${seller.status}`}>{seller.status}</span>
            <span className="seller-payout-status">Identity: {seller.verification_status}</span>
          </div>
        </div>

        <div className="seller-stats">
          <div className="account-card"><span>Products</span><strong>{productCount}</strong></div>
          <div className="account-card"><span>Published</span><strong>{approvedCount}</strong></div>
          <div className="account-card"><span>Active orders</span><strong>{activeOrders}</strong></div>
          <div className="account-card"><span>Delivered</span><strong>{deliveredOrders}</strong></div>
          <div className="account-card"><span>Pending payout</span><strong>{pendingPayout.toFixed(2)}</strong></div>
          <div className="account-card"><span>Commission</span><strong>{seller.commission_rate}%</strong></div>
        </div>

        <div className="account-grid seller-dashboard-grid">
          <div className="account-card">
            <h2>Store details</h2>
            <p>{seller.description || "No store description yet."}</p>
            <p>Store URL: /store/{seller.store_slug}</p>
            {seller.status !== "approved" && (
              <p className="auth-success">Your seller account must be approved before products can be submitted.</p>
            )}
            <div className="seller-store-links">
              {seller.status === "approved" && (
                <Link className="button button-secondary" href={`/store/${seller.store_slug}`}>View Storefront</Link>
              )}
              <Link className="button button-secondary" href="/seller/apply">Edit application</Link>
              <Link className="button button-secondary" href="/seller/verification">Identity verification</Link>
              <Link className="button button-secondary" href="/seller/orders">Orders</Link>
              <Link className="button button-secondary" href="/seller/external-orders">Record External Sale</Link>
              <Link className="button button-secondary" href="/seller/earnings">View Earnings</Link>
              <Link className="button button-secondary" href="/seller/settings">Order Settings</Link>
              <Link className="button button-secondary" href="/seller/ads">Advertising</Link>
              <Link className="button button-secondary" href="/seller/flash-sales">Flash Sales</Link>
            </div>
          </div>

          <div className="account-card">
            <h2>Seller safety</h2>
            <p>Your seller account is isolated to your own store and products. UTECH controls approval status and commission settings.</p>
            <p>Products are private until UTECH review approves them. Marketplace safety rules are enforced in both the application and database layers.</p>
            <p className="seller-field-help">Keep your account credentials private. UTECH will never ask you to share your password or secret authentication codes.</p>
          </div>

          <div className="account-card seller-dashboard-orders">
            <div className="account-card-heading">
              <h2>Order activity</h2>
              <span>{recentOrderCount} recent records</span>
            </div>
            {orderRows.length ? (
              <div className="order-list">
                {orderRows.slice(0, 5).map((order) => (
                  <div className="order-row" key={order.id}>
                    <div>
                      <strong>{Number(order.seller_amount ?? 0).toFixed(2)}</strong>
                      <span>{order.fulfillment_status} · payout {order.payout_status}</span>
                      <span>{new Date(order.created_at).toLocaleString()}</span>
                    </div>
                    <Link href="/seller/orders">Manage</Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">
                <strong>No marketplace orders yet.</strong>
                <p>Orders for your store will appear here after checkout.</p>
              </div>
            )}
            <Link className="button button-secondary" href="/seller/orders">Open order management</Link>
          </div>

          <div className="account-card">
            <div className="account-card-heading">
              <h2>Your products</h2>
              <span>{productCount} total</span>
            </div>

            {products && products.length > 0 ? (
              <div className="order-list">
                {products.slice(0, 8).map((product) => (
                  <div className="order-row seller-product-row" key={product.id}>
                    <div>
                      <strong>{product.name}</strong>
                      <span>{product.status} · {product.inventory} in stock · {imageCounts.get(product.id) ?? 0}/10 images</span>
                    </div>
                    <div className="seller-product-actions">
                      <strong>{product.price}</strong>
                      {product.status !== "approved" && (
                        <Link href={`/seller/products/${product.id}/edit`}>Edit</Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">
                <strong>No products yet.</strong>
                <p>Start with a draft, then submit it for UTECH approval.</p>
                {seller.status === "approved" && (
                  <Link className="button button-primary" href="/seller/products/new">Add your first product</Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
