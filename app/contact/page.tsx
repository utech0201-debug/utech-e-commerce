import Link from "next/link";

export default function ContactPage() {
  return (
    <section className="section auth-section">
      <div className="container auth-container">
        <div className="auth-card">
          <span className="eyebrow">CONTACT UTECH</span>
          <h1>Let&apos;s talk.</h1>
          <p>
            Have a question about an order, a seller store, the marketplace, or a product?
            Reach out to the UTECH team.
          </p>
          <div className="account-grid" style={{ marginTop: 28 }}>
            <div>
              <strong>Marketplace</strong>
              <p>For seller applications, product reviews and storefront questions.</p>
              <Link href="/sell" className="button button-secondary">Sell on UTECH</Link>
            </div>
            <div>
              <strong>Shopping</strong>
              <p>Browse the combined UTECH catalog for games, consoles, laptops, hardware and more.</p>
              <Link href="/shop" className="button button-secondary">Open Shop</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
