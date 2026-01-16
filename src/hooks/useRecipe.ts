/**
 * useRecipe Hook
 *
 * Handles recipe extraction from URL, photo, and YouTube.
 * Manages loading states, errors, and quota updates.
 *
 * Usage:
 *   const { extract, recipe, isLoading, error, reset } = useRecipe()
 *   await extract('url', { url: 'https://example.com/recipe' })
 */

import { useState, useCallback } from 'react'
import type { Recipe, LanguageCode, Ingredient, Step, Difficulty, MealType } from '../lib/types'
import {
  extractFromUrl,
  extractFromPhoto,
  extractFromYoutube,
  translateRecipe as translateRecipeApi,
  ApiRequestError,
} from '../lib/api'
import { useApp } from '../context/AppContext'

/**
 * Transform backend recipe data to frontend format.
 * Backend returns:
 *   - ingredients: string[] (e.g., ["500g chicken", "2 tbsp oil"])
 *   - steps: {instruction: string, ingredients: string[]}[]
 * Frontend expects:
 *   - ingredients: {text: string, amount?: string, unit?: string}[]
 *   - steps: {text: string, ingredients?: string[]}[]
 */
function transformRecipe(backendRecipe: unknown): Recipe {
  const recipe = backendRecipe as Record<string, unknown>

  // Transform ingredients - handle both string[] and {text: string}[] formats
  const ingredients: Ingredient[] = Array.isArray(recipe.ingredients)
    ? recipe.ingredients.map((ing: unknown) => {
        if (typeof ing === 'string') {
          return { text: ing }
        }
        // Already in correct format or has instruction field
        const ingObj = ing as Record<string, unknown>
        return {
          text: (ingObj.text as string) || (ingObj.instruction as string) || String(ing),
          amount: ingObj.amount as string | undefined,
          unit: ingObj.unit as string | undefined,
        }
      })
    : []

  // Transform steps - handle {instruction, ingredients} and {text, ingredients} formats
  const steps: Step[] = Array.isArray(recipe.steps)
    ? recipe.steps.map((step: unknown) => {
        if (typeof step === 'string') {
          return { text: step }
        }
        const stepObj = step as Record<string, unknown>
        return {
          // Backend uses 'instruction', frontend uses 'text'
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
  }
}

export type ExtractionMode = 'url' | 'photo' | 'youtube'

interface ExtractUrlParams {
  url: string
  language?: LanguageCode
}

interface ExtractPhotoParams {
  photos: string[] // Base64 encoded
  language?: LanguageCode
}

interface ExtractYoutubeParams {
  url: string
  language?: LanguageCode
}

type ExtractParams = ExtractUrlParams | ExtractPhotoParams | ExtractYoutubeParams

interface UseRecipeReturn {
  // State
  recipe: Recipe | null
  isLoading: boolean
  error: string | null
  mode: ExtractionMode | null
  sourceUrl: string | null

  // Actions
  extract: (mode: ExtractionMode, params: ExtractParams) => Promise<Recipe | null>
  translateRecipe: (targetLanguage: LanguageCode) => Promise<Recipe | null>
  setRecipe: (recipe: Recipe | null) => void
  reset: () => void
  clearError: () => void
}

export function useRecipe(): UseRecipeReturn {
  const { refreshQuota, decrementQuota, setAnonymousQuotaExhausted, isApiReady, language } = useApp()

  // State
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<ExtractionMode | null>(null)
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Reset all state
  const reset = useCallback(() => {
    setRecipe(null)
    setIsLoading(false)
    setError(null)
    setMode(null)
    setSourceUrl(null)
  }, [])

  // Extract recipe
  const extract = useCallback(
    async (
      extractMode: ExtractionMode,
      params: ExtractParams
    ): Promise<Recipe | null> => {
      if (!isApiReady) {
        setError('Please wait, initializing...')
        return null
      }

      setIsLoading(true)
      setError(null)
      setMode(extractMode)

      try {
        let response

        switch (extractMode) {
          case 'url': {
            const urlParams = params as ExtractUrlParams
            setSourceUrl(urlParams.url)
            response = await extractFromUrl(
              urlParams.url,
              urlParams.language || language
            )
            break
          }

          case 'photo': {
            const photoParams = params as ExtractPhotoParams
            setSourceUrl(null)
            response = await extractFromPhoto(
              photoParams.photos,
              photoParams.language || language
            )
            break
          }

          case 'youtube': {
            const youtubeParams = params as ExtractYoutubeParams
            setSourceUrl(youtubeParams.url)
            response = await extractFromYoutube(
              youtubeParams.url,
              youtubeParams.language || language
            )
            break
          }
        }

        const extractedRecipe = transformRecipe(response.recipe)
        setRecipe(extractedRecipe)

        // Update quota after successful extraction
        decrementQuota()
        await refreshQuota()

        return extractedRecipe
      } catch (err) {
        const message =
          err instanceof ApiRequestError
            ? err.message
            : 'Failed to extract recipe. Please try again.'

        // If quota error, update local state to reflect exhaustion
        if (err instanceof ApiRequestError && err.status === 403) {
          setAnonymousQuotaExhausted()
        }

        setError(message)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [isApiReady, language, decrementQuota, refreshQuota, setAnonymousQuotaExhausted]
  )

  // Translate recipe
  const translateRecipe = useCallback(
    async (targetLanguage: LanguageCode): Promise<Recipe | null> => {
      if (!recipe) {
        setError('No recipe to translate')
        return null
      }

      if (!isApiReady) {
        setError('Please wait, initializing...')
        return null
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await translateRecipeApi(recipe, targetLanguage)
        const translatedRecipe = transformRecipe(response.recipe)
        setRecipe(translatedRecipe)
        return translatedRecipe
      } catch (err) {
        const message =
          err instanceof ApiRequestError
            ? err.message
            : 'Failed to translate recipe. Please try again.'
        setError(message)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [recipe, isApiReady]
  )

  return {
    recipe,
    isLoading,
    error,
    mode,
    sourceUrl,
    extract,
    translateRecipe,
    setRecipe,
    reset,
    clearError,
  }
}

export default useRecipe
