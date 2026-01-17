/**
 * useIngredientCategories Hook
 *
 * Categorizes ingredients by type (proteins, vegetables, spices, etc.)
 * for organized display in the prep phase.
 *
 * Usage:
 *   const { groupedIngredients } = useIngredientCategories(ingredients)
 */

import { useMemo } from 'react'
import type { Ingredient } from '../lib/types'

export type IngredientCategory =
  | 'proteins'
  | 'vegetables'
  | 'spices'
  | 'dairy'
  | 'pantry'
  | 'liquids'
  | 'other'

export interface GroupedIngredient {
  ingredient: Ingredient
  originalIndex: number
}

export interface IngredientGroup {
  category: IngredientCategory
  label: string
  items: GroupedIngredient[]
}

// Keywords for each category (lowercase)
const categoryKeywords: Record<IngredientCategory, string[]> = {
  proteins: [
    'chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp', 'tofu', 'egg', 'eggs',
    'turkey', 'lamb', 'bacon', 'sausage', 'ham', 'tuna', 'cod', 'steak', 'ground',
    'prawn', 'lobster', 'crab', 'scallop', 'mussel', 'clam', 'duck', 'veal',
    'tempeh', 'seitan', 'anchov'
  ],
  vegetables: [
    'onion', 'garlic', 'tomato', 'pepper', 'carrot', 'celery', 'broccoli',
    'spinach', 'lettuce', 'mushroom', 'zucchini', 'potato', 'cucumber', 'cabbage',
    'kale', 'cauliflower', 'asparagus', 'bean', 'pea', 'corn', 'squash',
    'eggplant', 'artichoke', 'leek', 'shallot', 'scallion', 'radish', 'beet',
    'turnip', 'parsnip', 'fennel', 'bok choy', 'brussels', 'arugula', 'romaine'
  ],
  spices: [
    'salt', 'pepper', 'cumin', 'paprika', 'oregano', 'basil', 'thyme',
    'cinnamon', 'ginger', 'turmeric', 'chili', 'cayenne', 'nutmeg', 'clove',
    'cardamom', 'coriander', 'rosemary', 'sage', 'dill', 'parsley', 'mint',
    'bay leaf', 'saffron', 'curry', 'mustard seed', 'fennel seed', 'seasoning',
    'italian', 'cajun', 'herb'
  ],
  dairy: [
    'milk', 'cream', 'cheese', 'butter', 'yogurt', 'sour cream', 'ricotta',
    'mozzarella', 'parmesan', 'cheddar', 'feta', 'goat cheese', 'brie',
    'mascarpone', 'cottage', 'buttermilk', 'ghee', 'whipping cream'
  ],
  pantry: [
    'oil', 'vinegar', 'flour', 'sugar', 'rice', 'pasta', 'bread', 'stock',
    'broth', 'sauce', 'noodle', 'soy sauce', 'honey', 'maple', 'molasses',
    'ketchup', 'mayonnaise', 'mustard', 'worcestershire', 'spaghetti', 'penne',
    'lasagna', 'breadcrumb', 'panko', 'cornstarch', 'baking', 'yeast', 'oat',
    'quinoa', 'couscous', 'tortilla', 'wrap'
  ],
  liquids: [
    'water', 'wine', 'beer', 'juice', 'coconut milk', 'almond milk', 'lemon juice',
    'lime juice', 'orange juice', 'apple cider', 'sake', 'mirin', 'sherry',
    'rum', 'vodka', 'brandy', 'whiskey', 'bourbon'
  ],
  other: [] // Fallback category
}

// Display labels for categories
const categoryLabels: Record<IngredientCategory, string> = {
  proteins: 'proteins',
  vegetables: 'vegetables',
  spices: 'spices & herbs',
  dairy: 'dairy',
  pantry: 'pantry',
  liquids: 'liquids',
  other: 'other'
}

// Category display order
const categoryOrder: IngredientCategory[] = [
  'proteins',
  'vegetables',
  'dairy',
  'pantry',
  'spices',
  'liquids',
  'other'
]

/**
 * Categorize a single ingredient based on its text
 */
function categorizeIngredient(text: string): IngredientCategory {
  const lowerText = text.toLowerCase()

  for (const [category, keywords] of Object.entries(categoryKeywords) as [IngredientCategory, string[]][]) {
    if (category === 'other') continue
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category
    }
  }

  return 'other'
}

interface UseIngredientCategoriesReturn {
  /** Ingredients grouped by category, in display order */
  groupedIngredients: IngredientGroup[]
  /** Get the category for a specific ingredient index */
  getCategoryForIndex: (index: number) => IngredientCategory
  /** Total number of categories with items */
  categoryCount: number
}

export function useIngredientCategories(
  ingredients: Ingredient[]
): UseIngredientCategoriesReturn {
  const result = useMemo(() => {
    // Map each ingredient to its category
    const categorized = ingredients.map((ingredient, originalIndex) => ({
      ingredient,
      originalIndex,
      category: categorizeIngredient(ingredient.text)
    }))

    // Group by category
    const groups = new Map<IngredientCategory, GroupedIngredient[]>()

    for (const item of categorized) {
      const existing = groups.get(item.category) || []
      existing.push({
        ingredient: item.ingredient,
        originalIndex: item.originalIndex
      })
      groups.set(item.category, existing)
    }

    // Build ordered array of groups
    const groupedIngredients: IngredientGroup[] = []

    for (const category of categoryOrder) {
      const items = groups.get(category)
      if (items && items.length > 0) {
        groupedIngredients.push({
          category,
          label: categoryLabels[category],
          items
        })
      }
    }

    // Create index-to-category lookup
    const indexToCategory = new Map<number, IngredientCategory>()
    for (const item of categorized) {
      indexToCategory.set(item.originalIndex, item.category)
    }

    return {
      groupedIngredients,
      indexToCategory,
      categoryCount: groupedIngredients.length
    }
  }, [ingredients])

  const getCategoryForIndex = (index: number): IngredientCategory => {
    return result.indexToCategory.get(index) || 'other'
  }

  return {
    groupedIngredients: result.groupedIngredients,
    getCategoryForIndex,
    categoryCount: result.categoryCount
  }
}

export default useIngredientCategories
