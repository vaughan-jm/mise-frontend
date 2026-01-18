/**
 * IngredientList Component
 *
 * Displays all ingredients as a simple list that scrolls with the page.
 * Supports both legacy string format and structured ingredient data.
 *
 * Features:
 * - Quantity scaling based on servings multiplier
 * - Automatic imperial/metric formatting
 * - Falls back to legacy format if structured data unavailable
 */

import { useIngredientCategories } from '../../hooks/useIngredientCategories'
import type { Ingredient, StructuredIngredient } from '../../lib/types'

interface IngredientListProps {
  /** All ingredients from the recipe (legacy format) */
  ingredients: Ingredient[]
  /** Structured ingredients with metric/imperial (new format) */
  ingredientsStructured?: StructuredIngredient[]
  /** Servings multiplier for scaling quantities */
  servingsMultiplier?: number
}

// ============================================================================
// Structured Ingredient Formatting (new format)
// ============================================================================

/**
 * Format a number nicely for display
 * - Fractions for imperial (1/4, 1/2, 3/4, etc.)
 * - Whole numbers for metric
 */
function formatNumber(value: number, unit: string): string {
  // Metric units should use clean decimals
  const isMetric = /^(g|kg|ml|l)$/i.test(unit)

  if (isMetric) {
    // Round to nearest whole number for metric
    if (value >= 10) {
      return Math.round(value).toString()
    }
    // For small values, keep one decimal
    return value.toFixed(1).replace(/\.0$/, '')
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

  const whole = Math.floor(value)
  const remainder = value - whole

  // If close to a whole number, return as whole
  if (remainder < 0.1 || remainder > 0.9) {
    return Math.round(value).toString()
  }

  // Check if remainder matches a common fraction
  for (const [fracValue, fraction] of fractions) {
    if (Math.abs(remainder - fracValue) < 0.08) {
      return whole > 0 ? `${whole} ${fraction}` : fraction
    }
  }

  // Fall back to decimal with 1 decimal place
  return value.toFixed(1).replace(/\.0$/, '')
}

/**
 * Format a structured ingredient for display
 * Shows original system first, converted in parentheses
 * e.g., "1 lb chicken breast (450g)" or "450g chicken breast (1 lb)"
 */
function formatStructuredIngredient(
  ingredient: StructuredIngredient,
  multiplier: number = 1
): string {
  const { text, metric, imperial, originalSystem } = ingredient

  // Scale values
  const scaledMetric = metric
    ? { value: metric.value * multiplier, unit: metric.unit }
    : null
  const scaledImperial = imperial
    ? { value: imperial.value * multiplier, unit: imperial.unit }
    : null

  // No measurements
  if (!scaledMetric && !scaledImperial) {
    return text
  }

  // Only one measurement system available
  if (!scaledMetric && scaledImperial) {
    return `${formatNumber(scaledImperial.value, scaledImperial.unit)} ${scaledImperial.unit} ${text}`
  }
  if (scaledMetric && !scaledImperial) {
    return `${formatNumber(scaledMetric.value, scaledMetric.unit)}${scaledMetric.unit} ${text}`
  }

  // Both systems available - show original first, converted in parentheses
  // Default to imperial if originalSystem not specified (backward compatibility)
  const showMetricFirst = originalSystem === 'metric'

  if (showMetricFirst) {
    return `${formatNumber(scaledMetric!.value, scaledMetric!.unit)}${scaledMetric!.unit} ${text} (${formatNumber(scaledImperial!.value, scaledImperial!.unit)} ${scaledImperial!.unit})`
  } else {
    return `${formatNumber(scaledImperial!.value, scaledImperial!.unit)} ${scaledImperial!.unit} ${text} (${formatNumber(scaledMetric!.value, scaledMetric!.unit)}${scaledMetric!.unit})`
  }
}

// ============================================================================
// Legacy Ingredient Formatting (old format)
// ============================================================================

/**
 * Reformat ingredient text from backend format to desired display format.
 * Backend: "450g / 1 lb sweet Italian sausage" or "1 / 1 egg"
 * Display: "1 lb sweet Italian sausage (450g)" or "1 egg"
 */
function reformatIngredientText(text: string): string {
  // Split on " / " (with spaces) to avoid matching fractions
  const separatorIndex = text.indexOf(' / ')
  if (separatorIndex === -1) {
    return text
  }

  const metricPart = text.slice(0, separatorIndex).trim()
  const rest = text.slice(separatorIndex + 3).trim()

  // Find where the imperial quantity ends and description begins
  const imperialMatch = rest.match(/^((?:\d+\s+)?\d+(?:\/\d+)?\s*(?:lb|oz|g|kg|ml|l|cup|cups|tbsp|tsp|tablespoon|teaspoon|clove|cloves)?)\s+(.+)$/i)

  if (!imperialMatch || !imperialMatch[1] || !imperialMatch[2]) {
    return text
  }

  const imperial = imperialMatch[1].trim()
  const description = imperialMatch[2].trim()

  // If metric and imperial are the same, just show one
  if (metricPart === imperial) {
    return `${imperial} ${description}`
  }

  // Check if they're numerically equivalent
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
  const isMetric = /^(g|kg|ml|l)$/i.test(unit)

  if (isMetric) {
    return Math.round(decimal).toString()
  }

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

  if (remainder < 0.1 || remainder > 0.9) {
    return Math.round(decimal).toString()
  }

  for (const [value, fraction] of fractions) {
    if (Math.abs(remainder - value) < 0.08) {
      return whole > 0 ? `${whole} ${fraction}` : fraction
    }
  }

  return decimal.toFixed(1).replace(/\.0$/, '')
}

/**
 * Parse a quantity that might be a fraction, mixed number, or decimal
 */
function parseQuantity(str: string): number {
  str = str.trim()

  const mixedMatch = str.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixedMatch && mixedMatch[1] && mixedMatch[2] && mixedMatch[3]) {
    const whole = parseInt(mixedMatch[1], 10)
    const num = parseInt(mixedMatch[2], 10)
    const denom = parseInt(mixedMatch[3], 10)
    return whole + num / denom
  }

  const fractionMatch = str.match(/^(\d+)\/(\d+)$/)
  if (fractionMatch && fractionMatch[1] && fractionMatch[2]) {
    const num = parseInt(fractionMatch[1], 10)
    const denom = parseInt(fractionMatch[2], 10)
    return num / denom
  }

  return parseFloat(str) || 0
}

/**
 * Scale ingredient text based on servings multiplier
 */
function scaleIngredientText(text: string, multiplier: number): string {
  const reformatted = reformatIngredientText(text)

  if (multiplier === 1) return reformatted

  const units = 'lb|oz|g|kg|ml|l|cup|cups|tbsp|tsp|tablespoon|teaspoon|clove|cloves'
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

// ============================================================================
// Component
// ============================================================================

export default function IngredientList({
  ingredients,
  ingredientsStructured,
  servingsMultiplier = 1,
}: IngredientListProps) {
  // Use structured ingredients if available
  if (ingredientsStructured && ingredientsStructured.length > 0) {
    return (
      <ul className="space-y-1">
        {ingredientsStructured.map((ingredient, index) => (
          <li
            key={index}
            className="flex items-start gap-2 text-base text-bone leading-relaxed"
          >
            <span className="text-sage mt-0.5">•</span>
            <span>{formatStructuredIngredient(ingredient, servingsMultiplier)}</span>
          </li>
        ))}
      </ul>
    )
  }

  // Fall back to legacy format with category grouping
  const { groupedIngredients } = useIngredientCategories(ingredients)

  return (
    <ul className="space-y-1">
      {groupedIngredients.flatMap((group) =>
        group.items.map(({ ingredient, originalIndex }) => {
          const scaledText = scaleIngredientText(ingredient.text, servingsMultiplier)

          return (
            <li
              key={originalIndex}
              className="flex items-start gap-2 text-base text-bone leading-relaxed"
            >
              <span className="text-sage mt-0.5">•</span>
              <span>{scaledText}</span>
            </li>
          )
        })
      )}
    </ul>
  )
}
