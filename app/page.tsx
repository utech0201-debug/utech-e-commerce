import MarketplaceHome from "@/components/home/MarketplaceHome";
import { products } from "@/data/products";
import { getApprovedMarketplaceProducts } from "@/lib/marketplace";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const revalidate = 60;

export default async function Home() {
  const marketplaceProducts = await getApprovedMarketplaceProducts();
  const supabase = await createSupabaseServerClient();
  const { data: ads } = await supabase
    .from("marketplace_ads")
    .select("id,title,body,image_url,href,placement")
    .eq("placement", "homepage")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(3);

  return <MarketplaceHome products={[...products, ...marketplaceProducts]} ads={ads ?? []} />;
}
