import Link from "next/link";
import { products } from "@/data/products";
import GamesExplorer from "@/components/games/GamesExplorer";

export default function GamesPage() {
  const games = products.filter((product) => product.category === "games");
  const featured = games[0];

  return (
    <>
      <section className="games-hero">
        <div className="container games-hero-grid">
          <div className="games-hero-copy">
            <span className="eyebrow">UTECH GAMING</span>
            <h1>PLAY. <span>COMPETE.</span> EXPERIENCE.</h1>
            <p>
              Discover software games for action, adventure, racing, sports and more.
              Pick a title, add it to your cart and continue through the UTECH checkout.
            </p>
            <div className="hero-actions">
              <a href="#game-library" className="button button-primary">Browse Games</a>
              <Link href="/cart" className="button button-secondary">View Cart</Link>
            </div>
          </div>

          <div className="games-hero-card">
            <div className="games-hero-orbit" />
            <div className="games-hero-console">
              <span>UTECH</span>
              <strong>GAMING</strong>
              <small>SOFTWARE LIBRARY</small>
            </div>
            <div className="games-hero-stats">
              <div><strong>{games.length}</strong><span>Titles</span></div>
              <div><strong>5</strong><span>Genres</span></div>
              <div><strong>$5.50</strong><span>From</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section games-library" id="game-library">
        <div className="container">
          <GamesExplorer games={games} />
        </div>
      </section>

      {featured && (
        <section className="games-bottom-cta">
          <div className="container games-bottom-card">
            <div>
              <span className="eyebrow">READY TO PLAY?</span>
              <h2>Build your collection.</h2>
              <p>Games, consoles, laptops and hardware — all in one UTECH Store.</p>
            </div>
            <Link href="/shop" className="button button-primary">Explore Store</Link>
          </div>
        </section>
      )}
    </>
  );
}
