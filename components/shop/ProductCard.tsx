import Image from "next/image";
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
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width:700px) 100vw, (max-width:1000px) 50vw, 33vw"
          />
        )}
        {isGame && <span className="game-card-badge">DIGITAL GAME</span>}
      </Link>
      <div className="product-body">
        <span className="product-type">{product.type}</span>
        {product.sellerStoreSlug && (
          <Link className="marketplace-seller-link" href={"/store/" + product.sellerStoreSlug}>
            Sold by {product.sellerStoreName}
          </Link>
        )}
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
