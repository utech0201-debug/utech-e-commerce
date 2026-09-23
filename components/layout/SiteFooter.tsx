import Link from "next/link";

export default function SiteFooter() {
  return <footer className="site-footer"><div className="container footer-grid"><div><Link href="/" className="footer-brand"><span>U</span> UTECH</Link><p>Gaming, hardware and technology for the next generation.</p></div><div><h4>Store</h4><Link href="/shop">Shop</Link><Link href="/games">Games</Link><Link href="/consoles">Consoles</Link><Link href="/laptops">Laptops</Link><Link href="/hardware">Hardware</Link></div><div><h4>Marketplace</h4><Link href="/sell">Sell on UTECH</Link><Link href="/marketplace-guide">Marketplace Guide</Link><Link href="/seller/apply">Become a Seller</Link><Link href="/seller/dashboard">Seller Dashboard</Link></div></div><div className="container footer-bottom"><span>© 2026 UTECH. All rights reserved.</span><span>Gaming • Hardware • Technology • Marketplace</span></div></footer>;
}
