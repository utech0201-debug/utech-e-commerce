import Link from "next/link";

export default function SellPage() {
  return <section className="section seller-landing"><div className="container">
    <div className="seller-hero"><div><span className="eyebrow">UTECH MARKETPLACE</span><h1>SELL ON UTECH.</h1><p>Bring your products to a growing technology marketplace. Create your seller store, list products, manage orders and earn from every sale.</p><div className="hero-actions"><Link className="button button-primary" href="/seller/apply">Become a Seller</Link><Link className="button button-secondary" href="/seller/dashboard">Seller Dashboard</Link></div></div><div className="seller-hero-panel"><span>YOUR STORE</span><strong>YOUR PRODUCTS.</strong><p>UTECH provides the marketplace infrastructure. You bring the products.</p></div></div>
    <div className="seller-feature-grid">{[["01","Create your store","Apply for a seller account and build your storefront identity."],["02","List products","Add products, prices, inventory and descriptions from your dashboard."],["03","Receive orders","Customers discover and purchase approved products through UTECH."],["04","Grow with UTECH","Keep track of sales and seller earnings as the marketplace grows."]].map(([number,title,copy])=><article className="seller-feature" key={number}><span>{number}</span><h2>{title}</h2><p>{copy}</p></article>)}</div>
    <div className="seller-callout"><div><span className="eyebrow">MARKETPLACE MODEL</span><h2>UTECH earns from completed marketplace sales.</h2><p>A platform commission can be applied to seller sales. Exact rates, payout timing and seller rules will be managed by UTECH.</p></div><Link className="button button-primary" href="/seller/apply">Start Application</Link></div>
  </div></section>;
}
