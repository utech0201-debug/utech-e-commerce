import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, products } from "@/data/products";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProductExperience from "@/components/shop/ProductExperience";
import { getActiveFlashSaleForProduct } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let product = getProduct(slug);
  let gallery: string[] = product?.image ? [product.image] : [];

  if (!product) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from("seller_products").select("id, slug, name, description, category, price, image_url, inventory, seller_id").eq("slug", slug).eq("status", "approved").maybeSingle();
    if (!data) notFound();

    const { data: seller } = await supabase.from("sellers").select("store_name, store_slug, order_method, whatsapp_number, order_instructions").eq("id", data.seller_id).eq("status", "approved").maybeSingle();
    if (!seller) notFound();

    const marketplaceCategories = ["games", "consoles", "laptops", "hardware", "fashion", "accessories", "other"] as const;
    const normalizedCategory = data.category.toLowerCase();
    const category = marketplaceCategories.includes(normalizedCategory as (typeof marketplaceCategories)[number])
      ? normalizedCategory as (typeof marketplaceCategories)[number]
      : "other";

    const { data: variantRows } = await supabase.from("seller_product_variants").select("id, label, attributes, price, compare_at_price, inventory, sku").eq("product_id", data.id).eq("is_active", true).order("created_at", { ascending: true });
    const variants = (variantRows ?? []).map((variant) => ({ id: variant.id, label: variant.label, attributes: (variant.attributes ?? {}) as Record<string, string>, price: Number(variant.price), compareAtPrice: variant.compare_at_price == null ? null : Number(variant.compare_at_price), inventory: Number(variant.inventory), sku: variant.sku }));

    const { data: imageRows } = await supabase.from("seller_product_images").select("image_url, sort_order").eq("product_id", data.id).order("sort_order", { ascending: true });
    gallery = (imageRows ?? []).map((image) => image.image_url);
    if (!gallery.length && data.image_url) gallery = [data.image_url];

    product = {
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
      orderMethod: seller.order_method,
      whatsappNumber: seller.whatsapp_number,
      orderInstructions: seller.order_instructions,
      variants,
    };
  }

  if (product.sellerId && !(product.variants?.length)) {
    const sale = await getActiveFlashSaleForProduct(product.id.replace(/^seller-/, ""));
    if (sale) product = { ...product, flashSalePrice: sale.salePrice, flashSaleEndsAt: sale.endsAt };
  }

  return <ProductExperience product={product} gallery={gallery} />;
}
