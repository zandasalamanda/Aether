// Admin allowlist. Server-checked against the signed-in user's VERIFIED Clerk
// email, so it can't be spoofed by a client. Override with ADMIN_EMAILS (comma-
// separated) in the environment.
export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "zander.leon@gmail.com")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
