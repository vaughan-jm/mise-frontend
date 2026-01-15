/**
 * useHaptics Hook
 *
 * Provides haptic feedback using the Vibration API.
 * Gracefully handles browsers/devices that don't support vibration.
 *
 * Usage:
 *   const { vibrate, isSupported } = useHaptics()
 *   vibrate('light') // Subtle feedback on tap
 */

import { useCallback, useMemo } from 'react'

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error'

interface UseHapticsReturn {
  isSupported: boolean
  vibrate: (pattern?: HapticPattern) => void
}

// Vibration patterns in milliseconds
const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,           // Very subtle, almost imperceptible
  medium: 25,          // Noticeable but not intrusive
  heavy: 50,           // Strong feedback
  success: [10, 50, 10], // Double tap pattern
  error: [50, 30, 50],   // Warning pattern
}

export function useHaptics(): UseHapticsReturn {
  // Check if Vibration API is supported
  const isSupported = useMemo(() => {
    return 'vibrate' in navigator
  }, [])

  // Trigger vibration
  const vibrate = useCallback(
    (pattern: HapticPattern = 'light') => {
      if (!isSupported) return

      try {
        navigator.vibrate(patterns[pattern])
      } catch (err) {
        // Silently fail - vibration is a nice-to-have
        console.debug('[useHaptics] Vibration failed:', err)
      }
    },
    [isSupported]
  )

  return {
    isSupported,
    vibrate,
  }
}

export default useHaptics
