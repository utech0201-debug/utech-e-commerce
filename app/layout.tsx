import type { Metadata } from "next";
import "./globals.css";
import "./loading.css";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import AppIntro from "@/components/layout/AppIntro";
import { CartProvider } from "@/components/cart/CartProvider";
import { marketplaceConfig } from "@/lib/marketplace-config";

export const metadata: Metadata = {
  title: marketplaceConfig.name,
  description: marketplaceConfig.description,
  icons: {
    icon: marketplaceConfig.logoUrl,
    apple: marketplaceConfig.logoUrl,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppIntro />
        <CartProvider>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
