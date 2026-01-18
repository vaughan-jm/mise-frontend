/**
 * IngredientList Component
 *
 * Displays all ingredients in a single scrollable container,
 * grouped by category. Static list for reference during prep.
 *
 * Features:
 * - Category grouping (proteins, vegetables, spices, etc.)
 * - Quantity scaling based on servings multiplier
 * - Scrollable container with subtle styling
 */

import { useIngredientCategories } from '../../hooks/useIngredientCategories'
import type { Ingredient } from '../../lib/types'

interface IngredientListProps {
  /** All ingredients from the recipe */
  ingredients: Ingredient[]
  /** Servings multiplier for scaling quantities */
  servingsMultiplier?: number
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
  // The separator " / " must have spaces around it to distinguish from fractions like "3/4"
  // Examples:
  //   "450g / 1 lb sweet Italian sausage"
  //   "1 / 1 egg"
  //   "200g / 3/4 cup granulated sugar" (note: 3/4 is a fraction, not separator)
  //   "2 cloves / 2 cloves garlic, crushed"
  //   "2.5ml / 0.5 tsp fennel seeds"

  // Split on " / " (with spaces) to avoid matching fractions
  const separatorIndex = text.indexOf(' / ')
  if (separatorIndex === -1) {
    return text
  }

  const metricPart = text.slice(0, separatorIndex).trim()
  const rest = text.slice(separatorIndex + 3).trim() // Skip " / "

  // Find where the imperial quantity ends and description begins
  // Imperial can be: "1 lb", "3/4 cup", "1 1/2 cups", "2 cloves"
  const imperialMatch = rest.match(/^((?:\d+\s+)?\d+(?:\/\d+)?\s*(?:lb|oz|g|kg|ml|l|cup|cups|tbsp|tsp|tablespoon|teaspoon|clove|cloves)?)\s+(.+)$/i)

  if (!imperialMatch || !imperialMatch[1] || !imperialMatch[2]) {
    // Couldn't parse imperial, return as-is
    return text
  }

  const imperial = imperialMatch[1].trim()
  const description = imperialMatch[2].trim()

  // If metric and imperial are the same, just show one
  if (metricPart === imperial) {
    return `${imperial} ${description}`
  }

  // Check if they're numerically equivalent (simple numbers only)
  const metricNum = parseFloat(metricPart)
  const imperialNum = parseFloat(imperial)
  if (!isNaN(metricNum) && !isNaN(imperialNum) && metricNum === imperialNum) {
    return `${imperial} ${description}`
  }

  // Show imperial first, metric in parentheses
  return `${imperial} ${description} (${metricPart})`
}

/**
 * Format a scaled number - use fractions for imperial, decimals for metric
 */
function formatScaledQuantity(decimal: number, unit: string): string {
  // Metric units should use clean decimals, not fractions
  const isMetric = /^(g|kg|ml|l)$/i.test(unit)

  if (isMetric) {
    // Round to nearest whole number for metric
    return Math.round(decimal).toString()
  }

  // For imperial, try to use nice fractions
  const fractions: [number, string][] = [
    [0.125, '1/8'],
    [0.25, '1/4'],
    [0.333, '1/3'],
    [0.375, '3/8'],
    [0.5, '1/2'],
    [0.625, '5/8'],
    [0.667, '2/3'],
    [0.75, '3/4'],
    [0.875, '7/8'],
  ]

  const whole = Math.floor(decimal)
  const remainder = decimal - whole

  // If close to a whole number, return as whole
  if (remainder < 0.1 || remainder > 0.9) {
    return Math.round(decimal).toString()
  }

  // Check if remainder matches a common fraction
  for (const [value, fraction] of fractions) {
    if (Math.abs(remainder - value) < 0.08) {
      return whole > 0 ? `${whole} ${fraction}` : fraction
    }
  }

  // Fall back to decimal with 1 decimal place
  return decimal.toFixed(1).replace(/\.0$/, '')
}

/**
 * Parse a quantity that might be a fraction, mixed number, or decimal
 * Examples: "3/4", "1 1/2", "2.5", "3"
 */
function parseQuantity(str: string): number {
  str = str.trim()

  // Check for mixed number: "1 1/2"
  const mixedMatch = str.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixedMatch && mixedMatch[1] && mixedMatch[2] && mixedMatch[3]) {
    const whole = parseInt(mixedMatch[1], 10)
    const num = parseInt(mixedMatch[2], 10)
    const denom = parseInt(mixedMatch[3], 10)
    return whole + num / denom
  }

  // Check for fraction: "3/4"
  const fractionMatch = str.match(/^(\d+)\/(\d+)$/)
  if (fractionMatch && fractionMatch[1] && fractionMatch[2]) {
    const num = parseInt(fractionMatch[1], 10)
    const denom = parseInt(fractionMatch[2], 10)
    return num / denom
  }

  // Otherwise parse as decimal
  return parseFloat(str) || 0
}

/**
 * Scale ingredient text based on servings multiplier
 * Handles formats: "1 lb sausage", "3/4 cup flour", "1 1/2 cups sugar"
 */
function scaleIngredientText(text: string, multiplier: number): string {
  // First reformat from backend format
  const reformatted = reformatIngredientText(text)

  if (multiplier === 1) return reformatted

  // Units to match (must come after the quantity)
  const units = 'lb|oz|g|kg|ml|l|cup|cups|tbsp|tsp|tablespoon|teaspoon|clove|cloves'

  // Match: mixed number + unit, fraction + unit, or decimal + unit
  // Pattern: optional whole number, optional fraction, then unit
  const pattern = new RegExp(
    `(\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+\\.?\\d*)\\s*(${units})`,
    'gi'
  )

  return reformatted.replace(pattern, (_match, qty, unit) => {
    const value = parseQuantity(qty)
    const scaled = value * multiplier
    const formatted = formatScaledQuantity(scaled, unit)
    return `${formatted} ${unit}`
  })
}

export default function IngredientList({
  ingredients,
  servingsMultiplier = 1,
}: IngredientListProps) {
  const { groupedIngredients } = useIngredientCategories(ingredients)

  // Count total items
  const totalItems = ingredients.length

  return (
    <div className="rounded-2xl bg-gunmetal border border-ash/30 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-ash/30">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gunmetal px-4 py-3 flex items-center justify-between border-b border-ash/20">
        <span className="text-sm text-bone lowercase">prep list</span>
        <span className="text-xs text-ash bg-ash/10 rounded-full px-2 py-0.5">
          {totalItems} items
        </span>
      </div>

      {/* Ingredient groups */}
      <div className="px-4 pb-4">
        {groupedIngredients.map((group) => (
          <div key={group.category}>
            {/* Category label */}
            <div className="text-xs text-sage uppercase tracking-wider mt-4 mb-2">
              {group.label}
            </div>

            {/* Ingredient items */}
            <ul className="space-y-1">
              {group.items.map(({ ingredient, originalIndex }) => {
                const scaledText = scaleIngredientText(ingredient.text, servingsMultiplier)

                return (
                  <li
                    key={originalIndex}
                    className="flex items-start gap-2 text-sm text-bone leading-relaxed"
                  >
                    <span className="text-sage mt-0.5">•</span>
                    <span>{scaledText}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
