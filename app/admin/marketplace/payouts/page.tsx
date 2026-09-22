import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function money(value: number | string | null | undefined, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(value ?? 0));
}

export default async function AdminPayoutsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const email = claimsData?.claims?.email as string | undefined;
  const allowed = (process.env.UTECH_ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (!email || !allowed.includes(email.toLowerCase())) {
    redirect("/admin/marketplace");
  }

  const adminClient = getSupabaseAdmin();
  const [{ data: earnings }, { data: payouts }, { data: sellers }] = await Promise.all([
    adminClient
      .from("seller_order_items")
      .select("id, seller_id, gross_amount, platform_fee, seller_amount, payout_status, created_at")
      .in("payout_status", ["pending", "eligible"])
      .order("created_at", { ascending: false })
      .limit(100),
    adminClient
      .from("seller_payouts")
      .select("id, seller_id, amount, currency, status, provider, provider_reference, paid_at, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    adminClient.from("sellers").select("id, store_name, store_slug, status").order("store_name"),
  ]);

  const sellerMap = new Map((sellers ?? []).map((seller) => [seller.id, seller]));
  const eligibleRows = earnings ?? [];
  const eligibleTotal = eligibleRows.reduce((sum, row) => sum + Number(row.seller_amount ?? 0), 0);
  const pendingTotal = eligibleRows
    .filter((row) => row.payout_status === "pending")
    .reduce((sum, row) => sum + Number(row.seller_amount ?? 0), 0);
  const eligibleOnlyTotal = eligibleRows
    .filter((row) => row.payout_status === "eligible")
    .reduce((sum, row) => sum + Number(row.seller_amount ?? 0), 0);

  return (
    <section className="section account-section">
      <div className="container">
        <div className="account-header">
          <div>
            <span className="eyebrow">UTECH ADMIN</span>
            <h1 className="section-title">Payouts.</h1>
            <p className="section-copy">Review seller earnings before UTECH records a payout.</p>
          </div>
          <div className="seller-header-actions">
            <a className="button button-secondary" href="/admin/marketplace">Marketplace Admin</a>
          </div>
        </div>

        <div className="seller-stats seller-earnings-stats">
          <div className="account-card"><span>Open earnings</span><strong>{money(eligibleTotal)}</strong></div>
          <div className="account-card"><span>Pending</span><strong>{money(pendingTotal)}</strong></div>
          <div className="account-card"><span>Eligible</span><strong>{money(eligibleOnlyTotal)}</strong></div>
        </div>

        <div className="account-card">
          <div className="account-card-heading">
            <h2>Seller earnings awaiting payout</h2>
            <span>{eligibleRows.length} records</span>
          </div>
          {eligibleRows.length ? (
            <div className="order-list">
              {eligibleRows.map((row) => {
                const seller = sellerMap.get(row.seller_id);
                return (
                  <div className="order-row" key={row.id}>
                    <div>
                      <strong>{seller?.store_name ?? "Unknown seller"}</strong>
                      <span>{money(row.seller_amount)} seller amount · {money(row.gross_amount)} gross · {money(row.platform_fee)} UTECH fee</span>
                      <span>{new Date(row.created_at).toLocaleString()}</span>
                    </div>
                    <span className={`seller-payout-status seller-payout-status-${row.payout_status}`}>{row.payout_status}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="empty">No seller earnings are currently awaiting payout.</p>
          )}
        </div>

        <div className="account-card seller-earnings-note">
          <div className="account-card-heading">
            <h2>Payout ledger</h2>
            <span>{(payouts ?? []).length} recent payouts</span>
          </div>
          {(payouts ?? []).length ? (
            <div className="order-list">
              {(payouts ?? []).map((payout) => {
                const seller = sellerMap.get(payout.seller_id);
                return (
                  <div className="order-row" key={payout.id}>
                    <div>
                      <strong>{seller?.store_name ?? "Unknown seller"} · {money(payout.amount, payout.currency)}</strong>
                      <span>{payout.status} · {payout.provider ?? "UTECH"}</span>
                      <span>{new Date(payout.created_at).toLocaleString()}</span>
                    </div>
                    {payout.provider_reference ? <span>{payout.provider_reference}</span> : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="empty">No payouts recorded yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
