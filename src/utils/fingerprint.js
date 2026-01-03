/**
 * Browser fingerprinting for anonymous user tracking
 * Used to enforce recipe limits for non-authenticated users
 */

const STORAGE_KEY = 'mise_fingerprint';

/**
 * Simple hash function (djb2 variant)
 * @param {string} str - String to hash
 * @returns {number} - Hash value
 */
const hash = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    h = ((h << 5) - h) + char;
    h = h & h; // Convert to 32-bit integer
  }
  return Math.abs(h);
};

/**
 * Generate canvas fingerprint
 * @returns {string} - Canvas data substring
 */
const getCanvasFingerprint = () => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
    return canvas.toDataURL().slice(-50);
  } catch {
    // Canvas fingerprinting blocked by browser/extension
    return '';
  }
};

/**
 * Collect browser characteristics for fingerprinting
 * @returns {string} - Concatenated characteristics
 */
const collectCharacteristics = () => {
  const characteristics = [
    navigator.userAgent || '',
    navigator.language || '',
    `${screen.width}x${screen.height}`,
    new Date().getTimezoneOffset().toString(),
    getCanvasFingerprint(),
  ];

  return characteristics.join('|');
};

/**
 * Get or generate browser fingerprint
 * @returns {string} - Fingerprint ID prefixed with 'fp_'
 */
export const getFingerprint = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
  } catch {
    // localStorage disabled
  }

  const data = collectCharacteristics();
  const fingerprint = `fp_${hash(data).toString(36)}`;

  try {
    localStorage.setItem(STORAGE_KEY, fingerprint);
  } catch {
    // localStorage disabled - fingerprint will be regenerated each session
  }

  return fingerprint;
};

/**
 * Clear stored fingerprint (for testing/debugging)
 */
export const clearFingerprint = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage disabled
  }
};

export default getFingerprint;
