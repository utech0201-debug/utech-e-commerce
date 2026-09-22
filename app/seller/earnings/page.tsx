import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function money(value: number | string | null | undefined, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export default async function SellerEarningsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;

  if (!userId) redirect("/auth/login?next=/seller/earnings");

  const { data: seller } = await supabase
    .from("sellers")
    .select("id, store_name, store_slug, status, commission_rate")
    .eq("user_id", userId)
    .maybeSingle();

  if (!seller) redirect("/seller/apply");

  const [{ data: earnings }, { data: externalEarnings }, { data: payouts }] = await Promise.all([
    supabase
      .from("seller_order_items")
      .select("id, gross_amount, commission_rate, platform_fee, seller_amount, payout_status, created_at")
      .eq("seller_id", seller.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("seller_external_orders")
      .select("id, gross_amount, commission_rate, platform_fee, seller_amount, payout_status, created_at, source, verification_status")
      .eq("seller_id", seller.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("seller_payouts")
      .select("id, amount, currency, status, provider, provider_reference, paid_at, created_at")
      .eq("seller_id", seller.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const rows = earnings ?? [];
  const externalRows = externalEarnings ?? [];
  const allSellerEarnings = [
    ...rows.map((row) => ({ ...row, source: "UTECH Checkout" })),
    ...externalRows.map((row) => ({ ...row, source: "External sale" })),
  ];
  const payoutRows = payouts ?? [];

  const gross = allSellerEarnings.reduce((sum, row) => sum + Number(row.gross_amount ?? 0), 0);
  const platformFees = allSellerEarnings.reduce((sum, row) => sum + Number(row.platform_fee ?? 0), 0);
  const sellerEarnings = allSellerEarnings.reduce((sum, row) => sum + Number(row.seller_amount ?? 0), 0);
  const pending = allSellerEarnings
    .filter((row) => row.payout_status === "pending")
    .reduce((sum, row) => sum + Number(row.seller_amount ?? 0), 0);
  const eligible = allSellerEarnings
    .filter((row) => row.payout_status === "eligible")
    .reduce((sum, row) => sum + Number(row.seller_amount ?? 0), 0);
  const paidOut = payoutRows
    .filter((row) => row.status === "paid")
    .reduce((sum, row) => sum + Number(row.amount ?? 0), 0);

  return (
    <section className="section account-section">
      <div className="container">
        <div className="account-header">
          <div>
            <span className="eyebrow">SELLER CENTER</span>
            <h1 className="section-title">Earnings.</h1>
            <p className="section-copy">
              Track marketplace sales, UTECH commission and payout activity for {seller.store_name}.
            </p>
          </div>
          <div className="seller-header-actions">
            <Link className="button button-secondary" href="/seller/dashboard">Dashboard</Link>
            {seller.status === "approved" && (
              <Link className="button button-primary" href={`/store/${seller.store_slug ?? ""}`}>Storefront</Link>
            )}
          </div>
        </div>

        <div className="seller-stats seller-earnings-stats">
          <div className="account-card"><span>Gross sales</span><strong>{money(gross)}</strong></div>
          <div className="account-card"><span>Platform fees</span><strong>{money(platformFees)}</strong></div>
          <div className="account-card"><span>Seller earnings</span><strong>{money(sellerEarnings)}</strong></div>
          <div className="account-card"><span>Pending</span><strong>{money(pending)}</strong></div>
          <div className="account-card"><span>Eligible</span><strong>{money(eligible)}</strong></div>
          <div className="account-card"><span>Paid out</span><strong>{money(paidOut)}</strong></div>
        </div>

        <div className="account-grid seller-earnings-grid">
          <div className="account-card">
            <div className="account-card-heading">
              <h2>Sales ledger</h2>
              <span>{allSellerEarnings.length} recent records</span>
            </div>
            {allSellerEarnings.length ? (
              <div className="order-list">
                {allSellerEarnings.map((row) => (
                  <div className="order-row" key={row.id}>
                    <div>
                      <strong>{money(row.seller_amount)}</strong>
                      <span>
                        {row.source} · Gross {money(row.gross_amount)} · {Number(row.commission_rate).toFixed(2)}% commission
                      </span>
                      <span>{new Date(row.created_at).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className={`seller-payout-status seller-payout-status-${row.payout_status}`}>
                        {row.payout_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty">No marketplace sales have been recorded yet.</p>
            )}
          </div>

          <div className="account-card">
            <div className="account-card-heading">
              <h2>Payout history</h2>
              <span>{payoutRows.length} records</span>
            </div>
            <p className="seller-field-help">
              Payouts are recorded by UTECH. Payment-provider integration can be connected when the marketplace payout flow is enabled.
            </p>
            {payoutRows.length ? (
              <div className="order-list">
                {payoutRows.map((payout) => (
                  <div className="order-row" key={payout.id}>
                    <div>
                      <strong>{money(payout.amount, payout.currency)}</strong>
                      <span>{payout.provider ?? "UTECH payout"} · {payout.status}</span>
                      <span>{new Date(payout.created_at).toLocaleString()}</span>
                    </div>
                    <div>
                      {payout.provider_reference ? <span>{payout.provider_reference}</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty">No payouts have been recorded yet.</p>
            )}
          </div>
        </div>

        <div className="account-card seller-earnings-note">
          <h2>Commission model</h2>
          <p>
            Your current UTECH platform commission rate is <strong>{Number(seller.commission_rate).toFixed(2)}%</strong>.
            Commission is recorded for both UTECH Checkout and verified external sales. External sales remain pending until UTECH verification before becoming payout eligible.
          </p>
        </div>
      </div>
    </section>
  );
}
