/**
 * StepCard Component
 *
 * Pill-shaped step card for the cook phase.
 * Shows step instruction with indented ingredient block below.
 *
 * Features:
 * - Pill shape with step number
 * - Step instruction text
 * - Indented ingredient list with quantities (scaled)
 * - Supports tap and swipe to complete
 */

import SwipeableItem from '../ui/SwipeableItem'
import type { Step } from '../../lib/types'

interface StepCardProps {
  /** Display number (1-based index) */
  number: number
  /** Step data */
  step: Step
  /** Called when step is marked complete */
  onComplete: () => void
  /** Whether to show peek animation */
  showPeek?: boolean
  /** Called when peek animation completes */
  onPeekComplete?: () => void
  /** Servings multiplier for scaling ingredient quantities */
  servingsMultiplier?: number
  /** Disabled state */
  disabled?: boolean
}

/**
 * Reformat ingredient text from backend format to desired display format.
 * Backend: "450g / 1 lb sweet Italian sausage" or "1 / 1 egg"
 * Display: "1 lb sweet Italian sausage (450g)" or "1 egg"
 */
function reformatIngredientText(text: string): string {
  const slashMatch = text.match(/^([\d.]+\s*\w*)\s*\/\s*([\d.]+\s*\w*)\s+(.+)$/)

  if (!slashMatch || !slashMatch[1] || !slashMatch[2] || !slashMatch[3]) {
    return text
  }

  const metricPart = slashMatch[1]
  const imperialPart = slashMatch[2]
  const description = slashMatch[3]
  const metric = metricPart.trim()
  const imperial = imperialPart.trim()

  if (metric === imperial) {
    return `${imperial} ${description}`
  }

  const metricNumMatch = metric.match(/^([\d.]+)\s*(.*)$/)
  const imperialNumMatch = imperial.match(/^([\d.]+)\s*(.*)$/)

  if (metricNumMatch?.[1] && imperialNumMatch?.[1]) {
    const metricNum = parseFloat(metricNumMatch[1])
    const metricUnit = metricNumMatch[2] ?? ''
    const imperialNum = parseFloat(imperialNumMatch[1])
    const imperialUnit = imperialNumMatch[2] ?? ''

    if (metricNum === imperialNum && metricUnit === imperialUnit) {
      return `${imperial} ${description}`
    }

    if (!metricUnit && metricNum === imperialNum) {
      return `${imperial} ${description}`
    }
  }

  return `${imperial} ${description} (${metric})`
}

/**
 * Scale ingredient text based on servings multiplier
 */
function scaleIngredientText(text: string, multiplier: number): string {
  const reformatted = reformatIngredientText(text)

  if (multiplier === 1) return reformatted

  return reformatted.replace(
    /(\d+\.?\d*)\s*(lb|oz|g|kg|ml|l|cup|cups|tbsp|tsp|tablespoon|teaspoon|clove|cloves)?/gi,
    (_match, num, unit) => {
      const value = parseFloat(num)
      const scaled = value * multiplier
      const formatted = scaled % 1 === 0
        ? scaled.toString()
        : scaled.toFixed(1).replace(/\.0$/, '')

      return `${formatted}${unit ? ` ${unit}` : ''}`
    }
  )
}

export default function StepCard({
  number,
  step,
  onComplete,
  showPeek = false,
  onPeekComplete,
  servingsMultiplier = 1,
  disabled = false,
}: StepCardProps) {
  const hasIngredients = step.ingredients && step.ingredients.length > 0

  return (
    <SwipeableItem
      onComplete={onComplete}
      showPeek={showPeek}
      onPeekComplete={onPeekComplete}
      disabled={disabled}
      className="rounded-2xl"
    >
      <div
        className={`
          rounded-2xl
          border border-ash/30
          bg-gunmetal
          px-4 py-3
          transition-colors
          hover:border-sage/50
          ${disabled ? 'opacity-50' : ''}
        `}
      >
        {/* Step number + instruction */}
        <div className="flex items-start gap-3">
          {/* Number badge */}
          <span
            className="
              flex-shrink-0
              w-6 h-6
              rounded-full
              bg-sage/20
              text-sage
              text-sm font-medium
              flex items-center justify-center
              mt-0.5
            "
          >
            {number}
          </span>

          {/* Instruction text */}
          <p className="text-bone leading-relaxed text-lg">
            {step.text}
          </p>
        </div>

        {/* Indented ingredient list - with visual separation from instruction */}
        {hasIngredients && (
          <div className="mt-4 ml-9 pt-3 border-t border-ash/20 space-y-2">
            <p className="text-xs uppercase tracking-wide text-ash/50 mb-2">
              ingredients for this step:
            </p>
            {step.ingredients!.map((ingredient, idx) => (
              <p
                key={idx}
                className="text-sm text-ash leading-relaxed"
              >
                • {scaleIngredientText(ingredient, servingsMultiplier)}
              </p>
            ))}
          </div>
        )}
      </div>
    </SwipeableItem>
  )
}
