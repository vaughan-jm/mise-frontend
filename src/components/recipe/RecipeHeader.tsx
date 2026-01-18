/**
 * RecipeHeader Component
 *
 * Compact single-row header for recipe page.
 *
 * Features:
 * - Recipe title
 * - Servings adjuster (± buttons)
 * - Font size toggle (A/A+)
 * - Save button or upgrade link
 */

import type { Recipe } from '../../lib/types'

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

interface RecipeHeaderProps {
  recipe: Recipe
  servings: number
  onServingsChange: (servings: number) => void
  fontSizeLabel: string
  onFontSizeToggle: () => void
  canSave: boolean
  isSaved: boolean
  isSaving: boolean
  onSave: () => void
  showUpgradeLink?: boolean
}

export default function RecipeHeader({
  recipe,
  servings,
  onServingsChange,
  fontSizeLabel,
  onFontSizeToggle,
  canSave,
  isSaved,
  isSaving,
  onSave,
  showUpgradeLink = false,
}: RecipeHeaderProps) {
  return (
    <div className="space-y-3">
      {/* Row 1: Title + Actions */}
      <div className="flex items-start justify-between gap-3">
        {/* Title */}
        <h1 className="text-xl font-bold text-bone lowercase leading-tight flex-1 min-w-0">
          {recipe.title}
        </h1>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Font size toggle */}
          <button
            onClick={onFontSizeToggle}
            className="
              px-2 py-1
              text-xs font-medium
              text-ash hover:text-bone
              border border-ash/30 rounded
              transition-colors
            "
            aria-label="Toggle font size"
          >
            {fontSizeLabel}
          </button>

          {/* Save or upgrade */}
          {showUpgradeLink ? (
            <a
              href="/pricing"
              className="
                px-3 py-1
                text-sm
                text-sage
                border border-sage/30 rounded-full
                hover:bg-sage/10
                transition-colors
                lowercase
              "
            >
              upgrade to save
            </a>
          ) : canSave ? (
            <button
              onClick={onSave}
              disabled={isSaving || isSaved}
              className={`
                px-3 py-1
                text-sm
                border rounded-full
                transition-colors
                lowercase
                ${isSaved
                  ? 'text-sage border-sage/30 cursor-default'
                  : 'text-bone border-ash/30 hover:border-sage/50'}
                ${isSaving ? 'opacity-50' : ''}
              `}
            >
              {isSaved ? 'saved' : isSaving ? 'saving...' : 'save'}
            </button>
          ) : null}

        </div>
      </div>

      {/* Row 2: Meta info */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ash">
        {/* Servings adjuster */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onServingsChange(Math.max(1, servings - 1))}
            className="w-6 h-6 flex items-center justify-center rounded-full border border-ash/30 text-ash hover:text-bone hover:border-ash/50 transition-colors"
            aria-label="Decrease servings"
          >
            <MinusIcon />
          </button>
          <span className="text-bone font-medium w-4 text-center">{servings}</span>
          <button
            onClick={() => onServingsChange(servings + 1)}
            className="w-6 h-6 flex items-center justify-center rounded-full border border-ash/30 text-ash hover:text-bone hover:border-ash/50 transition-colors"
            aria-label="Increase servings"
          >
            <PlusIcon />
          </button>
        </div>

      </div>

      {/* Source link */}
      {recipe.sourceUrl && (
        <p className="text-xs text-ash/60">
          source:{' '}
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sage hover:underline"
          >
            {recipe.source || 'original'}
          </a>
        </p>
      )}
    </div>
  )
}
