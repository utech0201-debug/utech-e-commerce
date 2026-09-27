# Security & Production Transfer

## Access control

Administrator access is controlled by the server-side MARKETPLACE_ADMIN_EMAILS allowlist. The application must not contain a hard-coded client or developer administrator email.

During migration, UTECH_ADMIN_EMAILS may remain as a compatibility alias. Remove the alias after the client environment has been fully migrated.

## Secrets

Keep all server secrets in the deployment environment. Never commit production credentials.

Server-only credentials include:

- SUPABASE_SECRET_KEY
- Payment provider secret keys
- Email provider API keys
- Webhook signing secrets
- Any third-party private tokens

## Ownership

Production accounts should be created under client-controlled identities. Do not transfer ownership by sharing a developer's personal password.

## Developer access

UTECH should be added as a named collaborator or organization/team member. Access should be limited to the responsibilities defined in the development agreement and removable by the client.

## Data

Customer, seller, order, payout and verification data is production business data. Do not delete or anonymize it during code cleanup without explicit authorization.

## Transfer security checklist

- [ ] Client owner account created
- [ ] Client admin allowlist configured
- [ ] Developer accounts separated from client owner accounts
- [ ] Production secrets rotated
- [ ] Supabase ownership confirmed
- [ ] Vercel ownership confirmed
- [ ] Domain/DNS ownership confirmed
- [ ] Payment provider ownership confirmed
- [ ] Email provider ownership confirmed
- [ ] Database backup verified
- [ ] Recovery procedure tested