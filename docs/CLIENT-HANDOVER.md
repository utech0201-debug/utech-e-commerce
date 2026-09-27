# Client Handover

## Purpose

This marketplace is prepared to be transferred to a client who will own the production business and infrastructure while UTECH remains the contracted development team.

## Ownership model

### Client
The client should own and control:

- Production domain and DNS
- GitHub repository or organization
- Vercel project
- Supabase project and production database
- Production authentication configuration
- Payment provider accounts
- Email provider account/domain
- Production storage and backups
- Marketplace administrator accounts
- Business data, customers, sellers, orders, payouts and campaigns

### UTECH development team

UTECH should receive only the access required by the development agreement, preferably as a named collaborator/team member rather than by sharing client passwords or permanent personal credentials.

## Configuration

Customer-facing identity must come from environment configuration where practical. Set the NEXT_PUBLIC_MARKETPLACE_* variables before production transfer.

MARKETPLACE_ADMIN_EMAILS is the production administrator allowlist. Do not rely on a hard-coded administrator email.

## Transfer sequence

1. Confirm the client's legal/business ownership details.
2. Create or identify the client's GitHub organization/repository.
3. Transfer or mirror the repository without exposing secrets.
4. Create the client's Vercel project and connect the repository.
5. Create the client's Supabase production project.
6. Migrate the approved production database schema and data.
7. Configure authentication, redirect URLs and email settings.
8. Configure payment, email and other external providers under client-owned accounts.
9. Configure production environment variables.
10. Create the client's owner/admin accounts.
11. Grant UTECH developer access according to the contract.
12. Verify checkout, seller onboarding, admin controls, notifications, storage and recovery.
13. Rotate any credentials that were used during development.
14. Confirm DNS and production domain.
15. Record the final production versions and handover date.

## Security rules

- Never commit .env files or production secrets.
- Never hard-code administrator emails, passwords, API keys or payment secrets.
- Client owner accounts must use unique credentials and MFA where supported.
- UTECH access should be removable without taking down the marketplace.
- Production and development credentials should be separate.
- Do not delete customer or seller data as part of code cleanup. Data cleanup requires an explicit production-data decision.

## Pre-transfer checklist

- [ ] Client branding configured
- [ ] Client domain configured
- [ ] Client support contacts configured
- [ ] Client administrator accounts created
- [ ] UTECH developer access granted
- [ ] GitHub ownership/access confirmed
- [ ] Vercel ownership/access confirmed
- [ ] Supabase ownership/access confirmed
- [ ] Payment provider ownership/access confirmed
- [ ] Email provider ownership/access confirmed
- [ ] Production environment variables verified
- [ ] Backup/recovery procedure tested
- [ ] Demo/test records reviewed and removed only when confirmed safe
- [ ] Production checkout tested
- [ ] Seller onboarding tested
- [ ] Admin authorization tested
- [ ] Domain/DNS verified
- [ ] Secrets rotated after handover