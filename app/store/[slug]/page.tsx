import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export default async function StorefrontPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: seller } = await supabase
    .from("sellers")
    .select("id, store_name, store_slug, description, logo_url")
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

  return (
    <section className="section storefront-section">
      <div className="container">
        <div className="storefront-hero">
          <div className="storefront-brand">
            {seller.logo_url ? (
              <Image
                src={seller.logo_url}
                alt={seller.store_name}
                width={96}
                height={96}
                className="storefront-logo"
              />
            ) : (
              <div className="storefront-logo storefront-logo-fallback">
                {seller.store_name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="storefront-copy">
            <span className="eyebrow">UTECH MARKETPLACE SELLER</span>
            <h1>{seller.store_name}</h1>
            <p>{seller.description || "Discover products from this UTECH marketplace seller."}</p>
            <div className="storefront-meta">
              <span>{products?.length ?? 0} published products</span>
              <Link href="/shop">Browse UTECH Store</Link>
            </div>
          </div>
        </div>

        <div className="storefront-heading">
          <div>
            <span className="eyebrow">STORE CATALOG</span>
            <h2 className="section-title">Shop {seller.store_name}.</h2>
          </div>
        </div>

        {products && products.length > 0 ? (
          <div className="product-grid storefront-product-grid">
            {products.map((product) => (
              <article className="product-card" key={product.id}>
                <Link className="product-image storefront-product-image" href={`/products/${product.slug}`}>
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      sizes="(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 33vw"
                      unoptimized
                    />
                  ) : (
                    <div className="storefront-product-placeholder">
                      <span>{product.category}</span>
                    </div>
                  )}
                </Link>
                <div className="product-body">
                  <span className="product-type">{product.category}</span>
                  <h3>
                    <Link href={`/products/${product.slug}`}>{product.name}</Link>
                  </h3>
                  <p>{product.description}</p>
                  <div className="product-footer">
                    <strong>${product.price.toFixed(2)}</strong>
                    <span className="storefront-stock">
                      {product.inventory > 0 ? `${product.inventory} in stock` : "Out of stock"}
                    </span>
                  </div>
                </div>
              </article>
            ))}
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
