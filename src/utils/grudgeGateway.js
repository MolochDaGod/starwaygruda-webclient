/**
 * grudgeGateway.js — Grudge Auth Gateway client for StarWayGRUDA-WebClient
 * Gateway: https://auth-gateway-otb8qmmyd-grudgenexus.vercel.app
 */

export const GATEWAY_URL = 'https://auth-gateway-otb8qmmyd-grudgenexus.vercel.app';

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

export function redirectToGateway(returnUrl) {
  const ret = returnUrl || window.location.href;
  window.location.href = `${GATEWAY_URL}?return=${encodeURIComponent(ret)}`;
}

export function gatewaySignOut() {
  ['grudge_auth_token','grudge_user_id','grudge_id','grudge_username',
   'grudge_session_token','starway_session'].forEach(k => localStorage.removeItem(k));
}

/**
 * Call on app boot. Returns user object if authenticated.
 * If `autoRedirect` is true, redirects to gateway when not authenticated.
 */
export function checkGatewayOnBoot({ autoRedirect = false } = {}) {
  const user = getGatewayUser();
  if (user) return user;
  if (autoRedirect) { redirectToGateway(); return null; }
  return null;
}
