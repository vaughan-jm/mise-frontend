/**
 * Pare Pricing Configuration
 *
 * Edit this file to change pricing tiers, limits, and features.
 * Components read from here - never hardcode pricing in UI.
 */

import type { PricingTier, SubscriptionTier } from '../lib/types'
import { env } from '../config'

// Stripe Price IDs from centralized config
const STRIPE_PRICE_IDS = {
  basicMonthly: env.STRIPE_BASIC_MONTHLY_PRICE_ID,
  basicYearly: env.STRIPE_BASIC_YEARLY_PRICE_ID,
  proMonthly: env.STRIPE_PRO_MONTHLY_PRICE_ID,
  proYearly: env.STRIPE_PRO_YEARLY_PRICE_ID,
}

/**
 * Pricing tiers
 * Edit prices, limits, and features here
 */
export const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    recipesPerMonth: 3,
    features: [
      '3 recipes per month',
      'URL extraction',
      'Photo extraction',
      'YouTube extraction',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    monthlyPrice: 4.99,
    yearlyPrice: 49.99, // 2 months free
    recipesPerMonth: 30,
    features: [
      '30 recipes per month',
      'Save up to 50 recipes',
      'URL extraction',
      'Photo extraction',
      'YouTube extraction',
    ],
    stripePriceIdMonthly: STRIPE_PRICE_IDS.basicMonthly,
    stripePriceIdYearly: STRIPE_PRICE_IDS.basicYearly,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 9.99,
    yearlyPrice: 99.99, // 2 months free
    recipesPerMonth: 'unlimited',
    features: [
      'Unlimited recipes',
      'Unlimited saved recipes',
      'URL extraction',
      'Photo extraction',
      'YouTube extraction',
      'Recipe translation',
      'Priority processing',
    ],
    stripePriceIdMonthly: STRIPE_PRICE_IDS.proMonthly,
    stripePriceIdYearly: STRIPE_PRICE_IDS.proYearly,
  },
]

/**
 * Anonymous user limits (not signed in)
 */
export const anonymousLimits = {
  recipesTotal: 10, // 10 total recipes before requiring sign-in
}

/**
 * Get tier by ID
 */
export function getTier(tierId: SubscriptionTier): PricingTier | undefined {
  return pricingTiers.find((t) => t.id === tierId)
}

/**
 * Get recipe limit for a tier
 */
export function getRecipeLimit(tierId: SubscriptionTier): number | 'unlimited' {
  const tier = getTier(tierId)
  return tier?.recipesPerMonth ?? 3
}

/**
 * Calculate yearly savings percentage
 */
export function getYearlySavings(tier: PricingTier): number {
  if (tier.monthlyPrice === 0) return 0
  const yearlyIfMonthly = tier.monthlyPrice * 12
  const savings = ((yearlyIfMonthly - tier.yearlyPrice) / yearlyIfMonthly) * 100
  return Math.round(savings)
}

/**
 * Format price for display
 */
export function formatPrice(price: number, currency = 'USD'): string {
  if (price === 0) return 'Free'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(price)
}

/**
 * Check if tier has translation feature
 */
export function hasTranslation(tierId: SubscriptionTier): boolean {
  return tierId === 'basic' || tierId === 'pro'
}

/**
 * Check if tier is paid
 */
export function isPaidTier(tierId: SubscriptionTier): boolean {
  return tierId === 'basic' || tierId === 'pro'
}

/**
 * Check if tier can save recipes
 * Free users cannot save - this is a conversion lever
 */
export function canSaveRecipes(tierId: SubscriptionTier): boolean {
  return tierId === 'basic' || tierId === 'pro'
}

/**
 * Get save limit for a tier
 */
export function getSaveLimit(tierId: SubscriptionTier): number | 'unlimited' {
  if (tierId === 'pro') return 'unlimited'
  if (tierId === 'basic') return 50
  return 0 // Free users can't save
}
