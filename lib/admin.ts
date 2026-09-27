export function isAdminEmail(email?: string | null) {
  const allowed = (process.env.MARKETPLACE_ADMIN_EMAILS ?? process.env.UTECH_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return !!email && allowed.includes(email.toLowerCase());
}
