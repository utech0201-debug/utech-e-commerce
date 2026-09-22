import Link from "next/link";
import { redirect } from "next/navigation";
import ProductForm from "@/components/seller/ProductForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewSellerProductPage() {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;

  if (!userId) redirect("/auth/login?next=/seller/products/new");

  const { data: seller } = await supabase
    .from("sellers")
    .select("id, store_name, status")
    .eq("user_id", userId)
    .maybeSingle();

  if (!seller) redirect("/seller/apply");
  if (seller.status !== "approved") redirect("/seller/dashboard");

  return (
    <section className="section account-section">
      <div className="container seller-product-page">
        <div className="account-header">
          <div>
            <span className="eyebrow">PRODUCT MANAGEMENT</span>
            <h1 className="section-title">Add a product.</h1>
            <p className="section-copy">Create a listing for {seller.store_name}. Products stay private until UTECH approves them.</p>
          </div>
          <Link className="button button-secondary" href="/seller/dashboard">Back to Dashboard</Link>
        </div>
        <div className="account-card">
          <ProductForm sellerId={seller.id} />
        </div>
      </div>
    </section>
  );
}
