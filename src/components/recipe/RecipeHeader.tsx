/**
 * RecipeHeader Component
 *
 * Minimal header with large title and settings dropdown.
 *
 * Features:
 * - Large title (text-2xl md:text-3xl)
 * - Title linked to source (URL sources only)
 * - Settings dropdown with servings control
 * - Click-outside and Escape to close dropdown
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Recipe } from '../../lib/types'

// Icons
const GearIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
)

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
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close dropdown on Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  return (
    <div className="flex items-start justify-between gap-4">
      {/* Title - linked for URL sources, plain text for photos */}
      <div className="flex-1 min-w-0">
        {recipe.sourceUrl && recipe.source !== 'photo' ? (
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-sage transition-colors"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-bone lowercase leading-tight line-clamp-2">
              {recipe.title}
            </h1>
          </a>
        ) : (
          <h1 className="text-2xl md:text-3xl font-bold text-bone lowercase leading-tight line-clamp-2">
            {recipe.title}
          </h1>
        )}
      </div>

      {/* Settings dropdown */}
      <div className="relative flex-shrink-0">
        <button
          ref={buttonRef}
          onClick={toggleDropdown}
          className="w-10 h-10 flex items-center justify-center rounded-full text-ash hover:text-bone hover:bg-gunmetal transition-colors"
          aria-label="Recipe settings"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <GearIcon />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute top-full right-0 mt-2 w-48 bg-gunmetal border border-ash/20 rounded-xl shadow-xl shadow-black/40 p-4 z-40"
            >
              {/* Servings control */}
              <div>
                <span className="text-sm text-ash lowercase">servings</span>
                <div className="flex items-center justify-between mt-2">
                  <button
                    onClick={() => onServingsChange(Math.max(1, servings - 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-ash/30 text-ash hover:text-bone hover:border-ash/50 transition-colors"
                    aria-label="Decrease servings"
                  >
                    <MinusIcon />
                  </button>
                  <span className="text-bone font-medium text-lg">{servings}</span>
                  <button
                    onClick={() => onServingsChange(servings + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-ash/30 text-ash hover:text-bone hover:border-ash/50 transition-colors"
                    aria-label="Increase servings"
                  >
                    <PlusIcon />
                  </button>
                </div>
              </div>

              {/* Future: more settings can be added here */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
