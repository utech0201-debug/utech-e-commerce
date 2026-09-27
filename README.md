# Client-Ready Marketplace

A production-ready multi-seller marketplace built with Next.js, Supabase and modern web technologies.

## Platform capabilities

- Customer accounts and secure authentication
- Product catalog, search, categories and personalization
- Cart and checkout flows
- Independent seller storefronts and seller dashboards
- Seller verification and marketplace review
- Inventory and order management
- Flash-sale campaigns with product/variant conflict protection
- Marketplace advertising controls
- Customer notifications and seller alerts
- Wishlist and recent-search features
- Responsive mobile-first storefront
- Client-configurable marketplace branding

## Local development

1. Copy `.env.example` to `.env.local`.
2. Configure the Supabase variables.
3. Configure `MARKETPLACE_ADMIN_EMAILS` with approved administrator accounts.
4. Configure the marketplace identity variables when the platform is being branded for a client.
5. Install dependencies with `npm install`.
6. Run `npm run dev`.

## Production ownership

The production client should own the domain, GitHub repository, Vercel project, Supabase project, payment/email provider accounts, and production credentials.

UTECH remains the development team and should receive only the access required by the development agreement.

## Transfer documentation

See `docs/CLIENT-HANDOVER.md` for the ownership transfer sequence, security rules and production checklist.

## Important

Do not commit `.env`, `.env.local`, production API keys, service-role keys, payment secrets or authentication secrets.
