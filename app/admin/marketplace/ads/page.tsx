import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ status?: string }> };

const statusOptions = ["all", "approved", "paused", "pending", "draft", "rejected", "expired"] as const;

export default async function MarketplaceAdsAdminPage({ searchParams }: Props) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email as string | undefined;

  if (!data?.claims?.sub) redirect("/auth/login?next=/admin/marketplace/ads");
  if (!isAdminEmail(email)) {
    return (
      <section className="section">
        <div className="container">
          <div className="account-card"><span className="eyebrow">UTECH ADMIN</span><h1>Access restricted.</h1><p>Advertising controls are reserved for UTECH marketplace administrators.</p></div>
        </div>
      </section>
    );
  }

  const { status = "all" } = await searchParams;
  const activeStatus = statusOptions.includes(status as typeof statusOptions[number]) ? status : "all";
  const admin = getSupabaseAdmin();

  const [{ data: ads }, { data: sellers }, { data: products }, { data: events }] = await Promise.all([
    admin.from("marketplace_ads").select("id,title,body,href,image_url,placement,status,seller_id,product_id,target_category,starts_at,ends_at,daily_impression_cap,total_impression_cap,created_at").order("created_at", { ascending: false }).limit(100),
    admin.from("sellers").select("id,store_name").order("store_name"),
    admin.from("seller_products").select("id,name,seller_id").eq("status","approved").order("name").limit(300),
    admin.from("marketplace_ad_events").select("ad_id,event_type").limit(5000),
  ]);

  const sellerMap = new Map((sellers ?? []).map((seller) => [seller.id, seller.store_name]));
  const productMap = new Map((products ?? []).map((product) => [product.id, product.name]));
  const stats = new Map<string, { impressions: number; clicks: number }>();

  for (const event of events ?? []) {
    const current = stats.get(event.ad_id) ?? { impressions: 0, clicks: 0 };
    if (event.event_type === "impression") current.impressions += 1;
    if (event.event_type === "click") current.clicks += 1;
    stats.set(event.ad_id, current);
  }

  const allAds = ads ?? [];
  const visibleAds = activeStatus === "all" ? allAds : allAds.filter((ad) => ad.status === activeStatus);
  const approved = allAds.filter((ad) => ad.status === "approved").length;
  const paused = allAds.filter((ad) => ad.status === "paused").length;
  const pending = allAds.filter((ad) => ad.status === "pending").length;
  const totalImpressions = allAds.reduce((sum, ad) => sum + (stats.get(ad.id)?.impressions ?? 0), 0);
  const totalClicks = allAds.reduce((sum, ad) => sum + (stats.get(ad.id)?.clicks ?? 0), 0);
  const ctr = totalImpressions ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0.0";

  return (
    <section className="section account-section advertising-center">
      <div className="container">
        <div className="advertising-topbar">
          <div>
            <span className="eyebrow">UTECH ADMIN · GROWTH</span>
            <h1 className="section-title">Advertising center.</h1>
            <p className="section-copy">Create, review and control sponsored marketplace placements from one clean workspace.</p>
          </div>
          <div className="advertising-top-actions">
            <a className="button button-secondary" href="/admin/marketplace">Marketplace center</a>
            <a className="button button-primary" href="#create-ad">Create campaign</a>
          </div>
        </div>

        <div className="ad-stat-grid">
          <div className="ad-stat-card"><span>Campaigns</span><strong>{allAds.length}</strong><small>All placements</small></div>
          <div className="ad-stat-card"><span>Live now</span><strong>{approved}</strong><small>{paused} paused</small></div>
          <div className="ad-stat-card"><span>Impressions</span><strong>{totalImpressions.toLocaleString()}</strong><small>Tracked events</small></div>
          <div className="ad-stat-card"><span>Clicks</span><strong>{totalClicks.toLocaleString()}</strong><small>{ctr}% CTR</small></div>
        </div>

        <div className="advertising-workspace">
          <aside className="ad-create-panel" id="create-ad">
            <div className="ad-panel-heading">
              <div><span className="eyebrow">CAMPAIGN BUILDER</span><h2>Create sponsored placement</h2></div>
              <span className="ad-live-dot">ADMIN</span>
            </div>
            <p className="seller-field-help">Admin-controlled advertising is live now. Seller self-service billing can be connected after marketplace payments are ready.</p>

            <form action="/api/admin/marketplace/ads" method="post" className="seller-form ad-form">
              <input type="hidden" name="action" value="create" />
              <div className="ad-form-section"><span>01 · Creative</span>
                <label>Headline<input name="title" required maxLength={120} placeholder="Weekend gaming deal" /></label>
                <label>Message<textarea name="body" maxLength={300} rows={3} placeholder="Short promotional message." /></label>
                <label>Image URL<input name="imageUrl" maxLength={2000} placeholder="https://..." /></label>
              </div>

              <div className="ad-form-section"><span>02 · Destination</span>
                <label>Destination URL<input name="href" required maxLength={1000} placeholder="/products/..." /></label>
                <div className="ad-two-col">
                  <label>Placement<select name="placement" defaultValue="homepage"><option value="homepage">Homepage</option><option value="shop">Shop</option><option value="product">Product pages</option></select></label>
                  <label>Target category<input name="targetCategory" maxLength={80} placeholder="Optional" /></label>
                </div>
                <div className="ad-two-col">
                  <label>Seller<select name="sellerId" defaultValue=""><option value="">UTECH / platform</option>{(sellers ?? []).map((seller) => <option key={seller.id} value={seller.id}>{seller.store_name}</option>)}</select></label>
                  <label>Product<select name="productId" defaultValue=""><option value="">No specific product</option>{(products ?? []).map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
                </div>
              </div>

              <div className="ad-form-section"><span>03 · Delivery controls</span>
                <div className="ad-two-col">
                  <label>Starts at<input type="datetime-local" name="startsAt" /></label>
                  <label>Ends at<input type="datetime-local" name="endsAt" /></label>
                </div>
                <div className="ad-two-col">
                  <label>Daily impression cap<input type="number" min="1" name="dailyImpressionCap" placeholder="Optional" /></label>
                  <label>Total impression cap<input type="number" min="1" name="totalImpressionCap" placeholder="Optional" /></label>
                </div>
              </div>

              <button className="button button-primary ad-publish-button" type="submit">Publish campaign <span>→</span></button>
            </form>
          </aside>

          <main className="ad-campaign-panel">
            <div className="ad-campaign-toolbar">
              <div><span className="eyebrow">CAMPAIGNS</span><h2>Advertising activity</h2><p>{visibleAds.length} campaigns shown</p></div>
              <div className="ad-filter-tabs">
                {statusOptions.map((option) => <a key={option} className={activeStatus === option ? "active" : ""} href={option === "all" ? "/admin/marketplace/ads" : "/admin/marketplace/ads?status=" + option}>{option === "all" ? "All" : option}</a>)}
              </div>
            </div>

            {visibleAds.length ? (
              <div className="ad-campaign-list">
                {visibleAds.map((ad) => {
                  const metric = stats.get(ad.id) ?? { impressions: 0, clicks: 0 };
                  const campaignCtr = metric.impressions ? ((metric.clicks / metric.impressions) * 100).toFixed(1) : "0.0";
                  const owner = ad.seller_id ? sellerMap.get(ad.seller_id) ?? "Seller" : "UTECH / platform";
                  const product = ad.product_id ? productMap.get(ad.product_id) : null;
                  return (
                    <article className="ad-campaign-card" key={ad.id}>
                      <div className="ad-campaign-preview">
                        {ad.image_url ? <img src={ad.image_url} alt="" /> : <div className="ad-preview-fallback"><span>UTECH</span><strong>{ad.placement}</strong></div>}
                        <span className={"ad-status " + ad.status}>{ad.status}</span>
                      </div>
                      <div className="ad-campaign-main">
                        <div className="ad-campaign-title-row">
                          <div><span className="ad-campaign-placement">{ad.placement} · {owner}</span><h3>{ad.title}</h3></div>
                          <div className="ad-campaign-actions">
                            {ad.status === "approved" ? (
                              <form action="/api/admin/marketplace/ads" method="post"><input type="hidden" name="action" value="status" /><input type="hidden" name="id" value={ad.id} /><input type="hidden" name="status" value="paused" /><button className="button button-secondary" type="submit">Pause</button></form>
                            ) : (
                              <form action="/api/admin/marketplace/ads" method="post"><input type="hidden" name="action" value="status" /><input type="hidden" name="id" value={ad.id} /><input type="hidden" name="status" value="approved" /><button className="button button-primary" type="submit">Activate</button></form>
                            )}
                          </div>
                        </div>
                        <p>{ad.body || "No campaign message."}</p>
                        <div className="ad-meta-row">
                          <span><b>{metric.impressions.toLocaleString()}</b> impressions</span>
                          <span><b>{metric.clicks.toLocaleString()}</b> clicks</span>
                          <span><b>{campaignCtr}%</b> CTR</span>
                          {product && <span>Product: <b>{product}</b></span>}
                          {ad.target_category && <span>Category: <b>{ad.target_category}</b></span>}
                        </div>
                        <div className="ad-campaign-foot">
                          <span>{ad.href}</span>
                          <span>{ad.starts_at ? new Date(ad.starts_at).toLocaleDateString() : "Now"} → {ad.ends_at ? new Date(ad.ends_at).toLocaleDateString() : "No end date"}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : <div className="ad-empty-state"><strong>No campaigns in this view.</strong><p>Create a campaign or switch the status filter above.</p><a className="button button-secondary" href="#create-ad">Create campaign</a></div>}
          </main>
        </div>
      </div>
    </section>
  );
}
