export const marketplaceConfig = {
  name: process.env.NEXT_PUBLIC_MARKETPLACE_NAME || "Marketplace",
  tagline:
    process.env.NEXT_PUBLIC_MARKETPLACE_TAGLINE ||
    "Gaming, hardware and technology for the next generation.",
  description:
    process.env.NEXT_PUBLIC_MARKETPLACE_DESCRIPTION ||
    "A modern marketplace for gaming, hardware and technology.",
  logoUrl: process.env.NEXT_PUBLIC_MARKETPLACE_LOGO_URL || "/favicon.png",
  domain: process.env.NEXT_PUBLIC_MARKETPLACE_DOMAIN || "",
  supportEmail: process.env.NEXT_PUBLIC_MARKETPLACE_SUPPORT_EMAIL || "",
  supportPhone: process.env.NEXT_PUBLIC_MARKETPLACE_SUPPORT_PHONE || "",
  currency: process.env.NEXT_PUBLIC_MARKETPLACE_CURRENCY || "GHS",
  country: process.env.NEXT_PUBLIC_MARKETPLACE_COUNTRY || "Ghana",
  developerName: process.env.NEXT_PUBLIC_DEVELOPER_NAME || "UTECH",
  developerUrl: process.env.NEXT_PUBLIC_DEVELOPER_URL || "",
} as const;