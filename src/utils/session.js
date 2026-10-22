// ─── NIA Session Helpers ──────────────────────────────────────────────────────
// Shared between the public app and the NIA entry point (nia.html).
// The session token can only be SET from the NIA portal (nia.html).
// In the public app this will always return false, effectively hiding
// all sensitive data (phone numbers, WhatsApp links) from public viewers.

const SESSION_KEY = 'sed_nia_session';
const LEGACY_SESSION_KEY = 'sed_admin_session';
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function isNiaSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || sessionStorage.getItem(LEGACY_SESSION_KEY);
    if (!raw) return false;
    const { grantedAt } = JSON.parse(raw);
    if (Date.now() - grantedAt > SESSION_TTL_MS) {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(LEGACY_SESSION_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function grantNiaSession() {
  const payload = JSON.stringify({ grantedAt: Date.now() });
  sessionStorage.setItem(SESSION_KEY, payload);
  sessionStorage.setItem(LEGACY_SESSION_KEY, payload);
}

export function revokeNiaSession() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(LEGACY_SESSION_KEY);
}

// Aliases for backwards compatibility
export const isAdminSession = isNiaSession;
export const grantAdminSession = grantNiaSession;
export const revokeAdminSession = revokeNiaSession;
