/**
 * RecipeHeader Component
 *
 * Centered title with inline controls.
 *
 * Features:
 * - Centered title in Title Case (max 2 lines)
 * - Title linked to source (URL sources only)
 * - Inline servings control with +/- buttons
 * - Prep/cook phase toggle
 */

import type { Recipe } from '../../lib/types'
import PillToggle from '../ui/PillToggle'

// Icons
const MinusIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
)

const PlusIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

// Convert to Title Case
function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
  )
}

interface RecipeHeaderProps {
  recipe: Recipe
  servings: number
  onServingsChange: (servings: number) => void
  phase: 'prep' | 'cook'
  onPhaseChange: (phase: string) => void
}

export default function RecipeHeader({
  recipe,
  servings,
  onServingsChange,
  phase,
  onPhaseChange,
}: RecipeHeaderProps) {
  const title = toTitleCase(recipe.title)

  return (
    <div className="space-y-4">
      {/* Title - centered, title case */}
      <div className="text-center">
        {recipe.sourceUrl && recipe.source !== 'photo' ? (
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-sage transition-colors"
          >
            <h1 className="text-xl md:text-2xl font-bold text-bone leading-tight line-clamp-2">
              {title}
            </h1>
          </a>
        ) : (
          <h1 className="text-xl md:text-2xl font-bold text-bone leading-tight line-clamp-2">
            {title}
          </h1>
        )}
      </div>

      {/* Controls row: servings left, toggle right */}
      <div className="flex items-center justify-between">
        {/* Servings: −  servings 4  + */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onServingsChange(Math.max(1, servings - 1))}
            className="w-6 h-6 flex items-center justify-center rounded-full text-ash/50 hover:text-ash hover:bg-gunmetal transition-colors"
            aria-label="Decrease servings"
          >
            <MinusIcon />
          </button>
          <span className="text-sm">
            <span className="text-ash">servings </span>
            <span className="text-bone font-medium">{servings}</span>
          </span>
          <button
            onClick={() => onServingsChange(servings + 1)}
            className="w-6 h-6 flex items-center justify-center rounded-full text-ash/50 hover:text-ash hover:bg-gunmetal transition-colors"
            aria-label="Increase servings"
          >
            <PlusIcon />
          </button>
        </div>

        {/* Phase toggle */}
        <PillToggle
          options={[
            { value: 'prep', label: 'prep' },
            { value: 'cook', label: 'cook' },
          ]}
          value={phase}
          onChange={onPhaseChange}
        />
      </div>
    </div>
  )
}
