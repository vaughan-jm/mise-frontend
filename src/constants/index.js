/**
 * Application constants - centralized configuration values
 */

// Recipe limits
export const ANONYMOUS_RECIPE_LIMIT = 10;
export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = 20;

// Timing constants (milliseconds)
export const LOADING_MESSAGE_INTERVAL = 3000;
export const TOAST_DURATION = 8000;
export const FEEDBACK_SUCCESS_DURATION = 2000;

// API endpoints
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    GOOGLE: '/api/auth/google',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
  },
  RECIPE: {
    CLEAN_URL: '/api/recipe/clean-url',
    CLEAN_PHOTO: '/api/recipe/clean-photo',
    CLEAN_YOUTUBE: '/api/recipe/clean-youtube',
    TRANSLATE: '/api/recipe/translate',
  },
  RECIPES: {
    SAVED: '/api/recipes/saved',
    SAVE: '/api/recipes/save',
    DELETE: (id) => `/api/recipes/${id}`,
  },
  PAYMENTS: {
    PLANS: '/api/payments/plans',
    CHECKOUT: '/api/payments/create-checkout',
  },
  FEEDBACK: '/api/feedback',
  RATING: '/api/rating',
  RATINGS_SUMMARY: '/api/ratings/summary',
};

// Input modes
export const INPUT_MODES = {
  URL: 'url',
  PHOTO: 'photo',
  YOUTUBE: 'youtube',
};

// Cooking phases
export const PHASES = {
  PREP: 'prep',
  COOK: 'cook',
};

// Auth modes
export const AUTH_MODES = {
  LOGIN: 'login',
  SIGNUP: 'signup',
};

// Google Client ID
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
