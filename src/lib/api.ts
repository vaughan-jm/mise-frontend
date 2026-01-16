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

export async function getSavedRecipes(): Promise<SavedRecipe[]> {
  const response = await request<SavedRecipesResponse>('/api/recipes/saved')
  return response.recipes
}

export interface SaveRecipeRequest {
  recipe: Recipe
  source?: string
  sourceUrl?: string
}

export interface SaveRecipeResponse {
  recipe: SavedRecipe
}

export async function saveRecipe(
  recipe: Recipe,
  source?: string,
  sourceUrl?: string
): Promise<SavedRecipe> {
  const response = await request<SaveRecipeResponse>('/api/recipes/save', {
    method: 'POST',
    body: JSON.stringify({ recipe, source, sourceUrl }),
  })
  return response.recipe
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
