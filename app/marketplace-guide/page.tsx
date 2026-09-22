import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Box,
  CreditCard,
  HelpCircle,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  UserRound,
} from "lucide-react";
import styles from "./MarketplaceGuide.module.css";

const sections = [
  {
    id: "buyers",
    icon: ShoppingBag,
    title: "For shoppers",
    intro: "Browse products from UTECH and approved independent sellers, compare listings, add eligible items to your cart and place orders.",
    steps: [
      ["Browse", "Open Shop and explore Games, Consoles, Laptops, Hardware, Fashion, Accessories and other marketplace categories."],
      ["Search & filter", "Use product search, category filters and sorting to narrow down what you need."],
      ["Review a listing", "Check the product details, seller/store information, variants, images, availability and purchase method."],
      ["Add to cart", "Select a variant when required, choose your quantity and add the item to your cart."],
      ["Checkout", "Enter your delivery/contact information and review the order before submitting it."],
      ["Track the order", "Use your account and order information to follow the order journey as fulfillment progresses."],
    ],
  },
  {
    id: "sellers",
    icon: Store,
    title: "For sellers",
    intro: "UTECH supports independent sellers with their own store identity, product catalog, order management, earnings and verification workflow.",
    steps: [
      ["Apply", "Start from Sell on UTECH and submit your seller/store information."],
      ["Verify", "Complete the seller verification process and provide the requested verification information/documents."],
      ["Build your store", "Choose your store/brand name, description, logo and preferred customer order method."],
      ["Add products", "Create product listings with descriptions, pricing, images, inventory and variants where needed."],
      ["Submit for review", "New listings go through the marketplace approval process before becoming publicly available."],
      ["Manage sales", "Use the seller dashboard and order management tools to confirm, process, ship and complete eligible orders."],
      ["Review earnings", "See seller earnings, platform fees, payout status and payout history from the seller area."],
    ],
  },
  {
    id: "seller-rules",
    icon: ShieldCheck,
    title: "Seller safety & marketplace rules",
    intro: "UTECH is designed so seller access, product publication and marketplace operations are separated by approval and ownership controls.",
    steps: [
      ["Lawful products only", "Sellers may offer lawful products that fit the marketplace. Illegal goods and prohibited products are not allowed."],
      ["Approval matters", "Seller approval and product approval are separate controls. A seller cannot approve their own listing."],
      ["Own your data", "Seller database access is scoped to the authenticated seller account, including orders, earnings and verification records."],
      ["Protect customers", "Never request or publish customer passwords, OTPs, card PINs or other sensitive authentication/payment secrets."],
      ["Keep listings accurate", "Product price, stock, variants, images and descriptions should accurately represent what customers will receive."],
    ],
  },
  {
    id: "orders",
    icon: PackageCheck,
    title: "Orders & fulfillment",
    intro: "Marketplace orders are split into seller-specific order items so each seller can manage their own part of a multi-seller purchase.",
    steps: [
      ["Pending", "The seller receives the order item awaiting confirmation."],
      ["Confirmed", "The seller accepts the item for fulfillment."],
      ["Processing", "The seller is preparing the item."],
      ["Ready", "The item is ready for dispatch or handoff."],
      ["Shipped", "The seller has dispatched the item and can add tracking information where available."],
      ["Delivered", "The fulfillment journey is completed."],
      ["Returned / Cancelled", "Supported terminal states are used when an order item is returned or cancelled."],
    ],
  },
  {
    id: "admin",
    icon: BadgeCheck,
    title: "Marketplace administration",
    intro: "Authorized UTECH administrators have operational controls that are intentionally separated from seller accounts.",
    steps: [
      ["Seller applications", "Review pending seller applications and approve or reject them."],
      ["Product review", "Review marketplace product submissions before publication."],
      ["Seller status", "Approved sellers can be suspended when necessary and restored through the admin workflow."],
      ["Verification", "Review seller verification activity and supporting documents."],
      ["Orders & payouts", "Monitor marketplace fulfillment, seller earnings and payout operations."],
      ["Customer support", "Review contact messages and move support cases through new, in-progress, resolved or spam states."],
    ],
  },
];

const quickLinks = [
  ["/shop", "Start shopping", "Explore the marketplace"],
  ["/sell", "Start selling", "Apply to become a seller"],
  ["/account", "My account", "Manage your customer account"],
  ["/contact", "Contact support", "Get help with an order or account"],
];

export default function MarketplaceGuidePage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.eyebrow}><BookOpen size={16} /> UTECH MARKETPLACE GUIDE</div>
          <h1>Everything you need to know about the UTECH Marketplace.</h1>
          <p>
            A practical guide for shoppers, sellers and marketplace operators.
            Learn what UTECH can do, how the marketplace works and where to go when you need help.
          </p>
          <div className={styles.heroActions}>
            <Link href="/shop" className={styles.primary}>Explore the marketplace <ArrowRight size={17} /></Link>
            <a href="#how-it-works" className={styles.secondary}>How it works</a>
          </div>
        </div>
      </section>

      <main className={styles.content}>
        <aside className={styles.toc}>
          <div className={styles.tocCard}>
            <span className={styles.tocLabel}>ON THIS PAGE</span>
            {sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}
            <a href="#quick-help">Quick help</a>
          </div>
        </aside>

        <div className={styles.main}>
          <section id="how-it-works" className={styles.intro}>
            <div className={styles.sectionIcon}><Search size={21} /></div>
            <div>
              <span className={styles.kicker}>HOW IT WORKS</span>
              <h2>One marketplace, different roles.</h2>
              <p>
                Customers discover and buy products. Sellers operate their own marketplace stores.
                Authorized UTECH administrators handle approvals, verification, moderation and marketplace operations.
              </p>
            </div>
          </section>

          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <section id={section.id} key={section.id} className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}><Icon size={21} /></div>
                  <div>
                    <span className={styles.kicker}>UTECH MARKETPLACE</span>
                    <h2>{section.title}</h2>
                    <p>{section.intro}</p>
                  </div>
                </div>
                <div className={styles.steps}>
                  {section.steps.map(([title, text], index) => (
                    <article className={styles.step} key={title}>
                      <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <h3>{title}</h3>
                        <p>{text}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}

          <section id="quick-help" className={styles.help}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon}><HelpCircle size={21} /></div>
              <div>
                <span className={styles.kicker}>NEED HELP?</span>
                <h2>Go straight to the right place.</h2>
                <p>Use these shortcuts instead of searching through the whole site.</p>
              </div>
            </div>
            <div className={styles.quickGrid}>
              {quickLinks.map(([href, title, text]) => (
                <Link href={href} className={styles.quickCard} key={href}>
                  <div>
                    <strong>{title}</strong>
                    <span>{text}</span>
                  </div>
                  <ArrowRight size={17} />
                </Link>
              ))}
            </div>
          </section>

          <section className={styles.security}>
            <ShieldCheck size={22} />
            <div>
              <strong>Security reminder</strong>
              <p>UTECH support will never need your password, OTP, PIN or full card security details. Do not share them through marketplace forms or messages.</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
