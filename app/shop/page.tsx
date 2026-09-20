import ShopExplorer from "@/components/shop/ShopExplorer";
import { products } from "@/data/products";

export default function Shop() {
  return (
    <section className="section">
      <div className="container">
        <span className="eyebrow">STORE</span>
        <h1 className="section-title">Shop UTECH</h1>
        <p className="section-copy">
          Gaming, consoles and powerful laptops for work and play.
        </p>
        <div style={{ marginTop: 40 }}>
          <ShopExplorer products={products} />
        </div>
      </div>
    </section>
  );
}
