import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SellerAdActions from "@/components/seller/SellerAdActions";

export const dynamic = "force-dynamic";

export default async function SellerAdsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  if (!userId) redirect("/auth/login?next=/seller/ads");

  const { data: seller } = await supabase.from("sellers").select("id,store_name,status").eq("user_id", userId).maybeSingle();
  if (!seller) redirect("/seller/dashboard");

  const [{ data: products }, { data: ads }] = await Promise.all([
    supabase.from("seller_products").select("id,name").eq("seller_id", seller.id).eq("status","approved").order("name"),
    supabase.from("marketplace_ads").select("id,title,body,href,image_url,placement,status,product_id,created_at").eq("seller_id", seller.id).order("created_at",{ascending:false}).limit(50),
  ]);

  const active = (ads ?? []).filter((ad) => ad.status === "approved").length;
  const pending = (ads ?? []).filter((ad) => ad.status === "pending").length;

  return (
    <section className="section account-section">
      <div className="container">
        <div className="account-header">
          <div>
            <span className="eyebrow">SELLER CENTER</span>
            <h1 className="section-title">Advertising.</h1>
            <p className="section-copy">Promote your approved products. Campaigns are reviewed by UTECH before they go live.</p>
          </div>
          <div className="seller-header-actions">
            <Link className="button button-secondary" href="/seller/dashboard">Dashboard</Link>
          </div>
        </div>

        <div className="seller-stats">
          <div className="account-card"><span>Campaigns</span><strong>{ads?.length ?? 0}</strong></div>
          <div className="account-card"><span>Live</span><strong>{active}</strong></div>
          <div className="account-card"><span>Awaiting review</span><strong>{pending}</strong></div>
        </div>

        {seller.status !== "approved" ? (
          <div className="account-card"><h2>Advertising is locked</h2><p>Your seller account must be approved before you can submit campaigns.</p></div>
        ) : (
          <div className="account-grid">
            <div className="account-card">
              <h2>Create campaign</h2>
              <p className="seller-field-help">Advertising billing is not enabled yet. UTECH will review your campaign before publication.</p>
              <form action="/api/seller/ads" method="post" className="seller-form">
                <label>Headline<input name="title" required maxLength={120} placeholder="New gaming arrivals" /></label>
                <label>Message<textarea name="body" maxLength={300} rows={3} placeholder="Tell shoppers why they should look." /></label>
                <label>Destination<input name="href" required maxLength={1000} placeholder="/products/your-product" /></label>
                <label>Image URL<input name="imageUrl" maxLength={2000} placeholder="https://..." /></label>
                <label>Placement<select name="placement" defaultValue="homepage"><option value="homepage">Homepage</option><option value="shop">Shop</option><option value="product">Product pages</option></select></label>
                <label>Product<select name="productId" defaultValue=""><option value="">Store campaign</option>{(products ?? []).map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
                <button className="button button-primary" type="submit">Submit for review</button>
              </form>
            </div>

            <div className="account-card">
              <h2>Your campaigns</h2>
              {(ads ?? []).length ? (ads ?? []).map((ad) => (
                <div className="admin-review-row" key={ad.id}>
                  <div><strong>{ad.title}</strong><span>{ad.placement} · {ad.status}</span><small>{ad.href}</small></div>
                  {ad.status === "approved" ? (
                    <button className="button button-secondary" type="button" onClick={undefined}>Live</button>
                  ) : null}
                </div>
              )) : <div className="empty"><strong>No campaigns yet.</strong><p>Create your first promotion and send it for review.</p></div>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
