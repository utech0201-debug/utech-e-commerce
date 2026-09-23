export function isAdminEmail(email?: string | null) {
  const allowed = (process.env.UTECH_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  // Keep the marketplace owner recoverable when the deployment environment
  // has not yet been configured with UTECH_ADMIN_EMAILS.
  const marketplaceOwner = "youngmello0201@gmail.com";

  return !!email && (allowed.includes(email.toLowerCase()) || email.toLowerCase() === marketplaceOwner);
}
