import Link from "next/link";
import ProductCard from "@/components/shop/ProductCard";
import SponsoredAd from "@/components/ads/SponsoredAd";
import ProductBillboard from "@/components/home/ProductBillboard";
import type { Product } from "@/data/products";
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

export default function MarketplaceHome({ products, ads = [] }: Props) {
  const featured = products.filter((product) => product.featured).slice(0, 4);
  const deals = products.slice(0, 6);

  return (
    <main className={styles.page}>
      <section className={styles.marketHero}>
        <div className={styles.heroInner}>
          <aside className={styles.categoryPanel}>
            <div className={styles.panelTitle}>Shop by Category</div>
            {categories.map((category) => (
              <Link key={category.query} href={`/shop?category=${category.query}`} className={styles.categoryLink}>
                <span className={styles.categoryIcon}>{category.icon}</span>
                <span>{category.label}</span>
                <span className={styles.arrow}>›</span>
              </Link>
            ))}
            <Link href="/shop" className={styles.allCategories}>View all products →</Link>
          </aside>

          <ProductBillboard products={products} />

          <div className={styles.quickPanel}>
            <div>
              <span>SELL ON UTECH</span>
              <strong>Open your store</strong>
              <p>Reach customers and grow your business.</p>
              <Link href="/sell">Become a seller →</Link>
            </div>
            <div>
              <span>UTECH PROTECTION</span>
              <strong>Marketplace review</strong>
              <p>Products and sellers go through UTECH review.</p>
              <Link href="/contact">Learn more →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.kicker}>EXPLORE</span>
            <h2>Popular categories</h2>
          </div>
          <Link href="/shop">See all →</Link>
        </div>
        <div className={styles.categoryTiles}>
          {categories.map((category) => (
            <Link href={`/shop?category=${category.query}`} key={category.query} className={styles.categoryTile}>
              <span>{category.icon}</span>
              <strong>{category.label}</strong>
              <small>Shop now →</small>
            </Link>
          ))}
        </div>
      </section>

      {ads.length ? (
        <section className={styles.section} aria-label="Sponsored offers">
          {ads.map((ad) => <SponsoredAd key={ad.id} ad={ad} />)}
        </section>
      ) : null}

      <section className={styles.deals}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.kicker}>HOT PICKS</span>
            <h2>Deals worth checking out</h2>
          </div>
          <Link href="/shop">View all →</Link>
        </div>
        <div className={styles.productGrid}>
          {deals.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      {featured.length ? (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.kicker}>FEATURED</span>
              <h2>Featured on UTECH</h2>
            </div>
            <Link href="/shop">Explore marketplace →</Link>
          </div>
          <div className={styles.productGrid}>
            {featured.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>
      ) : null}

      <section className={styles.sellerCta}>
        <div>
          <span className={styles.kicker}>GROW WITH UTECH</span>
          <h2>Have something to sell?</h2>
          <p>Create your store, list products and manage your sales from one seller dashboard.</p>
        </div>
        <Link href="/sell" className="button button-primary">Sell on UTECH</Link>
      </section>
    </main>
  );
}
