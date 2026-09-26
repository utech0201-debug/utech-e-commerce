import Link from "next/link";
import ProductCard from "@/components/shop/ProductCard";
import SponsoredAd from "@/components/ads/SponsoredAd";
import ProductBillboard from "@/components/home/ProductBillboard";
import PersonalizedDiscovery from "@/components/home/PersonalizedDiscovery";
import FlashSale from "@/components/home/FlashSale";
import type { Product } from "@/data/products";
import { getActiveFlashSaleItems } from "@/lib/marketplace";
import styles from "./MarketplaceHome.module.css";

const categories = [
  { label: "Gaming Consoles", query: "consoles", icon: "🎮" },
  { label: "Laptops", query: "laptops", icon: "💻" },
  { label: "Games", query: "games", icon: "🕹️" },
  { label: "Hardware", query: "hardware", icon: "⚙️" },
];

type Ad = {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  href: string;
  placement: string;
};

type Props = { products: Product[]; ads?: Ad[] };

export default async function MarketplaceHome({ products, ads = [] }: Props) {
  const flashSaleItems = await getActiveFlashSaleItems(products);
  const featured = products.filter((product) => product.featured).slice(0, 4);
  const deals = products.filter((product) => product.variants?.some((variant) => variant.compareAtPrice && variant.compareAtPrice > variant.price)).slice(0, 8);
  const newArrivals = products.slice(0, 8);
  const essentials = [
    { label: "Gaming", query: "games", icon: "🎮", note: "Games & consoles" },
    { label: "Computing", query: "laptops", icon: "💻", note: "Laptops & gear" },
    { label: "Hardware", query: "hardware", icon: "⚙️", note: "Build your setup" },
    { label: "Accessories", query: "accessories", icon: "🎧", note: "Everyday tech" },
    { label: "Fashion", query: "fashion", icon: "👕", note: "Style & more" },
    { label: "Explore all", query: "", icon: "✦", note: "Browse marketplace" },
  ];

  return (
    <main className={styles.page}>
      <section className={styles.marketHero}>
        <div className={styles.heroInner}>
          <aside className={styles.categoryPanel}>
            <div className={styles.panelTitle}>Shop by Category</div>
            {categories.map((category) => <Link key={category.query} href={`/shop?category=${category.query}`} className={styles.categoryLink}><span className={styles.categoryIcon}>{category.icon}</span><span>{category.label}</span><span className={styles.arrow}>›</span></Link>)}
            <Link href="/shop" className={styles.allCategories}>View all products →</Link>
          </aside>

          <ProductBillboard products={products} />

          <div className={styles.quickPanel}>
            <div><span>SELL ON UTECH</span><strong>Open your store</strong><p>Reach customers and grow your business.</p><Link href="/sell">Become a seller →</Link></div>
            <div><span>UTECH PROTECTION</span><strong>Marketplace review</strong><p>Products and sellers go through UTECH review.</p><Link href="/contact">Learn more →</Link></div>
          </div>
        </div>
      </section>

      <section className={styles.essentials} aria-label="Shop marketplace categories">
        <div className={styles.sectionHeader}>
          <div><span className={styles.kicker}>START SHOPPING</span><h2>Your essentials, all in one place</h2></div>
          <Link href="/shop">Browse all →</Link>
        </div>
        <div className={styles.essentialGrid}>
          {essentials.map((item) => (
            <Link key={item.label} href={item.query ? `/shop?category=${item.query}` : "/shop"} className={styles.essentialCard}>
              <span className={styles.essentialIcon}>{item.icon}</span>
              <strong>{item.label}</strong>
              <small>{item.note}</small>
            </Link>
          ))}
        </div>
      </section>

      <PersonalizedDiscovery products={products} />

      <FlashSale items={flashSaleItems} />

      <section className={styles.flashSection}>
        <div className={styles.flashHeader}>
          <div><span className={styles.flashKicker}>EVERYDAY DEALS</span><h2>Marketplace deals</h2><p>Great prices from sellers across the marketplace.</p></div>
          <Link href="/shop" className={styles.flashLink}>See all deals →</Link>
        </div>
        {deals.length ? (
          <div className={styles.productGrid}>{deals.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        ) : (
          <div className={styles.dealEmpty}>New deals are coming soon. <Link href="/shop">Explore the marketplace →</Link></div>
        )}
      </section>

      {ads.length ? <section className={styles.section} aria-label="Sponsored offers">{ads.map((ad) => <SponsoredAd key={ad.id} ad={ad} />)}</section> : null}

      <section className={styles.newSection}>
        <div className={styles.sectionHeader}><div><span className={styles.kicker}>JUST IN</span><h2>New on UTECH</h2></div><Link href="/shop">Discover more →</Link></div>
        <div className={styles.productGrid}>{newArrivals.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>

      {featured.length ? <section className={styles.section}>
        <div className={styles.sectionHeader}><div><span className={styles.kicker}>FEATURED</span><h2>Featured on UTECH</h2></div><Link href="/shop">Explore marketplace →</Link></div>
        <div className={styles.productGrid}>{featured.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section> : null}

      <section className={styles.trustStrip}>
        <div><span>🛡️</span><strong>Safer marketplace</strong><small>Seller and product review</small></div>
        <div><span>🚚</span><strong>Flexible delivery</strong><small>Seller-specific options</small></div>
        <div><span>🔔</span><strong>Smart alerts</strong><small>Price & stock updates</small></div>
        <div><span>🏪</span><strong>Independent sellers</strong><small>Discover unique stores</small></div>
      </section>

      <section className={styles.sellerCta}>
        <div><span className={styles.kicker}>GROW WITH UTECH</span><h2>Have something to sell?</h2><p>Create your store, list products and manage your sales from one seller dashboard.</p></div>
        <Link href="/sell" className="button button-primary">Sell on UTECH</Link>
      </section>
    </main>
  );
}
