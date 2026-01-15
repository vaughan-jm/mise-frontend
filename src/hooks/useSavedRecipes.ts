/**
 * useSavedRecipes Hook
 *
 * Manages saved recipes CRUD operations.
 *
 * Usage:
 *   const { recipes, save, remove, isLoading, error } = useSavedRecipes()
 */

import { useState, useCallback, useEffect } from 'react'
import type { Recipe, SavedRecipe } from '../lib/types'
import {
  getSavedRecipes,
  saveRecipe,
  deleteRecipe,
  ApiRequestError,
} from '../lib/api'
import { useApp } from '../context/AppContext'

interface UseSavedRecipesReturn {
  // State
  recipes: SavedRecipe[]
  isLoading: boolean
  isSaving: boolean
  error: string | null

  // Actions
  fetch: () => Promise<void>
  save: (recipe: Recipe, source?: string, sourceUrl?: string) => Promise<SavedRecipe | null>
  remove: (recipeId: string) => Promise<boolean>
  clearError: () => void
}

export function useSavedRecipes(): UseSavedRecipesReturn {
  const { isSignedIn, isApiReady } = useApp()

  // State
  const [recipes, setRecipes] = useState<SavedRecipe[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Fetch saved recipes
  const fetch = useCallback(async () => {
    if (!isSignedIn || !isApiReady) {
      setRecipes([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const savedRecipes = await getSavedRecipes()
      setRecipes(savedRecipes)
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : 'Failed to load saved recipes'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [isSignedIn, isApiReady])

  // Save a recipe
  const save = useCallback(
    async (
      recipe: Recipe,
      source?: string,
      sourceUrl?: string
    ): Promise<SavedRecipe | null> => {
      if (!isSignedIn) {
        setError('Please sign in to save recipes')
        return null
      }

      if (!isApiReady) {
        setError('Please wait, initializing...')
        return null
      }

      setIsSaving(true)
      setError(null)

      try {
        const savedRecipe = await saveRecipe(recipe, source, sourceUrl)
        // Add to local state
        setRecipes((prev) => [savedRecipe, ...prev])
        return savedRecipe
      } catch (err) {
        const message =
          err instanceof ApiRequestError
            ? err.message
            : 'Failed to save recipe'
        setError(message)
        return null
      } finally {
        setIsSaving(false)
      }
    },
    [isSignedIn, isApiReady]
  )

  // Delete a recipe
  const remove = useCallback(
    async (recipeId: string): Promise<boolean> => {
      if (!isSignedIn || !isApiReady) {
        setError('Please sign in to delete recipes')
        return false
      }

      setError(null)

      try {
        await deleteRecipe(recipeId)
        // Remove from local state
        setRecipes((prev) => prev.filter((r) => r.id !== recipeId))
        return true
      } catch (err) {
        const message =
          err instanceof ApiRequestError
            ? err.message
            : 'Failed to delete recipe'
        setError(message)
        return false
      }
    },
    [isSignedIn, isApiReady]
  )

  // Auto-fetch when signed in
  useEffect(() => {
    if (isSignedIn && isApiReady) {
      fetch()
    }
  }, [isSignedIn, isApiReady, fetch])

  return {
    recipes,
    isLoading,
    isSaving,
    error,
    fetch,
    save,
    remove,
    clearError,
  }
}

export default useSavedRecipes
