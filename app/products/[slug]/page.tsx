import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, products } from "@/data/products";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AddToCart from "@/components/shop/AddToCart";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let product = getProduct(slug);\n  let gallery: string[] = product?.image ? [product.image] : [];

  if (!product) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("seller_products")
      .select("id, slug, name, description, category, price, image_url, inventory, seller_id")
      .eq("slug", slug)
      .eq("status", "approved")
      .maybeSingle();

    if (!data) notFound();

    const { data: seller } = await supabase
      .from("sellers")
      .select("store_name, store_slug")
      .eq("id", data.seller_id)
      .eq("status", "approved")
      .maybeSingle();

    if (!seller) notFound();

    const category =
      ["games", "consoles", "laptops", "hardware"].includes(data.category.toLowerCase())
        ? (data.category.toLowerCase() as "games" | "consoles" | "laptops" | "hardware")
        : "hardware";

    const { data: imageRows } = await supabase\n      .from("seller_product_images")\n      .select("image_url, sort_order")\n      .eq("product_id", data.id)\n      .order("sort_order", { ascending: true });\n\n    gallery = (imageRows ?? []).map((image) => image.image_url);\n    if (!gallery.length && data.image_url) gallery = [data.image_url];\n\n    product = {
      id: "seller-" + data.id,
      slug: data.slug,
      name: data.name,
      price: Number(data.price),
      category,
      type: "Marketplace Product",
      image: data.image_url ?? "",
      description: data.description,
      sellerId: data.seller_id,
      sellerStoreSlug: seller.store_slug,
      sellerStoreName: seller.store_name,
    };
  }

  return (
    <section className="detail">
      <div className="container detail-grid">
        <div className="detail-image">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width:850px) 100vw, 50vw"
              style={{ objectFit: "contain", padding: 28 }}
              unoptimized={Boolean(product.sellerId)}
            />
          ) : (
            <div className="storefront-product-placeholder">
              <span>{product.category}</span>
            </div>
          )}
        </div>

        <div className="detail-copy">
          <span className="eyebrow">{product.type}</span>
          <h1>{product.name}</h1>
          <div className="price">
            {"$" + product.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p>{product.description}</p>

          {product.sellerStoreSlug && (
            <p className="marketplace-product-seller">
              Sold by{" "}
              <Link href={"/store/" + product.sellerStoreSlug}>
                {product.sellerStoreName}
              </Link>
            </p>
          )}

          <AddToCart product={product} />

          <div style={{ marginTop: 18 }}>
            <Link href="/shop" className="button button-secondary">
              Back to Shop
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
