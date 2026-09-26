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

type SellerVariantRow = { id: string; product_id: string; label: string; attributes: Record<string, string>; price: number; compare_at_price: number | null; inventory: number; sku: string | null; };

type SellerRow = {
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

  const sellerMap = new Map(((sellers ?? []) as SellerRow[]).map((seller) => [seller.id, seller]));

  const { data: variantRows } = await supabase
    .from("seller_product_variants")
    .select("id, product_id, label, attributes, price, compare_at_price, inventory, sku")
    .in("product_id", (rows as SellerProductRow[]).map((row) => row.id))
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  const variantMap = new Map<string, ProductVariant[]>();
  for (const row of (variantRows ?? []) as SellerVariantRow[]) {
    const list = variantMap.get(row.product_id) ?? [];
    list.push({ id: row.id, label: row.label, attributes: row.attributes ?? {}, price: Number(row.price), compareAtPrice: row.compare_at_price == null ? null : Number(row.compare_at_price), inventory: Number(row.inventory), sku: row.sku });
    variantMap.set(row.product_id, list);
  }

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
      inventory: Number(row.inventory),
      description: row.description,
      sellerId: row.seller_id,
      sellerStoreSlug: seller.store_slug,
      sellerStoreName: seller.store_name,
      orderMethod: seller.order_method,
      whatsappNumber: seller.whatsapp_number,
      orderInstructions: seller.order_instructions,
      variants: variantMap.get(row.id),
    };

    return product;
  });

  return products.filter((product): product is Product => product !== null);
}

export type MarketplaceFlashSaleItem = {
  id: string;
  title: string;
  description: string;
  endsAt: string;
  product: Product;
  originalPrice: number;
  salePrice: number;
};

export async function getActiveFlashSaleItems(products: Product[]): Promise<MarketplaceFlashSaleItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data: campaigns } = await supabase
    .from("marketplace_flash_sales")
    .select("id,title,description,ends_at")
    .eq("status", "approved")
    .lte("starts_at", new Date().toISOString())
    .gt("ends_at", new Date().toISOString())
    .in("placement", ["homepage", "both"])
    .order("ends_at", { ascending: true })
    .limit(4);

  if (!campaigns?.length) return [];

  const campaignIds = campaigns.map((campaign) => campaign.id);
  const { data: items } = await supabase
    .from("marketplace_flash_sale_items")
    .select("id,flash_sale_id,product_id,original_price,sale_price")
    .in("flash_sale_id", campaignIds)
    .order("created_at", { ascending: true });

  const productMap = new Map(products.map((product) => [product.id.replace(/^seller-/, ""), product]));
  const campaignMap = new Map(campaigns.map((campaign) => [campaign.id, campaign]));

  return (items ?? []).flatMap((item) => {
    const product = productMap.get(item.product_id);
    const campaign = campaignMap.get(item.flash_sale_id);
    if (!product || !campaign) return [];
    return [{
      id: item.id,
      title: campaign.title,
      description: campaign.description,
      endsAt: campaign.ends_at,
      product,
      originalPrice: Number(item.original_price),
      salePrice: Number(item.sale_price),
    }];
  });
}
