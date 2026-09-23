import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProductCard from "@/components/shop/ProductCard";
import FollowStoreButton from "@/components/store/FollowStoreButton";
import type { Product } from "@/data/products";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export default async function StorefrontPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: seller } = await supabase
    .from("sellers")
    .select("id, store_name, store_slug, description, logo_url, order_method, whatsapp_number, order_instructions")
    .eq("store_slug", slug)
    .eq("status", "approved")
    .maybeSingle();

  if (!seller) notFound();

  const { data: products } = await supabase
    .from("seller_products")
    .select("id, slug, name, description, category, price, compare_at_price, image_url, inventory")
    .eq("seller_id", seller.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  const productIds = (products ?? []).map((product) => product.id);
  const { data: variantRows } = productIds.length
    ? await supabase.from("seller_product_variants").select("id, product_id, label, attributes, price, compare_at_price, inventory, sku").in("product_id", productIds).eq("is_active", true).order("created_at", { ascending: true })
    : { data: [] };

  const variantsByProduct = new Map<string, Product["variants"]>();
  for (const variant of variantRows ?? []) {
    const list = variantsByProduct.get(variant.product_id) ?? [];
    list.push({
      id: variant.id,
      label: variant.label,
      attributes: (variant.attributes ?? {}) as Record<string, string>,
      price: Number(variant.price),
      compareAtPrice: variant.compare_at_price == null ? null : Number(variant.compare_at_price),
      inventory: Number(variant.inventory),
      sku: variant.sku,
    });
    variantsByProduct.set(variant.product_id, list);
  }

  const allowedCategories = ["games", "consoles", "laptops", "hardware", "fashion", "accessories", "other"] as const;
  const catalogProducts: Product[] = (products ?? []).map((product) => {
    const normalizedCategory = product.category.toLowerCase();
    const category = allowedCategories.includes(normalizedCategory as typeof allowedCategories[number])
      ? normalizedCategory as typeof allowedCategories[number]
      : "other";
    return {
      id: "seller-" + product.id,
      slug: product.slug,
      name: product.name,
      price: Number(product.price),
      category,
      type: product.category,
      image: product.image_url ?? "",
      description: product.description,
      sellerId: seller.id,
      sellerStoreSlug: seller.store_slug,
      sellerStoreName: seller.store_name,
      orderMethod: seller.order_method,
      whatsappNumber: seller.whatsapp_number,
      orderInstructions: seller.order_instructions,
      variants: variantsByProduct.get(product.id),
    };
  });

  return (
    <section className="section storefront-section">
      <div className="container">
        <div className="storefront-hero">
          <div className="storefront-brand">
            {seller.logo_url ? (
              <Image src={seller.logo_url} alt={seller.store_name} width={96} height={96} className="storefront-logo" />
            ) : (
              <div className="storefront-logo storefront-logo-fallback">{seller.store_name.slice(0, 1).toUpperCase()}</div>
            )}
          </div>
          <div className="storefront-copy">
            <span className="eyebrow">UTECH MARKETPLACE SELLER</span>
            <h1>{seller.store_name}</h1>
            <p>{seller.description || "Discover products from this UTECH marketplace seller."}</p>
            <div className="storefront-meta">
              <span>{products?.length ?? 0} published products</span>
              <span>Orders: {seller.order_method === "whatsapp" ? "WhatsApp" : seller.order_method === "hybrid" ? "UTECH + WhatsApp" : "UTECH Checkout"}</span>
              <Link href="/shop">Browse UTECH Store</Link><FollowStoreButton slug={seller.store_slug} name={seller.store_name} logoUrl={seller.logo_url} />
            </div>
          </div>
        </div>

        <div className="storefront-heading">
          <div><span className="eyebrow">STORE CATALOG</span><h2 className="section-title">Shop {seller.store_name}.</h2></div>
        </div>

        {catalogProducts.length > 0 ? (
          <div className="product-grid storefront-product-grid">
            {catalogProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="empty-results">
            <strong>This store has no published products yet.</strong>
            <p>Check back soon for new products from this seller.</p>
          </div>
        )}
      </div>
    </section>
  );
}
