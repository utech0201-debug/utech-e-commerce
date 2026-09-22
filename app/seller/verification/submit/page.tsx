import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import VerificationDocumentUpload from "@/components/seller/VerificationDocumentUpload";

export const dynamic = "force-dynamic";

export default async function SellerVerificationSubmitPage() {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) redirect("/auth/login?next=/seller/verification/submit");

  const { data: seller } = await supabase
    .from("sellers")
    .select("id, store_name, verification_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (!seller) redirect("/seller/apply");

  return (
    <section className="section account-section">
      <div className="container auth-container">
        <div className="account-card">
          <span className="eyebrow">VERIFICATION APPLICATION</span>
          <h1>Complete your identity check.</h1>
          <p>
            Submit your legal details first, then upload the requested documents
            through the private verification storage flow.
          </p>

          <div className="account-card">
            <h2>Step 1 — Identity details</h2>
            <form action="/api/seller/verification/submit" method="post">
              <label className="seller-field">
                <span>Legal name</span>
                <input name="legal_name" required maxLength={160} />
              </label>
              <label className="seller-field">
                <span>Country</span>
                <input name="country" required maxLength={80} placeholder="Ghana" />
              </label>
              <label className="seller-field">
                <span>Phone</span>
                <input name="phone" maxLength={80} />
              </label>
              <label className="seller-field">
                <span>Identity document type</span>
                <select name="id_type" required>
                  <option value="">Select</option>
                  <option value="national_id">National ID</option>
                  <option value="passport">Passport</option>
                  <option value="drivers_license">Driver's licence</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <button className="button button-primary" type="submit">
                Save verification details
              </button>
            </form>
          </div>

          {["submitted", "needs_more_info", "rejected"].includes(seller.verification_status) && (
            <VerificationDocumentUpload />
          )}

          <p className="seller-field-help">
            Identity documents are kept out of public product storage and are
            not exposed through public URLs. UTECH can later connect an approved
            verification provider without changing the seller-facing workflow.
          </p>

          <Link className="button button-secondary" href="/seller/verification">
            Back to verification
          </Link>
        </div>
      </div>
    </section>
  );
}
