import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SellerVerificationPage() {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) redirect("/auth/login?next=/seller/verification");

  const { data: seller } = await supabase.from("sellers").select("id, store_name, status, verification_status").eq("user_id", userId).maybeSingle();
  if (!seller) redirect("/seller/apply");

  const { data: verification } = await supabase.from("seller_verifications").select("id, legal_name, date_of_birth, country, phone, id_type, id_last4, verification_status, identity_provider, rejection_reason, submitted_at, reviewed_at").eq("seller_id", seller.id).maybeSingle();

  return <section className="section account-section"><div className="container auth-container">
    <div className="account-card">
      <span className="eyebrow">SELLER TRUST</span>
      <h1>Identity verification.</h1>
      <p>Verified seller profiles help UTECH build trust while keeping sensitive identity documents restricted to the verification workflow.</p>
      <div className="seller-stats">
        <div className="account-card"><span>Seller status</span><strong>{seller.status}</strong></div>
        <div className="account-card"><span>Identity status</span><strong>{verification?.verification_status ?? seller.verification_status}</strong></div>
      </div>
      {verification?.rejection_reason && <p className="auth-error">Review note: {verification.rejection_reason}</p>}
      <div className="account-card">
        <h2>Verification process</h2>
        <ol>
          <li>Confirm your legal identity and contact details.</li>
          <li>Submit the requested identity/business documents through UTECH's secure verification flow.</li>
          <li>UTECH reviews the submission or a future approved identity-verification provider performs the check.</li>
          <li>Only verified sellers can receive the UTECH verified-seller status and any features we later make verification-dependent.</li>
        </ol>
        <p className="seller-field-help">Do not send identity documents through ordinary chat, email, or product descriptions. The document upload flow will use private storage and restricted access.</p>
      </div>
      {!verification && <Link className="button button-primary" href="/seller/verification/submit">Start verification</Link>}
      {verification && verification.verification_status === "needs_more_info" && <Link className="button button-primary" href="/seller/verification/submit">Provide more information</Link>}
      {verification && verification.verification_status === "rejected" && <Link className="button button-primary" href="/seller/verification/submit">Resubmit verification</Link>}
      <Link className="button button-secondary" href="/seller/dashboard">Back to dashboard</Link>
    </div>
  </div></section>;
}
