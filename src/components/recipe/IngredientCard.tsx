/**
 * IngredientCard Component
 *
 * Pill-shaped ingredient card for the prep phase.
 * Supports tap and swipe to complete.
 *
 * Features:
 * - Pill shape matching homepage aesthetic
 * - Number badge on left
 * - Scaled ingredient text (adjusts with servings)
 * - Unit display: "1 lb sausage (450g)" format
 */

import SwipeableItem from '../ui/SwipeableItem'

interface IngredientCardProps {
  /** Display number (1-based index) */
  number: number
  /** Ingredient text to display */
  text: string
  /** Called when ingredient is marked complete */
  onComplete: () => void
  /** Whether to show peek animation (first-time onboarding) */
  showPeek?: boolean
  /** Called when peek animation completes */
  onPeekComplete?: () => void
  /** Font size class (from useFontSize hook) */
  fontSizeClass?: string
  /** Disabled state */
  disabled?: boolean
}

export default function IngredientCard({
  number,
  text,
  onComplete,
  showPeek = false,
  onPeekComplete,
  fontSizeClass = 'text-base',
  disabled = false,
}: IngredientCardProps) {
  return (
    <SwipeableItem
      onComplete={onComplete}
      showPeek={showPeek}
      onPeekComplete={onPeekComplete}
      disabled={disabled}
      className="rounded-full"
    >
      <div
        className={`
          h-[48px] rounded-full
          border border-ash/30
          bg-gunmetal
          px-4
          flex items-center gap-3
          transition-colors
          hover:border-sage/50
          ${disabled ? 'opacity-50' : ''}
        `}
      >
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
          "
        >
          {number}
        </span>

        {/* Ingredient text */}
        <span className={`text-bone leading-tight ${fontSizeClass}`}>
          {text}
        </span>
      </div>
    </SwipeableItem>
  )
}
