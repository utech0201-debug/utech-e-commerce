import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { CartProvider } from "@/components/cart/CartProvider";

export const metadata: Metadata = {
  title: "UTECH Store | Gaming • Hardware • Technology",
  description: "UTECH Store — gaming systems, consoles, laptops, hardware and technology.",
  metadataBase: new URL("https://utech-e-commerce.vercel.app")
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
