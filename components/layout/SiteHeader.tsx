"use client";

import Link from "next/link";
import { Search, ShoppingCart, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";

const links = [
  ["Home", "/"],
  ["Shop", "/shop"],
  ["Games", "/games"],
  ["Consoles", "/consoles"],
  ["Laptops", "/laptops"],
  ["Hardware", "/hardware"]
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();

  return (
    <header className="site-header">
      <div className="nav-inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">U</span><span>UTECH</span>
        </Link>

        <nav className={open ? "nav-menu open" : "nav-menu"}>
          {links.map(([label, href]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>
          ))}
        </nav>

        <div className="nav-actions">
          <Link href="/shop" aria-label="Search products"><Search size={19} /></Link>
          <Link href="/cart" className="cart-button" aria-label="Shopping cart">
            <ShoppingCart size={19} />
            {count > 0 && <span>{count}</span>}
          </Link>
          <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  );
}
