/**
 * Centralized Environment Configuration
 *
 * All environment variables should be imported from this file.
 * Never use import.meta.env directly in other files.
 */

export const env = {
  // API
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',

  // Authentication (Clerk)
  CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined,

  // Error Tracking (Sentry)
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN as string | undefined,

  // Analytics (PostHog)
  POSTHOG_KEY: import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined,
  POSTHOG_HOST: import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined,

  // Stripe Price IDs
  STRIPE_BASIC_MONTHLY_PRICE_ID: import.meta.env.VITE_STRIPE_BASIC_MONTHLY_PRICE_ID || 'price_basic_monthly',
  STRIPE_BASIC_YEARLY_PRICE_ID: import.meta.env.VITE_STRIPE_BASIC_YEARLY_PRICE_ID || 'price_basic_yearly',
  STRIPE_PRO_MONTHLY_PRICE_ID: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
  STRIPE_PRO_YEARLY_PRICE_ID: import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
}
