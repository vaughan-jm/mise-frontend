/**
 * RecipeHeader Component
 *
 * Compact header with thumbnail and title.
 *
 * Features:
 * - 64x64 thumbnail (URL/YouTube sources only)
 * - Title linked to source (URL sources only)
 * - Servings adjuster (± buttons)
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
}

export default function RecipeHeader({
  recipe,
  servings,
  onServingsChange,
}: RecipeHeaderProps) {
  // Show thumbnail only for URL/YouTube sources, not photo uploads
  const showThumbnail = recipe.imageUrl && recipe.source !== 'photo'

  return (
    <div className="space-y-3">
      {/* Row 1: Thumbnail + Title */}
      <div className="flex items-start gap-3">
        {/* Thumbnail - only for URL/YouTube sources */}
        {showThumbnail && (
          <img
            src={recipe.imageUrl}
            alt=""
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none'
            }}
          />
        )}

        {/* Title - linked for URL sources, plain text for photos */}
        <div className="flex-1 min-w-0 flex flex-col">
          {recipe.sourceUrl && recipe.source !== 'photo' ? (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sage transition-colors"
            >
              <h1 className="text-lg font-bold text-bone lowercase leading-tight line-clamp-2">
                {recipe.title}
              </h1>
            </a>
          ) : (
            <h1 className="text-lg font-bold text-bone lowercase leading-tight line-clamp-2">
              {recipe.title}
            </h1>
          )}

          {/* Servings adjuster - inside title div for alignment */}
          <div className="flex items-center gap-2 text-sm text-ash mt-2">
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
      </div>
    </div>
  )
}
