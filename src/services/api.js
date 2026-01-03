/**
 * API Service with proper error handling, request cancellation, and retry logic
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Track active requests for cancellation
const activeRequests = new Map();

/**
 * Generate a unique request key for deduplication
 */
const getRequestKey = (method, path) => `${method}:${path}`;

/**
 * Cancel any pending request for the same endpoint
 */
export const cancelRequest = (method, path) => {
  const key = getRequestKey(method, path);
  const controller = activeRequests.get(key);
  if (controller) {
    controller.abort();
    activeRequests.delete(key);
  }
};

/**
 * Cancel all pending requests (useful on unmount)
 */
export const cancelAllRequests = () => {
  activeRequests.forEach((controller) => controller.abort());
  activeRequests.clear();
};

const api = {
  getToken: () => {
    try {
      return localStorage.getItem('mise_token');
    } catch {
      // localStorage might be disabled
      return null;
    }
  },

  setToken: (token) => {
    try {
      if (token) {
        localStorage.setItem('mise_token', token);
      } else {
        localStorage.removeItem('mise_token');
      }
    } catch {
      // localStorage might be disabled
      console.warn('Unable to persist auth token');
    }
  },

  /**
   * Make an API request with proper error handling
   * @param {string} method - HTTP method
   * @param {string} path - API path
   * @param {Object} options - Request options
   * @param {Object} options.body - Request body (for POST/PUT)
   * @param {boolean} options.cancelPrevious - Cancel previous request to same endpoint
   * @param {AbortSignal} options.signal - External abort signal
   * @returns {Promise<{data?: any, error?: string, requiresSignup?: boolean, upgrade?: boolean}>}
   */
  async request(method, path, options = {}) {
    const { body, cancelPrevious = true, signal: externalSignal, fingerprint } = options;

    // Cancel previous request if requested
    if (cancelPrevious) {
      cancelRequest(method, path);
    }

    // Create new abort controller
    const controller = new AbortController();
    const key = getRequestKey(method, path);
    activeRequests.set(key, controller);

    // Merge signals if external signal provided
    const signal = externalSignal
      ? AbortSignal.any([controller.signal, externalSignal])
      : controller.signal;

    const headers = {};
    const token = this.getToken();

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Add fingerprint for anonymous tracking
    const requestBody = body ? { ...body } : undefined;
    if (requestBody && !token && fingerprint) {
      requestBody.fingerprint = fingerprint;
    }

    try {
      const res = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: requestBody ? JSON.stringify(requestBody) : undefined,
        signal,
      });

      // Clean up tracking
      activeRequests.delete(key);

      // Handle non-OK responses
      if (!res.ok) {
        // Try to parse error message from response
        let errorData = {};
        try {
          errorData = await res.json();
        } catch {
          // Response wasn't JSON
        }

        return {
          error: errorData.error || errorData.message || `Request failed (${res.status})`,
          message: errorData.message,
          requiresSignup: errorData.requiresSignup,
          upgrade: errorData.upgrade,
          status: res.status,
        };
      }

      // Parse successful response
      try {
        const data = await res.json();
        return data;
      } catch {
        // Response wasn't JSON but was successful
        return { success: true };
      }

    } catch (err) {
      // Clean up tracking
      activeRequests.delete(key);

      // Handle abort
      if (err.name === 'AbortError') {
        return { error: 'Request cancelled', cancelled: true };
      }

      // Handle network errors
      if (err instanceof TypeError && err.message.includes('fetch')) {
        return { error: 'Network error. Please check your connection.' };
      }

      // Handle other errors
      return { error: err.message || 'An unexpected error occurred' };
    }
  },

  /**
   * POST request helper
   */
  async post(path, body = {}, options = {}) {
    return this.request('POST', path, { ...options, body });
  },

  /**
   * GET request helper
   */
  async get(path, options = {}) {
    return this.request('GET', path, options);
  },

  /**
   * DELETE request helper
   */
  async delete(path, options = {}) {
    return this.request('DELETE', path, options);
  },
};

export default api;
