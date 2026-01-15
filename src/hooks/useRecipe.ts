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
import type { Recipe, LanguageCode } from '../lib/types'
import {
  extractFromUrl,
  extractFromPhoto,
  extractFromYoutube,
  translateRecipe as translateRecipeApi,
  ApiRequestError,
} from '../lib/api'
import { useApp } from '../context/AppContext'

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

        const extractedRecipe = response.recipe
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
        const translatedRecipe = response.recipe
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
