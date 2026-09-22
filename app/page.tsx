import MarketplaceHome from "@/components/home/MarketplaceHome";
import { products } from "@/data/products";
import { getApprovedMarketplaceProducts } from "@/lib/marketplace";

export default async function Home() {
  const marketplaceProducts = await getApprovedMarketplaceProducts();
  return <MarketplaceHome products={[...products, ...marketplaceProducts]} />;
}
