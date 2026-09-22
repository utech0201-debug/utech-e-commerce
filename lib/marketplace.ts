import type { Product, ProductCategory } from "@/data/products";
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

type SellerRow = {
  id: string;
  store_name: string;
  store_slug: string;
  order_method: "utech_checkout" | "whatsapp" | "hybrid";
  whatsapp_number: string | null;
  order_instructions: string | null;
};

const categories: ProductCategory[] = ["games", "consoles", "laptops", "hardware"];

function normalizeCategory(category: string): ProductCategory {
  const value = category.trim().toLowerCase();
  return categories.includes(value as ProductCategory)
    ? (value as ProductCategory)
    : "hardware";
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

  const sellerMap = new Map(
    ((sellers ?? []) as SellerRow[]).map((seller) => [seller.id, seller]),
  );

  return (rows as SellerProductRow[])
    .map((row) => {
      const seller = sellerMap.get(row.seller_id);
      if (!seller) return null;

      return {
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
        orderInstructions: seller.order_instructions,
      } satisfies Product;
    })
    .filter((product): product is Product => product !== null);
}
