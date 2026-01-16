/**
 * Pare API Client
 * Typed fetch wrapper with Clerk authentication
 */

import type {
  Recipe,
  SavedRecipe,
  User,
  ApiError,
  LanguageCode,
  Difficulty,
  MealType,
} from './types'
import { env } from '../config'
import { ApiRequestError, normalizeError } from './errors'

// Re-export for backwards compatibility
export { ApiRequestError } from './errors'

// Request timeout (ms)
const REQUEST_TIMEOUT = 60000

/**
 * Get auth token from Clerk
 * Must be called within a component that has access to useAuth()
 */
type GetTokenFn = () => Promise<string | null>

let getTokenFn: GetTokenFn | null = null

export function setAuthTokenGetter(fn: GetTokenFn): void {
  getTokenFn = fn
}

/**
 * Make authenticated API request
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // Add auth token if available
    if (getTokenFn) {
      const token = await getTokenFn()
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
      }
    }

    const response = await fetch(`${env.API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    })

    const data = await response.json()

    if (!response.ok) {
      const error = data.error as ApiError | undefined
      throw new ApiRequestError(
        error?.message || 'Request failed',
        error?.code || 'REQUEST_FAILED',
        response.status
      )
    }

    return data as T
  } catch (error) {
    throw normalizeError(error)
  } finally {
    clearTimeout(timeoutId)
  }
}

// ============================================================================
// Auth Endpoints
// ============================================================================

export interface MeResponse {
  user: User
}

export async function getMe(): Promise<User> {
  const response = await request<MeResponse>('/api/auth/me')
  return response.user
}

export async function syncUser(): Promise<User> {
  const response = await request<MeResponse>('/api/auth/sync', {
    method: 'POST',
  })
  return response.user
}

// ============================================================================
// Recipe Extraction Endpoints
// ============================================================================

export interface ExtractUrlRequest {
  url: string
  language?: LanguageCode
}

export interface ExtractPhotoRequest {
  photos: string[] // Base64 encoded images
  language?: LanguageCode
}

export interface ExtractYoutubeRequest {
  url: string
  language?: LanguageCode
}

export interface ExtractResponse {
  recipe: Recipe
  user?: User
}

export async function extractFromUrl(
  url: string,
  language?: LanguageCode
): Promise<ExtractResponse> {
  return request<ExtractResponse>('/api/recipe/clean-url', {
    method: 'POST',
    body: JSON.stringify({ url, language }),
  })
}

export async function extractFromPhoto(
  photos: string[],
  language?: LanguageCode
): Promise<ExtractResponse> {
  return request<ExtractResponse>('/api/recipe/clean-photo', {
    method: 'POST',
    body: JSON.stringify({ photos, language }),
  })
}

export async function extractFromYoutube(
  url: string,
  language?: LanguageCode
): Promise<ExtractResponse> {
  return request<ExtractResponse>('/api/recipe/clean-youtube', {
    method: 'POST',
    body: JSON.stringify({ url, language }),
  })
}

export async function translateRecipe(
  recipe: Recipe,
  targetLanguage: LanguageCode
): Promise<ExtractResponse> {
  return request<ExtractResponse>('/api/recipe/translate', {
    method: 'POST',
    body: JSON.stringify({ recipe, targetLanguage }),
  })
}

// ============================================================================
// Saved Recipes Endpoints
// ============================================================================

export interface SavedRecipesResponse {
  recipes: SavedRecipe[]
}

/**
 * Transform backend saved recipe format to frontend format.
 * Backend returns string[] for ingredients and {instruction, ingredients}[] for steps.
 * Frontend expects {text: string}[] for both.
 */
function transformSavedRecipe(backendRecipe: Record<string, unknown>): SavedRecipe {
  const recipe = backendRecipe

  // Transform ingredients from string[] to {text: string}[]
  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients.map((ing: unknown) => {
        if (typeof ing === 'string') return { text: ing }
        const ingObj = ing as Record<string, unknown>
        return {
          text: (ingObj.text as string) || (ingObj.instruction as string) || String(ing),
          amount: ingObj.amount as string | undefined,
          unit: ingObj.unit as string | undefined,
        }
      })
    : []

  // Transform steps from string[] or {instruction, ingredients}[] to {text, ingredients}[]
  const steps = Array.isArray(recipe.steps)
    ? recipe.steps.map((step: unknown) => {
        if (typeof step === 'string') return { text: step }
        const stepObj = step as Record<string, unknown>
        return {
          text: (stepObj.text as string) || (stepObj.instruction as string) || String(step),
          ingredients: Array.isArray(stepObj.ingredients) ? stepObj.ingredients as string[] : undefined,
        }
      })
    : []

  // Validate difficulty
  const validDifficulties: Difficulty[] = ['easy', 'medium', 'hard']
  const difficulty = validDifficulties.includes(recipe.difficulty as Difficulty)
    ? (recipe.difficulty as Difficulty)
    : undefined

  // Validate mealType
  const validMealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'appetizer', 'side', 'drink']
  const mealType = validMealTypes.includes(recipe.mealType as MealType)
    ? (recipe.mealType as MealType)
    : undefined

  return {
    id: recipe.id as string,
    title: (recipe.title as string) || 'Untitled Recipe',
    servings: typeof recipe.servings === 'number' ? recipe.servings : parseInt(String(recipe.servings)) || 4,
    prepTime: recipe.prepTime as string | undefined,
    cookTime: recipe.cookTime as string | undefined,
    totalTime: recipe.totalTime as string | undefined,
    difficulty,
    cuisine: recipe.cuisine as string | undefined,
    cuisineTags: Array.isArray(recipe.cuisineTags) ? recipe.cuisineTags as string[] : undefined,
    dietaryTags: Array.isArray(recipe.dietaryTags) ? recipe.dietaryTags as string[] : undefined,
    mealType,
    ingredients,
    steps,
    tips: Array.isArray(recipe.tips) ? recipe.tips as string[] : undefined,
    source: recipe.source as string | undefined,
    sourceUrl: recipe.sourceUrl as string | undefined,
    imageUrl: recipe.imageUrl as string | undefined,
    savedAt: recipe.savedAt as string,
  }
}

export async function getSavedRecipes(): Promise<SavedRecipe[]> {
  const response = await request<SavedRecipesResponse>('/api/recipes/saved')
  // Transform each recipe to frontend format
  return response.recipes.map((r) => transformSavedRecipe(r as unknown as Record<string, unknown>))
}

export interface SaveRecipeResponse {
  recipe: SavedRecipe
}

/**
 * Transform frontend Recipe format to backend save format.
 * Frontend uses {text: string} for ingredients and steps.
 * Backend expects string[] for ingredients and {instruction: string}[] for steps.
 */
function transformRecipeForSave(recipe: Recipe, source?: string, sourceUrl?: string) {
  return {
    title: recipe.title,
    servings: String(recipe.servings),
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    imageUrl: recipe.imageUrl,
    // Transform ingredients from {text: string}[] to string[]
    ingredients: recipe.ingredients.map((ing) =>
      typeof ing === 'string' ? ing : ing.text
    ),
    // Transform steps from {text: string}[] to {instruction: string}[]
    steps: recipe.steps.map((step) => {
      if (typeof step === 'string') return step
      return {
        instruction: step.text,
        ingredients: step.ingredients,
      }
    }),
    tips: recipe.tips,
    source,
    sourceUrl,
  }
}

export async function saveRecipe(
  recipe: Recipe,
  source?: string,
  sourceUrl?: string
): Promise<SavedRecipe> {
  const payload = transformRecipeForSave(recipe, source, sourceUrl)
  const response = await request<SaveRecipeResponse>('/api/recipes/save', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  // Transform the returned recipe to frontend format
  return transformSavedRecipe(response.recipe as unknown as Record<string, unknown>)
}

export async function deleteRecipe(recipeId: string): Promise<void> {
  await request<{ success: boolean }>(`/api/recipes/${recipeId}`, {
    method: 'DELETE',
  })
}

// ============================================================================
// Payment Endpoints
// ============================================================================

export interface CreateCheckoutRequest {
  priceId: string
  successUrl?: string
  cancelUrl?: string
}

export interface CreateCheckoutResponse {
  checkoutUrl: string
}

export async function createCheckout(
  priceId: string
): Promise<string> {
  const response = await request<CreateCheckoutResponse>(
    '/api/payments/create-checkout',
    {
      method: 'POST',
      body: JSON.stringify({
        priceId,
        successUrl: `${window.location.origin}/account?success=true`,
        cancelUrl: `${window.location.origin}/pricing?canceled=true`,
      }),
    }
  )
  return response.checkoutUrl
}

// ============================================================================
// Feedback & Rating Endpoints
// ============================================================================

export interface FeedbackRequest {
  message: string
  email?: string
}

export async function submitFeedback(
  message: string,
  email?: string
): Promise<void> {
  await request<{ success: boolean }>('/api/feedback', {
    method: 'POST',
    body: JSON.stringify({ message, email }),
  })
}

export interface RatingRequest {
  recipeIdentifier: string
  rating: number
}

export async function submitRating(
  recipeIdentifier: string,
  rating: number
): Promise<void> {
  await request<{ success: boolean }>('/api/rating', {
    method: 'POST',
    body: JSON.stringify({ recipeIdentifier, rating }),
  })
}

// ============================================================================
// Contact Endpoint
// ============================================================================

export interface ContactRequest {
  name: string
  email: string
  message: string
}

export async function submitContact(
  name: string,
  email: string,
  message: string
): Promise<void> {
  await request<{ success: boolean }>('/api/contact', {
    method: 'POST',
    body: JSON.stringify({ name, email, message }),
  })
}

// ============================================================================
// Admin Endpoints
// ============================================================================

export interface AdminStats {
  totalUsers: number
  totalRecipes: number
  activeSubscriptions: number
  revenueThisMonth: number
}

export interface AdminUser {
  id: string
  email: string
  subscription: string
  recipesUsedThisMonth: number
  createdAt: string
}

export interface AdminUsersResponse {
  users: AdminUser[]
  total: number
  page: number
  pageSize: number
}

export async function getAdminStats(): Promise<AdminStats> {
  return request<AdminStats>('/api/admin/stats')
}

export async function getAdminUsers(
  page = 1,
  pageSize = 50
): Promise<AdminUsersResponse> {
  return request<AdminUsersResponse>(
    `/api/admin/users?page=${page}&pageSize=${pageSize}`
  )
}

// ============================================================================
// Health Check
// ============================================================================

export interface StatusResponse {
  status: string
  timestamp: string
  version: string
}

export async function getStatus(): Promise<StatusResponse> {
  return request<StatusResponse>('/api/status')
}
