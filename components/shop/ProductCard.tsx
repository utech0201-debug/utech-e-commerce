import Link from "next/link";
import type { Product } from "@/data/products";
import AddToCart from "./AddToCart";
import GameProductImage from "./GameProductImage";

export default function ProductCard({ product }: { product: Product }) {
  const isGame = product.category === "games";

  return (
    <article className={isGame ? "product-card game-product-card" : "product-card"}>
      <Link href={"/products/" + product.slug} className="product-image">
        {isGame ? (
          <GameProductImage src={product.image} alt={product.name} />
        ) : (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
          />
        )}
        {isGame && <span className="game-card-badge">DIGITAL GAME</span>}
      </Link>
      <div className="product-body">
        <span className="product-type">{product.type}</span>
        <h3><Link href={"/products/" + product.slug}>{product.name}</Link></h3>
        <p>{product.description}</p>
        <div className="product-footer">
          <strong>{"$" + product.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
          <AddToCart product={product} />
        </div>
      </div>
    </article>
  );
}
