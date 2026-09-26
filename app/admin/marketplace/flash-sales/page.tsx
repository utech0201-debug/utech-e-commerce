import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import styles from "./flash-sales.module.css";

export const dynamic = "force-dynamic";

export default async function AdminFlashSalesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  const email = claims?.claims?.email as string | undefined;
  if (!claims?.claims?.sub) redirect("/auth/login?next=/admin/marketplace/flash-sales");
  if (!isAdminEmail(email)) return <section className="section"><div className="container"><div className="account-card"><span className="eyebrow">UTECH ADMIN</span><h1>Access restricted.</h1><p>Flash-sale controls are reserved for UTECH marketplace administrators.</p></div></div></section>;

  const admin = getSupabaseAdmin();
  const [{ data: products }, { data: campaigns }, { data: sellers }] = await Promise.all([
    admin.from("seller_products").select("id,name,price,seller_id").eq("status","approved").order("name").limit(500),
    admin.from("marketplace_flash_sales").select("id,title,description,status,placement,starts_at,ends_at,seller_id,created_at").order("created_at",{ascending:false}).limit(100),
    admin.from("sellers").select("id,store_name").order("store_name"),
  ]);
  const sellerMap = new Map((sellers ?? []).map((s) => [s.id,s.store_name]));

  return <section className="section account-section"><div className="container">
    <div className={styles.header}><div><span className="eyebrow">UTECH ADMIN · PROMOTIONS</span><h1 className="section-title">Flash-sale center.</h1><p className="section-copy">Create marketplace-wide campaigns, review seller submissions, and control what reaches the homepage.</p></div><Link className="button button-secondary" href="/admin/marketplace">Marketplace center</Link></div>
    <div className={styles.grid}>
      <form action="/api/admin/marketplace/flash-sales" method="post" className={styles.card}>
        <div className={styles.kicker}>ADMIN CAMPAIGN</div>
        <label>Campaign title<input name="title" required maxLength={120} placeholder="UTECH Weekend Flash Sale" /></label>
        <label>Description<textarea name="description" rows={3} maxLength={300} placeholder="Marketplace-wide offer." /></label>
        <div className={styles.two}><label>Starts (Ghana/UTC)<input type="datetime-local" name="startsAt" required /></label><label>Ends (Ghana/UTC)<input type="datetime-local" name="endsAt" required /></label></div>
        <div className={styles.two}><label>Discount %<input type="number" name="discountPercent" min="5" max="90" step="1" required placeholder="25" /></label><label>Placement<select name="placement" defaultValue="homepage"><option value="homepage">Homepage</option><option value="store">Store</option><option value="both">Homepage + store</option></select></label></div>
        <label>Products<select name="productIds" multiple required size={Math.min(10, Math.max(5, products?.length ?? 5))}>{(products ?? []).map((p) => <option key={p.id} value={p.id}>{p.name} · {Number(p.price).toFixed(2)} · {sellerMap.get(p.seller_id) ?? "Seller"}</option>)}</select></label>
        <p className={styles.help}>Admin campaigns are approved immediately. Products can only participate in one overlapping flash-sale window.</p>
        <button className="button button-primary" type="submit">Launch flash sale →</button>
      </form>
      <div className={styles.card}><div className={styles.kicker}>CAMPAIGN QUEUE</div>{campaigns?.length ? <div className={styles.list}>{campaigns.map((c) => <article key={c.id} className={styles.row}><div><strong>{c.title}</strong><span>{c.status} · {c.placement} · {c.seller_id ? sellerMap.get(c.seller_id) : "UTECH / platform"}</span><span>{new Date(c.starts_at).toLocaleString()} → {new Date(c.ends_at).toLocaleString()}</span></div><div className={styles.actions}>{c.status === "pending" && <form action="/api/admin/marketplace/flash-sales" method="post"><input type="hidden" name="action" value="status"/><input type="hidden" name="id" value={c.id}/><input type="hidden" name="status" value="approved"/><button type="submit">Approve</button></form>}{c.status === "approved" && <form action="/api/admin/marketplace/flash-sales" method="post"><input type="hidden" name="action" value="status"/><input type="hidden" name="id" value={c.id}/><input type="hidden" name="status" value="paused"/><button type="submit">Pause</button></form>}{c.status === "paused" && <form action="/api/admin/marketplace/flash-sales" method="post"><input type="hidden" name="action" value="status"/><input type="hidden" name="id" value={c.id}/><input type="hidden" name="status" value="approved"/><button type="submit">Resume</button></form>} {c.status === "pending" && <form action="/api/admin/marketplace/flash-sales" method="post"><input type="hidden" name="action" value="status"/><input type="hidden" name="id" value={c.id}/><input type="hidden" name="status" value="rejected"/><button type="submit">Reject</button></form>}</div></article>)}</div> : <div className={styles.empty}><strong>No campaigns yet.</strong><p>Seller submissions and admin-created flash sales will appear here.</p></div>}</div>
    </div>
  </div></section>;
}
