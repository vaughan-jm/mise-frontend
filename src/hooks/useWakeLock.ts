/**
 * useWakeLock Hook
 *
 * Keeps the screen awake during cooking using the Screen Wake Lock API.
 * Gracefully handles browsers that don't support the API.
 *
 * Usage:
 *   const { isActive, isSupported, request, release } = useWakeLock()
 */

import { useState, useCallback, useEffect, useRef } from 'react'

interface UseWakeLockReturn {
  isActive: boolean
  isSupported: boolean
  request: () => Promise<boolean>
  release: () => Promise<void>
}

export function useWakeLock(): UseWakeLockReturn {
  const [isActive, setIsActive] = useState(false)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  // Check if Wake Lock API is supported
  const isSupported = 'wakeLock' in navigator

  // Request wake lock
  const request = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('[useWakeLock] Wake Lock API not supported')
      return false
    }

    // Already active
    if (wakeLockRef.current) {
      return true
    }

    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen')

      // Handle release (e.g., when tab becomes hidden)
      wakeLockRef.current.addEventListener('release', () => {
        setIsActive(false)
        wakeLockRef.current = null
      })

      setIsActive(true)
      return true
    } catch (err) {
      console.warn('[useWakeLock] Failed to acquire wake lock:', err)
      return false
    }
  }, [isSupported])

  // Release wake lock
  const release = useCallback(async (): Promise<void> => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release()
      } catch (err) {
        console.warn('[useWakeLock] Failed to release wake lock:', err)
      }
      wakeLockRef.current = null
      setIsActive(false)
    }
  }, [])

  // Re-acquire wake lock when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isActive && !wakeLockRef.current) {
        await request()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isActive, request])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {})
      }
    }
  }, [])

  return {
    isActive,
    isSupported,
    request,
    release,
  }
}

export default useWakeLock
