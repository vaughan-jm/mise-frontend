/**
 * useFontSize Hook
 *
 * Font size accessibility control for cooking mode.
 * Persists preference to localStorage.
 *
 * Usage:
 *   const { fontSize, setFontSize, fontSizeClass, cycle } = useFontSize()
 */

import { useState, useCallback, useEffect, useMemo } from 'react'

export type FontSize = 'normal' | 'large' | 'xlarge'

const STORAGE_KEY = 'pare_font_size'

// Tailwind classes for each size
const fontSizeClasses: Record<FontSize, string> = {
  normal: 'text-base',
  large: 'text-lg',
  xlarge: 'text-xl'
}

// Display labels for each size
const fontSizeLabels: Record<FontSize, string> = {
  normal: 'A',
  large: 'A+',
  xlarge: 'A++'
}

// Order for cycling
const fontSizeOrder: FontSize[] = ['normal', 'large', 'xlarge']

interface UseFontSizeReturn {
  /** Current font size setting */
  fontSize: FontSize
  /** Set font size directly */
  setFontSize: (size: FontSize) => void
  /** Tailwind class for current size */
  fontSizeClass: string
  /** Display label for current size */
  fontSizeLabel: string
  /** Cycle to next size (normal → large → xlarge → normal) */
  cycle: () => void
}

export function useFontSize(): UseFontSizeReturn {
  // Initialize from localStorage or default to 'normal'
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    if (typeof window === 'undefined') return 'normal'

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && fontSizeOrder.includes(stored as FontSize)) {
      return stored as FontSize
    }
    return 'normal'
  })

  // Persist to localStorage when changed
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, fontSize)
  }, [fontSize])

  // Set font size
  const setFontSize = useCallback((size: FontSize) => {
    setFontSizeState(size)
  }, [])

  // Cycle through sizes
  const cycle = useCallback(() => {
    setFontSizeState((current) => {
      const currentIndex = fontSizeOrder.indexOf(current)
      const nextIndex = (currentIndex + 1) % fontSizeOrder.length
      return fontSizeOrder[nextIndex] ?? 'normal'
    })
  }, [])

  // Memoized values
  const fontSizeClass = useMemo(() => fontSizeClasses[fontSize], [fontSize])
  const fontSizeLabel = useMemo(() => fontSizeLabels[fontSize], [fontSize])

  return {
    fontSize,
    setFontSize,
    fontSizeClass,
    fontSizeLabel,
    cycle
  }
}

export default useFontSize
