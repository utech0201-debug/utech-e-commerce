import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const BUCKET = "seller-verification-documents";
const SIGNED_URL_TTL = 600;

type Verification = {
  id: string;
  seller_id: string;
  legal_name: string | null;
  date_of_birth: string | null;
  country: string | null;
  phone: string | null;
  id_type: string | null;
  id_last4: string | null;
  verification_status: string;
  rejection_reason: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  sellers: { store_name: string; store_slug: string; status: string } | null;
};

type DocumentRow = {
  id: string;
  document_type: string;
  storage_path: string;
  status: string;
  created_at: string;
};


function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value: string | null) {
  if (!value) return "Not provided";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function VerificationAdminPage() {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  const email = claimsData?.claims?.email as string | undefined;

  if (!userId) redirect("/auth/login?next=/admin/marketplace/verification");

  if (!isAdminEmail(email)) {
    return (
      <section className="section account-section">
        <div className="container auth-container">
          <div className="account-card">
            <span className="eyebrow">UTECH ADMIN</span>
            <h1>Access restricted.</h1>
            <p>This area is reserved for authorized UTECH marketplace administrators.</p>
            <a className="button button-secondary" href="/admin/marketplace">Back to Marketplace Admin</a>
          </div>
        </div>
      </section>
    );
  }

  const admin = getSupabaseAdmin();
  const { data: verifications, error } = await admin
    .from("seller_verifications")
    .select("id, seller_id, legal_name, date_of_birth, country, phone, id_type, id_last4, verification_status, rejection_reason, submitted_at, reviewed_at, sellers(store_name, store_slug, status)")
    .in("verification_status", ["submitted", "under_review", "needs_more_info", "rejected"])
    .order("submitted_at", { ascending: false });

  if (error) {
    return (
      <section className="section account-section"><div className="container"><div className="account-card">
        <span className="eyebrow">VERIFICATION CENTER</span><h1>Could not load verification cases.</h1><p>{error.message}</p>
      </div></div></section>
    );
  }

  const cases = (verifications ?? []) as unknown as Verification[];
  const enriched = await Promise.all(cases.map(async (verification) => {
    const { data: documents } = await admin
      .from("seller_verification_documents")
      .select("id, document_type, storage_path, status, created_at")
      .eq("verification_id", verification.id)
      .order("created_at", { ascending: true });

    const signedDocuments = await Promise.all(((documents ?? []) as DocumentRow[]).map(async (document) => {
      const { data } = await admin.storage.from(BUCKET).createSignedUrl(document.storage_path, SIGNED_URL_TTL);
      return {
        id: document.id,
        documentType: document.document_type,
        status: document.status,
        createdAt: document.created_at,
        signedUrl: data?.signedUrl ?? null,
      };
    }));

    return { verification, documents: signedDocuments };
  }));

  const count = (status: string) => enriched.filter(({ verification }) => verification.verification_status === status).length;

  return (
    <section className="section account-section">
      <div className="container">
        <div className="account-header">
          <div className="seller-header-actions">
            <a className="button button-secondary" href="/admin/marketplace">Marketplace</a>
            <a className="button button-secondary" href="/admin/marketplace/payouts">Payout Center</a>
          </div>
          <div>
            <span className="eyebrow">UTECH ADMIN · VERIFICATION</span>
            <h1 className="section-title">Seller Verification Center.</h1>
            <p className="section-copy">Review private identity documents and verification details. Identity verification is separate from seller account approval.</p>
          </div>
        </div>

        <div className="seller-stats">
          <div className="account-card"><span>Cases</span><strong>{enriched.length}</strong></div>
          <div className="account-card"><span>Submitted</span><strong>{count("submitted")}</strong></div>
          <div className="account-card"><span>Under review</span><strong>{count("under_review")}</strong></div>
          <div className="account-card"><span>Needs more info</span><strong>{count("needs_more_info")}</strong></div>
        </div>

        <div className="admin-marketplace-grid">
          {enriched.length ? enriched.map(({ verification, documents }) => (
            <article className="account-card" key={verification.id}>
              <div className="account-card-heading">
                <div>
                  <h2>{verification.sellers?.store_name ?? "Unknown seller"}</h2>
                  <span>/{verification.sellers?.store_slug ?? "unknown"} · account: {verification.sellers?.status ?? "unknown"}</span>
                </div>
                <span>{label(verification.verification_status)}</span>
              </div>

              <div className="admin-review-row">
                <div>
                  <strong>Identity details</strong>
                  <span>Legal name: {verification.legal_name || "Not provided"}</span>
                  <span>Date of birth: {verification.date_of_birth || "Not provided"}</span>
                  <span>Country: {verification.country || "Not provided"}</span>
                  <span>Phone: {verification.phone || "Not provided"}</span>
                  <span>ID: {verification.id_type ? label(verification.id_type) : "Not provided"}{verification.id_last4 ? " · ending " + verification.id_last4 : ""}</span>
                  <small>Submitted: {formatDate(verification.submitted_at)} · Last reviewed: {formatDate(verification.reviewed_at)}</small>
                </div>
              </div>

              {verification.rejection_reason ? (
                <div className="account-card" style={{ marginTop: "1rem" }}>
                  <strong>Previous review note</strong><p>{verification.rejection_reason}</p>
                </div>
              ) : null}

              <div style={{ marginTop: "1rem" }}>
                <div className="account-card-heading"><h3>Private documents</h3><span>{documents.length} uploaded</span></div>
                {documents.length ? documents.map((document) => (
                  <div className="admin-review-row" key={document.id}>
                    <div><strong>{label(document.documentType)}</strong><span>{label(document.status)} · uploaded {formatDate(document.createdAt)}</span></div>
                    {document.signedUrl ? (
                      <a className="button button-secondary" href={document.signedUrl} target="_blank" rel="noreferrer">View document</a>
                    ) : <span>Unavailable</span>}
                  </div>
                )) : <p className="empty">No documents uploaded yet.</p>}
              </div>

              <form action="/api/admin/marketplace/verification" method="post" style={{ marginTop: "1.25rem" }}>
                <input type="hidden" name="verificationId" value={verification.id} />
                <label style={{ display: "block", marginBottom: ".75rem" }}>
                  <span style={{ display: "block", marginBottom: ".4rem" }}>Admin note</span>
                  <textarea name="note" rows={3} placeholder="Optional review note or reason for rejection / more information." style={{ width: "100%", resize: "vertical" }} />
                </label>
                <div className="admin-review-actions">
                  <button className="button button-secondary" type="submit" name="decision" value="under_review">Mark under review</button>
                  <button className="button button-primary" type="submit" name="decision" value="verified">Verify identity</button>
                  <button className="button button-secondary" type="submit" name="decision" value="needs_more_info">Needs more info</button>
                  <button className="button button-secondary" type="submit" name="decision" value="rejected">Reject verification</button>
                </div>
              </form>
            </article>
          )) : (
            <div className="account-card"><h2>No active verification cases.</h2><p className="empty">New seller verification submissions will appear here for review.</p></div>
          )}
        </div>
      </div>
    </section>
  );
}
