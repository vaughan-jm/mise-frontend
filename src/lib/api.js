/**
 * API Client and Utilities for Mise
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Quota limits (must match backend config)
export const QUOTAS = {
  anonymous: 10,
  free: 3,
  basic: 20,
  pro: Infinity,
};

// Clerk-aware API helper - will be initialized with getToken function
let clerkGetToken = null;

export const setClerkGetToken = (fn) => {
  clerkGetToken = fn;
};

/**
 * Generate browser fingerprint for anonymous tracking
 */
export const getFingerprint = () => {
  const stored = localStorage.getItem('mise_fingerprint');
  if (stored) return stored;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('fingerprint', 2, 2);
  const canvasData = canvas.toDataURL();

  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvasData.slice(-50)
  ].join('|');

  // Simple hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const fingerprint = 'fp_' + Math.abs(hash).toString(36);
  localStorage.setItem('mise_fingerprint', fingerprint);
  return fingerprint;
};

/**
 * Helper to normalize v2 API errors to v1 format
 */
const normalizeError = (data) => {
  if (data.error && typeof data.error === 'object') {
    // V2 format: { error: { code, message, details } }
    const { code, message } = data.error;
    return {
      error: message,
      code,
      // Map error codes to v1-style flags
      requiresSignup: code === 'QUOTA_EXCEEDED' && message.includes('sign up'),
      upgrade: code === 'QUOTA_EXCEEDED' || code === 'FORBIDDEN',
      message,
    };
  }
  // Already v1 format or no error
  return data;
};

/**
 * Helper to calculate recipesRemaining from user data
 */
export const calculateRecipesRemaining = (user) => {
  if (!user) return QUOTAS.anonymous;
  const sub = (user.subscription || 'free').toLowerCase();
  const limit = QUOTAS[sub] || QUOTAS.free;
  if (limit === Infinity) return Infinity;
  return Math.max(0, limit - (user.recipesUsedThisMonth || 0));
};

/**
 * Helper to parse servings to integer
 */
export const parseServingsToInt = (servings) => {
  if (servings === undefined || servings === null) return 4;
  const parsed = parseInt(String(servings).replace(',', '.'), 10);
  return isNaN(parsed) || parsed < 1 ? 4 : parsed;
};

/**
 * API with Clerk token-based auth
 */
export const api = {
  async getToken() {
    if (clerkGetToken) {
      try {
        return await clerkGetToken();
      } catch {
        return null;
      }
    }
    return null;
  },

  async post(path, body = {}) {
    const headers = { 'Content-Type': 'application/json' };
    const token = await this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Add fingerprint for anonymous tracking
    if (!token) body.fingerprint = getFingerprint();

    const res = await fetch(`${API_URL}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await res.json();
    return normalizeError(data);
  },

  async get(path) {
    const headers = {};
    const token = await this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${path}`, { headers });
    const data = await res.json();
    return normalizeError(data);
  },

  async delete(path) {
    const headers = {};
    const token = await this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${path}`, { method: 'DELETE', headers });
    const data = await res.json();
    return normalizeError(data);
  },
};

