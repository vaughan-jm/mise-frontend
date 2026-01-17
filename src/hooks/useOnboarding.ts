/**
 * useOnboarding Hook
 *
 * Tracks first-time user state for onboarding animations.
 * Persists to localStorage so animations only play once.
 *
 * Usage:
 *   const { hasSeenPeek, markPeekSeen } = useOnboarding()
 */

import { useState, useCallback } from 'react'

const STORAGE_KEY = 'pare_onboarding_peek_shown'

interface UseOnboardingReturn {
  /** Whether user has already seen the peek animation */
  hasSeenPeek: boolean
  /** Mark the peek animation as seen (call after animation plays) */
  markPeekSeen: () => void
  /** Reset onboarding state (for testing) */
  reset: () => void
}

export function useOnboarding(): UseOnboardingReturn {
  // Initialize from localStorage
  const [hasSeenPeek, setHasSeenPeek] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false

    return localStorage.getItem(STORAGE_KEY) === 'true'
  })

  // Mark peek as seen
  const markPeekSeen = useCallback(() => {
    setHasSeenPeek(true)
    localStorage.setItem(STORAGE_KEY, 'true')
  }, [])

  // Reset for testing
  const reset = useCallback(() => {
    setHasSeenPeek(false)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return {
    hasSeenPeek,
    markPeekSeen,
    reset
  }
}

export default useOnboarding
