import Link from "next/link";
import ProductCard from "@/components/shop/ProductCard";
import type { Product } from "@/data/products";
import styles from "./MarketplaceHome.module.css";

const categories = [
  { label: "Gaming Consoles", query: "consoles", icon: "🎮" },
  { label: "Laptops", query: "laptops", icon: "💻" },
  { label: "Games", query: "games", icon: "🕹️" },
  { label: "Hardware", query: "hardware", icon: "⚙️" },
];

type Props = { products: Product[] };

export default function MarketplaceHome({ products }: Props) {
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

          <div className={styles.heroBanner}>
            <div className={styles.heroCopy}>
              <span className={styles.kicker}>WELCOME TO UTECH STORE</span>
              <h1>Your marketplace for tech, gaming & more.</h1>
              <p>Discover products from UTECH and independent sellers in one trusted marketplace.</p>
              <div className={styles.heroActions}>
                <Link href="/shop" className="button button-primary">Shop now</Link>
                <Link href="/sell" className="button button-secondary">Start selling</Link>
              </div>
            </div>
            <div className={styles.heroVisual}>
              <div className={styles.glow} />
              {products[0]?.image ? <img src={products[0].image} alt="" /> : null}
            </div>
          </div>

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
