/**
 * IngredientList Component
 *
 * Displays ingredients grouped by category with smooth removal animations.
 * Uses AnimatePresence with layout animations for seamless transitions.
 *
 * Features:
 * - Category grouping (proteins, vegetables, spices, etc.)
 * - Subtle inline category labels
 * - Smooth removal when items complete (no page jump)
 * - First-time peek animation support
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useIngredientCategories } from '../../hooks/useIngredientCategories'
import IngredientCard from './IngredientCard'
import type { Ingredient } from '../../lib/types'

interface IngredientListProps {
  /** All ingredients from the recipe */
  ingredients: Ingredient[]
  /** Set of completed ingredient indices */
  completedIndices: Set<number>
  /** Called when an ingredient is marked complete */
  onComplete: (index: number) => void
  /** Servings multiplier for scaling quantities */
  servingsMultiplier?: number
  /** Whether to show peek animation on first item */
  showPeek?: boolean
  /** Called when peek animation completes */
  onPeekComplete?: () => void
  /** Font size class from useFontSize hook */
  fontSizeClass?: string
}

/**
 * Reformat ingredient text from backend format to desired display format.
 * Backend: "450g / 1 lb sweet Italian sausage" or "1 / 1 egg"
 * Display: "1 lb sweet Italian sausage (450g)" or "1 egg"
 *
 * Rules:
 * - Original (imperial) comes first, metric in parentheses
 * - If values are identical (e.g., "1 / 1"), only show once
 * - If metric is just a plain number matching imperial, don't show parenthetical
 * - Handle cases with and without units
 */
function reformatIngredientText(text: string): string {
  // Pattern: "[metric qty+unit] / [imperial qty+unit] [description]"
  // Examples:
  //   "450g / 1 lb sweet Italian sausage"
  //   "1 / 1 egg"
  //   "1 / 1 medium onion, minced"
  //   "2 cloves / 2 cloves garlic, crushed"
  //   "2.5ml / 0.5 tsp fennel seeds"

  const slashMatch = text.match(/^([\d.]+\s*\w*)\s*\/\s*([\d.]+\s*\w*)\s+(.+)$/)

  if (!slashMatch || !slashMatch[1] || !slashMatch[2] || !slashMatch[3]) {
    // No slash format detected, return as-is
    return text
  }

  const metricPart = slashMatch[1]
  const imperialPart = slashMatch[2]
  const description = slashMatch[3]
  const metric = metricPart.trim()
  const imperial = imperialPart.trim()

  // If metric and imperial are the same (e.g., "1 / 1"), just show one
  if (metric === imperial) {
    return `${imperial} ${description}`
  }

  // Check if they're numerically equivalent
  const metricNumMatch = metric.match(/^([\d.]+)\s*(.*)$/)
  const imperialNumMatch = imperial.match(/^([\d.]+)\s*(.*)$/)

  if (metricNumMatch?.[1] && imperialNumMatch?.[1]) {
    const metricNum = parseFloat(metricNumMatch[1])
    const metricUnit = metricNumMatch[2] ?? ''
    const imperialNum = parseFloat(imperialNumMatch[1])
    const imperialUnit = imperialNumMatch[2] ?? ''

    // If same number and same unit, just show once
    if (metricNum === imperialNum && metricUnit === imperialUnit) {
      return `${imperial} ${description}`
    }

    // If metric is just a plain number with no unit and equals imperial number,
    // don't show the parenthetical (e.g., "1 / 1 medium onion" -> "1 medium onion")
    if (!metricUnit && metricNum === imperialNum) {
      return `${imperial} ${description}`
    }
  }

  // Show imperial first, metric in parentheses
  return `${imperial} ${description} (${metric})`
}

/**
 * Scale ingredient text based on servings multiplier
 * Handles format: "1 lb sweet Italian sausage (450g)"
 */
function scaleIngredientText(text: string, multiplier: number): string {
  // First reformat from backend format
  const reformatted = reformatIngredientText(text)

  if (multiplier === 1) return reformatted

  // Match numbers (including those in parentheses for metric)
  return reformatted.replace(
    /(\d+\.?\d*)\s*(lb|oz|g|kg|ml|l|cup|cups|tbsp|tsp|tablespoon|teaspoon|clove|cloves)?/gi,
    (_match, num, unit) => {
      const value = parseFloat(num)
      const scaled = value * multiplier

      // Format nicely - avoid excessive decimals
      const formatted = scaled % 1 === 0
        ? scaled.toString()
        : scaled.toFixed(1).replace(/\.0$/, '')

      return `${formatted}${unit ? ` ${unit}` : ''}`
    }
  )
}

export default function IngredientList({
  ingredients,
  completedIndices,
  onComplete,
  servingsMultiplier = 1,
  showPeek = false,
  onPeekComplete,
  fontSizeClass = 'text-base',
}: IngredientListProps) {
  const { groupedIngredients } = useIngredientCategories(ingredients)

  // Track if we've shown peek (only on first incomplete item)
  let peekShown = false

  return (
    <div className="space-y-4">
      {groupedIngredients.map((group) => {
        // Filter out completed items from this group
        const incompleteItems = group.items.filter(
          ({ originalIndex }) => !completedIndices.has(originalIndex)
        )

        // Skip empty groups
        if (incompleteItems.length === 0) return null

        return (
          <div key={group.category}>
            {/* Category label */}
            <div className="text-xs text-ash/60 uppercase tracking-wider pl-4 py-2">
              {group.label}
            </div>

            {/* Items with AnimatePresence for smooth removal */}
            <AnimatePresence mode="popLayout">
              {incompleteItems.map(({ ingredient, originalIndex }) => {
                // Determine if this item should show peek
                const shouldShowPeek = showPeek && !peekShown
                if (shouldShowPeek) peekShown = true

                // Scale the ingredient text
                const scaledText = scaleIngredientText(ingredient.text, servingsMultiplier)

                return (
                  <motion.div
                    key={originalIndex}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{
                      opacity: 0,
                      height: 0,
                      marginBottom: 0,
                      transition: { duration: 0.2 }
                    }}
                    transition={{
                      layout: { duration: 0.25, ease: 'easeOut' },
                      opacity: { duration: 0.15 }
                    }}
                    className="mb-2"
                  >
                    <IngredientCard
                      number={originalIndex + 1}
                      text={scaledText}
                      onComplete={() => onComplete(originalIndex)}
                      showPeek={shouldShowPeek}
                      onPeekComplete={onPeekComplete}
                      fontSizeClass={fontSizeClass}
                    />
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )
      })}

      {/* Empty state when all ingredients are complete */}
      {groupedIngredients.every(g =>
        g.items.every(({ originalIndex }) => completedIndices.has(originalIndex))
      ) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-sage"
        >
          <p className="text-lg lowercase">all ingredients gathered</p>
          <p className="text-sm text-ash mt-1">ready to cook</p>
        </motion.div>
      )}
    </div>
  )
}
