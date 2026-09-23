import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function isAdminEmail(email?: string | null) {
  const allowed = (process.env.UTECH_ADMIN_EMAILS ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  return !!email && allowed.includes(email.toLowerCase());
}

export default async function MarketplaceAdsAdminPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email as string | undefined;
  if (!data?.claims?.sub) redirect("/auth/login?next=/admin/marketplace/ads");
  if (!isAdminEmail(email)) return <section className="section"><div className="container"><div className="account-card"><h1>Access restricted.</h1><p>Advertising controls are reserved for UTECH marketplace administrators.</p></div></div></section>;

  const admin = getSupabaseAdmin();
  const [{ data: ads }, { data: sellers }, { data: products }] = await Promise.all([
    admin.from("marketplace_ads").select("id,title,body,href,placement,status,seller_id,product_id,created_at,starts_at,ends_at").order("created_at", { ascending: false }).limit(100),
    admin.from("sellers").select("id,store_name").order("store_name"),
    admin.from("seller_products").select("id,name,seller_id").eq("status","approved").order("name").limit(300),
  ]);

  return (
    <section className="section account-section">
      <div className="container">
        <div className="account-header">
          <div>
            <span className="eyebrow">UTECH ADMIN</span>
            <h1 className="section-title">Advertising center.</h1>
            <p className="section-copy">Create and control sponsored placements. Ads are served only after approval and can be paused at any time.</p>
          </div>
          <a className="button button-secondary" href="/admin/marketplace">Back to marketplace</a>
        </div>

        <div className="admin-marketplace-grid">
          <div className="account-card">
            <h2>Create sponsored placement</h2>
            <p className="seller-field-help">This first version is admin-controlled. Seller self-service billing can be added after the marketplace payment system is live.</p>
            <form action="/api/admin/marketplace/ads" method="post" className="seller-form">
              <input type="hidden" name="action" value="create" />
              <label>Headline<input name="title" required maxLength={120} placeholder="Weekend gaming deal" /></label>
              <label>Message<textarea name="body" maxLength={300} rows={3} placeholder="Short promotional message." /></label>
              <label>Destination URL<input name="href" required maxLength={1000} placeholder="/products/..." /></label>
              <label>Image URL<input name="imageUrl" maxLength={2000} placeholder="https://..." /></label>
              <label>Placement<select name="placement" defaultValue="homepage"><option value="homepage">Homepage</option><option value="shop">Shop</option><option value="product">Product pages</option></select></label>
              <label>Target category<input name="targetCategory" maxLength={80} placeholder="optional: laptops" /></label>
              <label>Seller<select name="sellerId" defaultValue=""><option value="">UTECH / platform</option>{(sellers ?? []).map((seller) => <option key={seller.id} value={seller.id}>{seller.store_name}</option>)}</select></label>
              <label>Product<select name="productId" defaultValue=""><option value="">No specific product</option>{(products ?? []).map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
              <button className="button button-primary" type="submit">Publish ad</button>
            </form>
          </div>

          <div className="account-card">
            <div className="account-card-heading"><h2>Campaigns</h2><span>{ads?.length ?? 0}</span></div>
            {(ads ?? []).length ? (ads ?? []).map((ad) => (
              <div className="admin-review-row" key={ad.id}>
                <div>
                  <strong>{ad.title}</strong>
                  <span>{ad.placement} · {ad.status}</span>
                  <small>{ad.href}</small>
                </div>
                <div className="admin-review-actions">
                  {ad.status === "approved" ? (
                    <form action="/api/admin/marketplace/ads" method="post"><input type="hidden" name="action" value="status" /><input type="hidden" name="id" value={ad.id} /><input type="hidden" name="status" value="paused" /><button className="button button-secondary" type="submit">Pause</button></form>
                  ) : (
                    <form action="/api/admin/marketplace/ads" method="post"><input type="hidden" name="action" value="status" /><input type="hidden" name="id" value={ad.id} /><input type="hidden" name="status" value="approved" /><button className="button button-primary" type="submit">Activate</button></form>
                  )}
                </div>
              </div>
            )) : <p className="empty">No advertising campaigns yet.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
