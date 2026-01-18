/**
 * Groups structured ingredients by:
 * 1. Section (visible headers) - "For the marinade", etc.
 * 2. Category (invisible sorting) - proteins, vegetables, etc.
 */
import { useMemo } from 'react'
import type { StructuredIngredient } from '../lib/types'

interface GroupedSection {
  section: string | null  // null = no header
  ingredients: StructuredIngredient[]
}

const CATEGORY_ORDER = [
  'proteins', 'vegetables', 'dairy', 'pantry', 'spices', 'liquids', 'other'
]

function getCategoryIndex(category: string): number {
  const index = CATEGORY_ORDER.indexOf(category)
  return index === -1 ? CATEGORY_ORDER.length : index
}

export function useStructuredIngredientGroups(
  ingredients: StructuredIngredient[]
): GroupedSection[] {
  return useMemo(() => {
    // Group by section
    const sectionMap = new Map<string | null, StructuredIngredient[]>()

    for (const ingredient of ingredients) {
      const section = ingredient.section ?? null
      const existing = sectionMap.get(section) || []
      existing.push(ingredient)
      sectionMap.set(section, existing)
    }

    const sections: GroupedSection[] = []

    // Default section (no header) first
    if (sectionMap.has(null)) {
      const items = sectionMap.get(null)!
      items.sort((a, b) => getCategoryIndex(a.category) - getCategoryIndex(b.category))
      sections.push({ section: null, ingredients: items })
      sectionMap.delete(null)
    }

    // Named sections in order of appearance
    for (const [section, items] of sectionMap) {
      items.sort((a, b) => getCategoryIndex(a.category) - getCategoryIndex(b.category))
      sections.push({ section, ingredients: items })
    }

    return sections
  }, [ingredients])
}
