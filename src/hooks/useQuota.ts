/**
 * useQuota Hook
 *
 * Provides quota information and utilities.
 * Wraps the quota state from AppContext with additional helpers.
 *
 * Usage:
 *   const { remaining, isUnlimited, canExtract, quotaDisplay } = useQuota()
 */

import { useMemo } from 'react'
import { useApp } from '../context/AppContext'

interface UseQuotaReturn {
  // State
  used: number
  limit: number
  remaining: number
  tier: string
  isUnlimited: boolean

  // Computed
  canExtract: boolean
  percentUsed: number
  quotaDisplay: string

  // Actions
  refresh: () => Promise<void>
}

export function useQuota(): UseQuotaReturn {
  const { quota, refreshQuota, t } = useApp()

  const isUnlimited = quota.limit === Infinity

  const canExtract = useMemo(() => {
    if (isUnlimited) return true
    return quota.remaining > 0
  }, [isUnlimited, quota.remaining])

  const percentUsed = useMemo(() => {
    if (isUnlimited) return 0
    if (quota.limit === 0) return 100
    return Math.round((quota.used / quota.limit) * 100)
  }, [isUnlimited, quota.used, quota.limit])

  const quotaDisplay = useMemo(() => {
    if (isUnlimited) {
      return t.unlimited
    }
    return `${quota.remaining}/${quota.limit}`
  }, [isUnlimited, quota.remaining, quota.limit, t.unlimited])

  return {
    used: quota.used,
    limit: quota.limit,
    remaining: quota.remaining,
    tier: quota.tier,
    isUnlimited,
    canExtract,
    percentUsed,
    quotaDisplay,
    refresh: refreshQuota,
  }
}

export default useQuota
