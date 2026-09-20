import ProductCard from "@/components/shop/ProductCard";
import { products } from "@/data/products";

const filters = ["All Games", "Action", "Adventure", "Sports", "Racing", "Fighting"];

export default function GamesPage() {
  const games = products.filter((product) => product.category === "games");

  return (
    <section className="section">
      <div className="container">
        <span className="eyebrow">UTECH GAMING</span>
        <h1 className="section-title">PLAY. COMPETE. EXPERIENCE.</h1>
        <p className="section-copy">
          Browse the UTECH gaming library and add your software games directly to your cart.
        </p>

        <div className="shop-toolbar" style={{ marginTop: 32 }}>
          <div>
            <span className="section-kicker">GAME LIBRARY</span>
            <h2>Available Games</h2>
          </div>
          <div className="shop-search">
            <input type="search" placeholder="Search games..." aria-label="Search games" />
          </div>
        </div>

        <div className="category-filters" style={{ marginTop: 20 }}>
          {filters.map((filter) => (
            <button key={filter} className="filter-btn" type="button">
              {filter}
            </button>
          ))}
        </div>

        <div className="product-grid" style={{ marginTop: 40 }}>
          {games.map((game) => (
            <ProductCard key={game.id} product={game} />
          ))}
        </div>
      </div>
    </section>
  );
}
