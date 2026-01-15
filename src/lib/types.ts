/**
 * Shared TypeScript types for Pare
 */

// Recipe types
export interface Recipe {
  title: string
  servings: number
  prepTime?: string
  cookTime?: string
  ingredients: Ingredient[]
  steps: Step[]
  tips?: string[]
  source?: string
  sourceUrl?: string
  imageUrl?: string
}

export interface Ingredient {
  text: string
  amount?: string
  unit?: string
}

export interface Step {
  text: string
  ingredients?: string[] // Related ingredients for this step
}

// User types
export type SubscriptionTier = 'free' | 'basic' | 'pro'

export interface User {
  id: string
  email: string
  subscription: SubscriptionTier
  recipesUsedThisMonth: number
  recipesRemaining: number
  isAdmin?: boolean
}

// Saved recipe (from database)
export interface SavedRecipe {
  id: string
  title: string
  servings: number
  prepTime?: string
  cookTime?: string
  ingredients: Ingredient[]
  steps: Step[]
  tips?: string[]
  source?: string
  sourceUrl?: string
  imageUrl?: string
  savedAt: string
}

// API response types
export interface ApiError {
  code: string
  message: string
}

export interface ApiResponse<T> {
  data?: T
  error?: ApiError
}

// Extraction types
export type ExtractionMode = 'url' | 'photo' | 'youtube'

export interface ExtractionRequest {
  url?: string
  photos?: string[] // Base64 encoded
  youtubeUrl?: string
  language?: string
}

// Quota info
export interface QuotaInfo {
  used: number
  limit: number
  remaining: number
  tier: SubscriptionTier
}

// Language support
export type LanguageCode = 'en' | 'es' | 'fr' | 'pt' | 'zh' | 'hi' | 'ar'

export interface Language {
  code: LanguageCode
  label: string
  name: string
}

// Cooking mode state
export interface CookingState {
  phase: 'prep' | 'cook'
  completedIngredients: Set<number>
  completedSteps: Set<number>
}

// Pricing types
export interface PricingTier {
  id: SubscriptionTier
  name: string
  monthlyPrice: number
  yearlyPrice: number
  recipesPerMonth: number | 'unlimited'
  features: string[]
  stripePriceIdMonthly?: string
  stripePriceIdYearly?: string
}
