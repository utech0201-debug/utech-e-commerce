import { Suspense } from "react";
import ShopExplorer from "@/components/shop/ShopExplorer";
import { products } from "@/data/products";
import { getApprovedMarketplaceProducts } from "@/lib/marketplace";

function ShopExplorerFallback() {
  return (
    <div className="empty-results" aria-live="polite">
      <h2>Loading products…</h2>
      <p>Preparing the UTECH Store catalog.</p>
    </div>
  );
}

export default async function Shop() {
  const marketplaceProducts = await getApprovedMarketplaceProducts();
  const catalog = [...products, ...marketplaceProducts];
  return (
    <section className="section">
      <div className="container">
        <span className="eyebrow">STORE</span>
        <h1 className="section-title">Shop UTECH</h1>
        <p className="section-copy">
          Gaming, consoles and powerful laptops for work and play.
        </p>
        <div style={{ marginTop: 40 }}>
          <Suspense fallback={<ShopExplorerFallback />}>
            <ShopExplorer products={catalog} />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
