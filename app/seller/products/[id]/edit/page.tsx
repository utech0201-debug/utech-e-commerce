import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ProductForm from "@/components/seller/ProductForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditSellerProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;

  if (!userId) redirect(`/auth/login?next=/seller/products/${id}/edit`);

  const { data: seller } = await supabase
    .from("sellers")
    .select("id, store_name, status")
    .eq("user_id", userId)
    .maybeSingle();

  if (!seller) redirect("/seller/apply");

  const { data: product } = await supabase
    .from("seller_products")
    .select("id, name, description, category, price, compare_at_price, image_url, inventory, status")
    .eq("id", id)
    .eq("seller_id", seller.id)
    .maybeSingle();

  if (!product) notFound();

  if (product.status === "approved") {
    return (
      <section className="section account-section">
        <div className="container auth-container">
          <div className="account-card">
            <span className="eyebrow">PRODUCT MANAGEMENT</span>
            <h1>Product is live.</h1>
            <p>Approved listings are locked while the marketplace approval system is active. This prevents sellers from changing a live listing without review.</p>
            <Link className="button button-primary" href="/seller/dashboard">Back to Dashboard</Link>
          </div>
        </div>
      </section>
    );
  }

  const { data: variants } = await supabase.from("seller_product_variants").select("id, label, attributes, price, compare_at_price, inventory, sku").eq("product_id", product.id).order("created_at", { ascending: true });\n\n  const { count: imageCount } = await supabase
    .from("seller_product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", product.id);

  return (
    <section className="section account-section">
      <div className="container seller-product-page">
        <div className="account-header">
          <div>
            <span className="eyebrow">PRODUCT MANAGEMENT</span>
            <h1 className="section-title">Edit product.</h1>
            <p className="section-copy">Update the listing, save it as a draft, or submit it for UTECH review.</p>
          </div>
          <Link className="button button-secondary" href="/seller/dashboard">Back to Dashboard</Link>
        </div>
        <div className="account-card">
          <ProductForm
            sellerId={seller.id}
            initialImageCount={imageCount ?? 0}
            product={{
              id: product.id,
              name: product.name,
              description: product.description,
              category: product.category,
              price: String(product.price),
              compare_at_price: product.compare_at_price == null ? "" : String(product.compare_at_price),
              image_url: product.image_url ?? "",
              inventory: String(product.inventory),
              status: product.status,
            }}
          />
        </div>
      </div>
    </section>
  );
}
