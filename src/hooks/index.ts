/**
 * Hooks barrel export
 *
 * Usage:
 *   import { useRecipe, useCookingMode, useWakeLock } from './hooks'
 */

export { useRecipe } from './useRecipe'
export type { ExtractionMode } from './useRecipe'

export { useQuota } from './useQuota'

export { useCookingMode } from './useCookingMode'
export type { CookingPhase } from './useCookingMode'

export { useSavedRecipes } from './useSavedRecipes'

export { useWakeLock } from './useWakeLock'

export { useHaptics } from './useHaptics'
export type { HapticPattern } from './useHaptics'

export { useFontSize } from './useFontSize'
export type { FontSize } from './useFontSize'

export { useOnboarding } from './useOnboarding'

export { useIngredientCategories } from './useIngredientCategories'
export type { IngredientCategory, IngredientGroup, GroupedIngredient } from './useIngredientCategories'
