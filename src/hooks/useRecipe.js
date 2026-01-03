import { useState, useCallback, useRef, useEffect } from 'react';
import api from '../services/api.js';
import { getFingerprint } from '../utils/fingerprint.js';
import { ENDPOINTS, MIN_SERVINGS, MAX_SERVINGS, PHASES } from '../constants/index.js';

/**
 * Hook for managing recipe state and operations
 */
export function useRecipe({ onRecipesRemainingChange, language }) {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [servings, setServings] = useState(null);
  const [recipeLanguage, setRecipeLanguage] = useState('en');

  // Cooking state
  const [phase, setPhase] = useState(PHASES.PREP);
  const [completedIngredients, setCompletedIngredients] = useState({});
  const [completedSteps, setCompletedSteps] = useState({});

  // Translation state
  const [translating, setTranslating] = useState(false);

  // Track active request for cancellation
  const abortControllerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const resetCookingState = useCallback(() => {
    setPhase(PHASES.PREP);
    setCompletedIngredients({});
    setCompletedSteps({});
  }, []);

  const resetAll = useCallback(() => {
    setRecipe(null);
    setServings(null);
    setError('');
    setRecipeLanguage('en');
    resetCookingState();
  }, [resetCookingState]);

  /**
   * Fetch recipe from URL
   */
  const fetchFromUrl = useCallback(async (url) => {
    if (!url?.trim()) {
      setError('Please paste a recipe URL');
      return { error: 'Please paste a recipe URL' };
    }

    // Cancel previous request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError('');
    setRecipe(null);
    resetCookingState();

    const data = await api.post(
      ENDPOINTS.RECIPE.CLEAN_URL,
      { url, language },
      {
        signal: abortControllerRef.current.signal,
        fingerprint: getFingerprint(),
      }
    );

    if (data.cancelled) {
      return { cancelled: true };
    }

    if (data.error) {
      setError(data.message || data.error);
      setLoading(false);
      return {
        error: data.error,
        requiresSignup: data.requiresSignup,
        upgrade: data.upgrade,
      };
    }

    setRecipe(data.recipe);
    setServings(data.recipe.servings);
    setRecipeLanguage(language);
    if (data.recipesRemaining !== undefined) {
      onRecipesRemainingChange?.(data.recipesRemaining);
    }
    setLoading(false);
    return { success: true, recipe: data.recipe };
  }, [language, onRecipesRemainingChange, resetCookingState]);

  /**
   * Process photos to extract recipe
   */
  const processPhotos = useCallback(async (photos) => {
    if (!photos?.length) {
      setError('Please add at least one photo');
      return { error: 'Please add at least one photo' };
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError('');
    setRecipe(null);
    resetCookingState();

    const data = await api.post(
      ENDPOINTS.RECIPE.CLEAN_PHOTO,
      { photos, language },
      {
        signal: abortControllerRef.current.signal,
        fingerprint: getFingerprint(),
      }
    );

    if (data.cancelled) {
      return { cancelled: true };
    }

    if (data.error) {
      setError(data.message || data.error);
      setLoading(false);
      return {
        error: data.error,
        requiresSignup: data.requiresSignup,
        upgrade: data.upgrade,
      };
    }

    setRecipe(data.recipe);
    setServings(data.recipe.servings);
    setRecipeLanguage(language);
    if (data.recipesRemaining !== undefined) {
      onRecipesRemainingChange?.(data.recipesRemaining);
    }
    setLoading(false);
    return { success: true, recipe: data.recipe };
  }, [language, onRecipesRemainingChange, resetCookingState]);

  /**
   * Process YouTube video to extract recipe
   */
  const processYoutube = useCallback(async (url) => {
    if (!url?.trim()) {
      setError('Please paste a YouTube URL');
      return { error: 'Please paste a YouTube URL' };
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError('');
    setRecipe(null);
    resetCookingState();

    const data = await api.post(
      ENDPOINTS.RECIPE.CLEAN_YOUTUBE,
      { url, language },
      {
        signal: abortControllerRef.current.signal,
        fingerprint: getFingerprint(),
      }
    );

    if (data.cancelled) {
      return { cancelled: true };
    }

    if (data.error) {
      setError(data.message || data.error);
      setLoading(false);
      return {
        error: data.error,
        requiresSignup: data.requiresSignup,
        upgrade: data.upgrade,
      };
    }

    setRecipe(data.recipe);
    setServings(data.recipe.servings);
    setRecipeLanguage(language);
    if (data.recipesRemaining !== undefined) {
      onRecipesRemainingChange?.(data.recipesRemaining);
    }
    setLoading(false);
    return { success: true, recipe: data.recipe };
  }, [language, onRecipesRemainingChange, resetCookingState]);

  /**
   * Translate recipe to target language
   */
  const translateRecipe = useCallback(async (targetLang) => {
    if (!recipe || translating) return { error: 'No recipe to translate' };

    setTranslating(true);

    const data = await api.post(ENDPOINTS.RECIPE.TRANSLATE, {
      recipe,
      targetLanguage: targetLang,
    });

    if (data.error) {
      setTranslating(false);
      return {
        error: data.error,
        upgradeRequired: data.error === 'upgrade_required',
      };
    }

    if (data.recipe) {
      setRecipe(data.recipe);
      setRecipeLanguage(targetLang);
    }

    setTranslating(false);
    return { success: true, recipe: data.recipe };
  }, [recipe, translating]);

  /**
   * Load a saved recipe
   */
  const loadRecipe = useCallback((savedRecipe) => {
    setRecipe(savedRecipe);
    setServings(savedRecipe.servings);
    resetCookingState();
  }, [resetCookingState]);

  /**
   * Adjust servings with bounds checking
   */
  const adjustServings = useCallback((newServings) => {
    if (newServings >= MIN_SERVINGS && newServings <= MAX_SERVINGS) {
      setServings(newServings);
    }
  }, []);

  /**
   * Scale ingredient quantities based on servings
   * Improved to avoid scaling non-quantity numbers (like temperatures)
   */
  const scaleIngredient = useCallback((ingredient) => {
    if (!recipe?.servings || servings === recipe.servings) return ingredient;

    const ratio = servings / recipe.servings;

    // Match numbers that appear to be quantities (not temperatures, times, etc.)
    // Avoid scaling: 350°F, 180°C, step numbers, etc.
    return ingredient.replace(
      /(?<!\d)(\d+\.?\d*)(?!\s*°|°|\s*degrees|\s*minutes?|\s*hours?|\s*mins?|\s*hrs?)/gi,
      (match) => {
        const num = parseFloat(match) * ratio;
        // Format nicely: no decimals for whole numbers, 1 decimal otherwise
        return num % 1 === 0 ? num.toString() : num.toFixed(1);
      }
    );
  }, [recipe?.servings, servings]);

  // Cooking progress helpers
  const completeIngredient = useCallback((index) => {
    setCompletedIngredients((prev) => ({ ...prev, [index]: true }));
  }, []);

  const completeStep = useCallback((index) => {
    setCompletedSteps((prev) => ({ ...prev, [index]: true }));
  }, []);

  const undoLastIngredient = useCallback(() => {
    const completed = Object.keys(completedIngredients)
      .filter((k) => completedIngredients[k])
      .map(Number);
    if (completed.length) {
      const last = Math.max(...completed);
      setCompletedIngredients((prev) => ({ ...prev, [last]: false }));
    }
  }, [completedIngredients]);

  const undoLastStep = useCallback(() => {
    const completed = Object.keys(completedSteps)
      .filter((k) => completedSteps[k])
      .map(Number);
    if (completed.length) {
      const last = Math.max(...completed);
      setCompletedSteps((prev) => ({ ...prev, [last]: false }));
    }
  }, [completedSteps]);

  // Computed values
  const ingredientsDone = Object.values(completedIngredients).filter(Boolean).length;
  const stepsDone = Object.values(completedSteps).filter(Boolean).length;
  const allIngredientsDone = recipe?.ingredients && ingredientsDone === recipe.ingredients.length;
  const allStepsDone = recipe?.steps && stepsDone === recipe.steps.length;

  const remainingIngredients = recipe?.ingredients
    ?.map((ing, i) => ({ ing, i }))
    .filter(({ i }) => !completedIngredients[i]) || [];

  const remainingSteps = recipe?.steps
    ?.map((step, i) => ({ step, i }))
    .filter(({ i }) => !completedSteps[i]) || [];

  // Auto-transition to cook phase when all ingredients done
  useEffect(() => {
    if (allIngredientsDone && phase === PHASES.PREP) {
      setPhase(PHASES.COOK);
    }
  }, [allIngredientsDone, phase]);

  return {
    // State
    recipe,
    loading,
    error,
    servings,
    recipeLanguage,
    translating,
    phase,
    completedIngredients,
    completedSteps,

    // Computed
    ingredientsDone,
    stepsDone,
    allIngredientsDone,
    allStepsDone,
    remainingIngredients,
    remainingSteps,
    isScaled: recipe?.servings && servings !== recipe.servings,

    // Actions
    fetchFromUrl,
    processPhotos,
    processYoutube,
    translateRecipe,
    loadRecipe,
    resetAll,
    resetCookingState,
    setPhase,
    adjustServings,
    scaleIngredient,
    completeIngredient,
    completeStep,
    undoLastIngredient,
    undoLastStep,
    setError,
  };
}

export default useRecipe;
