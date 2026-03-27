/**
 * grudgeGateway.js — Grudge Auth Gateway client for StarWayGRUDA-WebClient
 * Identity provider: https://id.grudge-studio.com (canonical Grudge ID)
 *
 * Note: The old auth-gateway-otb8qmmyd-grudgenexus.vercel.app deployment
 * has been retired. All auth now goes through id.grudge-studio.com.
 */

export const GATEWAY_URL = 'https://id.grudge-studio.com';

export function getGatewayToken() {
  return localStorage.getItem('grudge_auth_token') || null;
}

export function getGatewayUser() {
  const token = getGatewayToken();
  if (!token) return null;
  return {
    token,
    userId: localStorage.getItem('grudge_user_id') || null,
    grudgeId: localStorage.getItem('grudge_id') || null,
    username: localStorage.getItem('grudge_username') || 'Pilot',
  };
}

export function isGatewayAuthenticated() {
  return !!getGatewayToken();
}

/** Redirect to Grudge ID SSO. Returns to returnUrl after auth. */
export function redirectToGateway(returnUrl) {
  const ret = returnUrl || window.location.href;
  window.location.href = `${GATEWAY_URL}/auth/sso-check?return=${encodeURIComponent(ret)}`;
}

/** Sign out — invalidates JWT server-side then clears local state. */
export function gatewaySignOut() {
  // Fire-and-forget: invalidate JWT on id.grudge-studio.com
  const token = getGatewayToken();
  if (token) {
    fetch(`${GATEWAY_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }).catch(() => {}); // best-effort
  }
  // Clear all auth keys (including legacy ones)
  ['grudge_auth_token','grudge_user_id','grudge_id','grudge_username',
   'grudge-session','grudge_session_token','starway_session',
   'grudge_user_data'].forEach(k => localStorage.removeItem(k));
}

/**
 * Call on app boot. Returns user object if authenticated.
 * If `autoRedirect` is true, redirects to id.grudge-studio.com SSO when not authenticated.
 */
export function checkGatewayOnBoot({ autoRedirect = false } = {}) {
  // Check URL for SSO return token
  const params = new URLSearchParams(window.location.search);
  const returnedToken = params.get('token') || params.get('sso_token');
  if (returnedToken) {
    localStorage.setItem('grudge_auth_token', returnedToken);
    const username = params.get('grudge_username') || params.get('username') || '';
    const userId   = params.get('grudge_user_id') || '';
    const grudgeId = params.get('grudge_id') || '';
    if (username) localStorage.setItem('grudge_username', username);
    if (userId)   localStorage.setItem('grudge_user_id', userId);
    if (grudgeId) localStorage.setItem('grudge_id', grudgeId);
    // Clean URL
    const url = new URL(window.location.href);
    ['token','sso_token','grudge_username','grudge_user_id','grudge_id','provider','username'].forEach(k => url.searchParams.delete(k));
    window.history.replaceState({}, '', url.toString());
  }
  const user = getGatewayUser();
  if (user) return user;
  if (autoRedirect) { redirectToGateway(); return null; }
  return null;
}
