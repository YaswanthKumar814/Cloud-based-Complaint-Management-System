/**
 * Simple role check: one admin email, everyone else is a normal user.
 * No Cognito groups or backend RBAC — demo-friendly only.
 */
export const ADMIN_EMAIL = (
  import.meta.env.VITE_ADMIN_EMAIL || 'yaswanthkumarpulapa@gmail.com'
).toLowerCase();

export function getUserEmail(auth) {
  return auth.user?.profile?.email?.trim() ?? '';
}

export function isAdminUser(email) {
  return email.toLowerCase() === ADMIN_EMAIL;
}
