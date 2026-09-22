import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SellerVerificationSubmitPage() {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) redirect("/auth/login?next=/seller/verification/submit");
  const { data: seller } = await supabase.from("sellers").select("id, store_name, verification_status").eq("user_id", userId).maybeSingle();
  if (!seller) redirect("/seller/apply");

  return <section className="section account-section"><div className="container auth-container"><div className="account-card">
    <span className="eyebrow">VERIFICATION APPLICATION</span>
    <h1>Prepare your identity check.</h1>
    <p>This step is intentionally limited to non-document information for now. The secure document upload/provider integration should be connected before UTECH asks sellers to upload government IDs or selfies.</p>
    <div className="account-card"><h2>Coming in the secure verification flow</h2><ul><li>Legal name and country</li><li>Identity document type</li><li>Private identity-document upload</li><li>Optional business registration and address proof</li><li>Verification-provider reference and result</li><li>Admin review history</li></ul></div>
    <p className="seller-field-help">UTECH will not store raw identity documents in ordinary public product storage. When document collection is enabled, access will be restricted to the verification workflow.</p>
    <form action="/api/seller/verification/submit" method="post">
      <label className="seller-field"><span>Legal name</span><input name="legal_name" required maxLength={160} /></label>
      <label className="seller-field"><span>Country</span><input name="country" required maxLength={80} placeholder="Ghana" /></label>
      <label className="seller-field"><span>Phone</span><input name="phone" maxLength={80} /></label>
      <label className="seller-field"><span>Identity document type</span><select name="id_type" required><option value="">Select</option><option value="national_id">National ID</option><option value="passport">Passport</option><option value="drivers_license">Driver's licence</option><option value="other">Other</option></select></label>
      <button className="button button-primary" type="submit">Submit verification details</button>
    </form>
  </div></div></section>;
}
