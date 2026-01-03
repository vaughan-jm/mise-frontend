import { useState, useCallback, useEffect } from 'react';
import api from '../services/api.js';
import { ENDPOINTS } from '../constants/index.js';

/**
 * Hook for managing saved recipes
 * @param {Object} options
 * @param {boolean} options.isAuthenticated - Whether user is logged in
 * @returns {Object} Saved recipes state and operations
 */
export function useSavedRecipes({ isAuthenticated }) {
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  /**
   * Load saved recipes from API
   */
  const loadSavedRecipes = useCallback(async () => {
    if (!isAuthenticated) {
      setSavedRecipes([]);
      return;
    }

    setLoading(true);
    const data = await api.get(ENDPOINTS.RECIPES.SAVED);
    if (data.recipes) {
      setSavedRecipes(data.recipes);
    }
    setLoading(false);
  }, [isAuthenticated]);

  /**
   * Save a recipe
   * @param {Object} recipe - Recipe to save
   */
  const saveRecipe = useCallback(async (recipe) => {
    if (!isAuthenticated || !recipe) return { error: 'Not authenticated' };

    setSaving(true);
    const data = await api.post(ENDPOINTS.RECIPES.SAVE, { recipe });

    if (data.error) {
      setSaving(false);
      return { error: data.error };
    }

    await loadSavedRecipes();
    setSaving(false);
    return { success: true };
  }, [isAuthenticated, loadSavedRecipes]);

  /**
   * Delete a saved recipe
   * @param {string} id - Recipe ID
   */
  const deleteRecipe = useCallback(async (id) => {
    if (!isAuthenticated) return { error: 'Not authenticated' };

    const data = await api.delete(ENDPOINTS.RECIPES.DELETE(id));

    if (data.error) {
      return { error: data.error };
    }

    await loadSavedRecipes();
    return { success: true };
  }, [isAuthenticated, loadSavedRecipes]);

  /**
   * Check if a recipe is saved (by title match)
   * @param {Object} recipe - Recipe to check
   * @returns {boolean}
   */
  const isRecipeSaved = useCallback((recipe) => {
    if (!recipe) return false;
    return savedRecipes.some(r => r.title === recipe.title);
  }, [savedRecipes]);

  // Load saved recipes when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      loadSavedRecipes();
    } else {
      setSavedRecipes([]);
    }
  }, [isAuthenticated, loadSavedRecipes]);

  return {
    savedRecipes,
    loading,
    saving,
    loadSavedRecipes,
    saveRecipe,
    deleteRecipe,
    isRecipeSaved,
  };
}

export default useSavedRecipes;
