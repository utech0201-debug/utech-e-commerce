import type { Product, ProductCategory, ProductVariant } from "@/data/products";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SellerProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string | null;
  inventory: number;
  seller_id: string;
};

type SellerVariantRow = { id: string; product_id: string; label: string; attributes: Record<string, string>; price: number; compare_at_price: number | null; inventory: number; sku: string | null; };\n\ntype SellerRow = {
  id: string;
  store_name: string;
  store_slug: string;
  order_method: "utech_checkout" | "whatsapp" | "hybrid";
  whatsapp_number: string | null;
  order_instructions: string | null;
};

const categories: ProductCategory[] = ["games", "consoles", "laptops", "hardware", "fashion", "accessories", "other"];

function normalizeCategory(category: string): ProductCategory {
  const value = category.trim().toLowerCase();
  return categories.includes(value as ProductCategory) ? (value as ProductCategory) : "other";
}

export async function getApprovedMarketplaceProducts(): Promise<Product[]> {
  const supabase = await createSupabaseServerClient();

  const { data: rows, error } = await supabase
    .from("seller_products")
    .select("id, slug, name, description, category, price, image_url, inventory, seller_id")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error || !rows?.length) return [];

  const sellerIds = [...new Set((rows as SellerProductRow[]).map((row) => row.seller_id))];
  const { data: sellers } = await supabase
    .from("sellers")
    .select("id, store_name, store_slug, order_method, whatsapp_number, order_instructions")
    .eq("status", "approved")
    .in("id", sellerIds);

  const sellerMap = new Map(((sellers ?? []) as SellerRow[]).map((seller) => [seller.id, seller]));\n\n  const { data: variantRows } = await supabase\n    .from("seller_product_variants")\n    .select("id, product_id, label, attributes, price, compare_at_price, inventory, sku")\n    .in("product_id", (rows as SellerProductRow[]).map((row) => row.id))\n    .eq("is_active", true)\n    .order("created_at", { ascending: true });\n\n  const variantMap = new Map<string, ProductVariant[]>();\n  for (const row of (variantRows ?? []) as SellerVariantRow[]) {\n    const list = variantMap.get(row.product_id) ?? [];\n    list.push({ id: row.id, label: row.label, attributes: row.attributes ?? {}, price: Number(row.price), compareAtPrice: row.compare_at_price == null ? null : Number(row.compare_at_price), inventory: Number(row.inventory), sku: row.sku });\n    variantMap.set(row.product_id, list);\n  }

  const products: Array<Product | null> = (rows as SellerProductRow[]).map((row) => {
    const seller = sellerMap.get(row.seller_id);
    if (!seller) return null;

    const product: Product = {
      id: "seller-" + row.id,
      slug: row.slug,
      name: row.name,
      price: Number(row.price),
      category: normalizeCategory(row.category),
      type: "Marketplace Product",
      image: row.image_url ?? "",
      description: row.description,
      sellerId: row.seller_id,
      sellerStoreSlug: seller.store_slug,
      sellerStoreName: seller.store_name,
      orderMethod: seller.order_method,
      whatsappNumber: seller.whatsapp_number,
      orderInstructions: seller.order_instructions,\n      variants: variantMap.get(row.id),
    };

    return product;
  });

  return products.filter((product): product is Product => product !== null);
}
