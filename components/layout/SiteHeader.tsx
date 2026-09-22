"use client";

import Link from "next/link";
import { Moon, Search, ShoppingCart, Menu, Sun, X, User } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { useTheme } from "@/components/theme/ThemeProvider";
import styles from "./SiteHeader.module.css";

const links = [
  ["Home", "/"],
  ["Shop", "/shop"],
  ["Games", "/games"],
  ["Consoles", "/consoles"],
  ["Laptops", "/laptops"],
  ["Hardware", "/hardware"],
  ["Sell", "/sell"],
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { count } = useCart();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();

    setOpen(false);
    setSearchOpen(false);

    if (term) {
      router.push(`/shop?query=${encodeURIComponent(term)}`);
    } else {
      router.push("/shop");
    }
  }

  return (
    <header className="site-header">
      <div className="nav-inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">U</span>
          <span>UTECH</span>
        </Link>

        <nav className={open ? "nav-menu open" : "nav-menu"}>
          {links.map(([label, href]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          <button
            className="icon-button search-toggle"
            type="button"
            aria-label={searchOpen ? "Close product search" : "Open product search"}
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((value) => !value)}
          >
            {searchOpen ? <X size={19} /> : <Search size={19} />}
          </button>

          <button
            className="icon-button theme-toggle"
            type="button"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          <Link
            href="/account"
            className="icon-button account-button"
            aria-label="My account"
            title="My account"
          >
            <User size={19} />
          </Link>

          <Link href="/cart" className="cart-button" aria-label="Shopping cart">
            <ShoppingCart size={19} />
            {count > 0 && <span>{count}</span>}
          </Link>

          <button
            className="menu-button"
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className={styles.panel}>
          <form className={styles.form} onSubmit={submitSearch}>
            <Search size={19} aria-hidden="true" />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search consoles, laptops, games, hardware..."
              aria-label="Search UTECH products"
            />
            <button type="submit">Search</button>
          </form>
          <p>Search by product name, category, type or description.</p>
        </div>
      )}
    </header>
  );
}
