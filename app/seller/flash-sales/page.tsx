import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "./flash-sales.module.css";

export const dynamic = "force-dynamic";

export default async function SellerFlashSalesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) redirect("/auth/login?next=/seller/flash-sales");

  const { data: seller } = await supabase.from("sellers").select("id,store_name,status").eq("user_id", userId).maybeSingle();
  if (!seller) redirect("/seller/apply");

  const [{ data: products }, { data: campaigns }] = await Promise.all([
    supabase.from("seller_products").select("id,name,price,inventory,status").eq("seller_id", seller.id).eq("status","approved").order("name"),
    supabase.from("marketplace_flash_sales").select("id,title,description,status,placement,starts_at,ends_at").eq("seller_id", seller.id).order("created_at",{ascending:false}).limit(30),
  ]);

  return <section className="section account-section"><div className="container">
    <div className={styles.header}><div><span className="eyebrow">SELLER CENTER · PROMOTIONS</span><h1 className="section-title">Flash sales.</h1><p className="section-copy">Submit time-limited offers for your own approved products. UTECH reviews seller campaigns before they go live.</p></div><Link className="button button-secondary" href="/seller/dashboard">Back to dashboard</Link></div>
    <div className={styles.grid}>
      <form action="/api/seller/flash-sales" method="post" className={styles.card}>
        <div className={styles.kicker}>CREATE A CAMPAIGN</div>
        <label>Campaign title<input name="title" required maxLength={120} placeholder="Weekend Gaming Flash Sale" /></label>
        <label>Description<textarea name="description" rows={3} maxLength={300} placeholder="Short offer message." /></label>
        <div className={styles.two}><label>Starts (Ghana/UTC)<input type="datetime-local" name="startsAt" required /></label><label>Ends (Ghana/UTC)<input type="datetime-local" name="endsAt" required /></label></div>
        <div className={styles.two}><label>Discount %<input type="number" name="discountPercent" min="5" max="90" step="1" required placeholder="20" /></label><label>Placement<select name="placement" defaultValue="store"><option value="store">My store</option><option value="homepage">Homepage request</option><option value="both">Store + homepage request</option></select></label></div>
        <label>Approved products<select name="productIds" multiple required size={Math.min(8, Math.max(4, products?.length ?? 4))}>{(products ?? []).map((p) => <option key={p.id} value={p.id}>{p.name} · {Number(p.price).toFixed(2)} · {p.inventory} in stock</option>)}</select></label>
        <p className={styles.help}>Hold Ctrl/Cmd to select multiple products. The discount is calculated from each product's current base price and stored with the campaign.</p>
        <button className="button button-primary" type="submit">Submit flash sale →</button>
      </form>
      <div className={styles.card}><div className={styles.kicker}>YOUR CAMPAIGNS</div>{campaigns?.length ? <div className={styles.list}>{campaigns.map((c) => <article key={c.id} className={styles.row}><div><strong>{c.title}</strong><span>{c.status} · {c.placement}</span><span>{new Date(c.starts_at).toLocaleString()} → {new Date(c.ends_at).toLocaleString()}</span></div><b>{c.status === "approved" ? "LIVE/SCHEDULED" : c.status.toUpperCase()}</b></article>)}</div> : <div className={styles.empty}><strong>No flash sales yet.</strong><p>Create one from your approved products and send it for review.</p></div>}</div>
    </div>
  </div></section>;
}
