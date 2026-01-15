/**
 * Pare App Context
 *
 * Global state management for:
 * - Language (persisted to localStorage)
 * - User/Auth state (from Clerk + backend)
 * - Quota tracking
 *
 * Usage:
 *   const { language, setLanguage, user, quota, t } = useApp()
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import type { LanguageCode, User, QuotaInfo, SubscriptionTier } from '../lib/types'
import {
  getTranslations,
  translate,
  detectLanguage,
  type Translations,
} from '../lib/translations'
import { setAuthTokenGetter, getMe, syncUser } from '../lib/api'
import { getRecipeLimit, anonymousLimits } from '../config/pricing'

// LocalStorage keys
const LANGUAGE_KEY = 'pare-language'
const ANONYMOUS_USED_KEY = 'pare-anonymous-used'

// Context value type
interface AppContextValue {
  // Language
  language: LanguageCode
  setLanguage: (lang: LanguageCode) => void
  t: Translations
  translate: (key: keyof Translations, vars?: Record<string, string | number>) => string

  // Auth & User
  isSignedIn: boolean
  isLoading: boolean
  user: User | null
  refreshUser: () => Promise<void>

  // Quota
  quota: QuotaInfo
  decrementQuota: () => void
  refreshQuota: () => Promise<void>
  setAnonymousQuotaExhausted: () => void

  // API readiness (auth token ready)
  isApiReady: boolean
}

// Default context value
const defaultContext: AppContextValue = {
  language: 'en',
  setLanguage: () => {},
  t: getTranslations('en'),
  translate: (key) => String(key),
  isSignedIn: false,
  isLoading: true,
  user: null,
  refreshUser: async () => {},
  quota: { used: 0, limit: 10, remaining: 10, tier: 'free' },
  decrementQuota: () => {},
  refreshQuota: async () => {},
  setAnonymousQuotaExhausted: () => {},
  isApiReady: false,
}

const AppContext = createContext<AppContextValue>(defaultContext)

// Hook to use the app context
export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

// Provider component
interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  // Clerk hooks
  const { getToken, isLoaded: isAuthLoaded, isSignedIn: clerkSignedIn } = useAuth()
  useUser() // Keep hook active for Clerk state

  // Language state (persisted)
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    // Try to load from localStorage, fallback to browser detection
    const saved = localStorage.getItem(LANGUAGE_KEY)
    if (saved && ['en', 'es', 'fr', 'pt', 'zh', 'hi', 'ar'].includes(saved)) {
      return saved as LanguageCode
    }
    return detectLanguage()
  })

  // User state (from backend)
  const [user, setUser] = useState<User | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [isApiReady, setIsApiReady] = useState(false)

  // Anonymous quota tracking (for optimistic updates)
  const [anonymousUsed, setAnonymousUsed] = useState(() => {
    return parseInt(localStorage.getItem(ANONYMOUS_USED_KEY) || '0', 10)
  })

  // Set language with persistence
  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang)
    localStorage.setItem(LANGUAGE_KEY, lang)
  }, [])

  // Get translations for current language
  const t = useMemo(() => getTranslations(language), [language])

  // Translate function with variable substitution
  const translateFn = useCallback(
    (key: keyof Translations, vars?: Record<string, string | number>) => {
      return translate(language, key, vars)
    },
    [language]
  )

  // Set up auth token getter for API client
  useEffect(() => {
    if (isAuthLoaded) {
      setAuthTokenGetter(getToken)
      setIsApiReady(true)
    }
  }, [isAuthLoaded, getToken])

  // Fetch/sync user from backend when signed in
  const refreshUser = useCallback(async () => {
    if (!isApiReady || !clerkSignedIn) {
      setUser(null)
      setIsLoadingUser(false)
      return
    }

    setIsLoadingUser(true)
    try {
      // First try to get existing user
      const backendUser = await getMe()
      setUser(backendUser)
    } catch {
      // If user doesn't exist, sync/create them
      try {
        const syncedUser = await syncUser()
        setUser(syncedUser)
      } catch (syncError) {
        console.error('Failed to sync user:', syncError)
        setUser(null)
      }
    } finally {
      setIsLoadingUser(false)
    }
  }, [isApiReady, clerkSignedIn])

  // Fetch user when auth state changes
  useEffect(() => {
    if (isApiReady) {
      refreshUser()
    }
  }, [isApiReady, clerkSignedIn, refreshUser])

  // Compute quota info
  const quota = useMemo((): QuotaInfo => {
    if (user) {
      // Logged in user
      const tier = user.subscription as SubscriptionTier
      const limit = getRecipeLimit(tier)

      if (limit === 'unlimited') {
        return {
          used: user.recipesUsedThisMonth,
          limit: Infinity,
          remaining: Infinity,
          tier,
        }
      }

      return {
        used: user.recipesUsedThisMonth,
        limit,
        remaining: Math.max(0, limit - user.recipesUsedThisMonth),
        tier,
      }
    }

    // Anonymous user
    return {
      used: anonymousUsed,
      limit: anonymousLimits.recipesTotal,
      remaining: Math.max(0, anonymousLimits.recipesTotal - anonymousUsed),
      tier: 'free',
    }
  }, [user, anonymousUsed])

  // Decrement quota locally (optimistic update)
  const decrementQuota = useCallback(() => {
    if (!user) {
      // Anonymous user - update local storage
      const newUsed = anonymousUsed + 1
      setAnonymousUsed(newUsed)
      localStorage.setItem(ANONYMOUS_USED_KEY, String(newUsed))
    }
    // For logged-in users, quota is updated via refreshQuota after API call
  }, [user, anonymousUsed])

  // Refresh quota from server
  const refreshQuota = useCallback(async () => {
    if (user && isApiReady) {
      try {
        const freshUser = await getMe()
        setUser(freshUser)
      } catch (error) {
        console.error('Failed to refresh quota:', error)
      }
    }
  }, [user, isApiReady])

  // Mark anonymous quota as exhausted (when backend returns 403)
  const setAnonymousQuotaExhausted = useCallback(() => {
    if (!user) {
      const exhausted = anonymousLimits.recipesTotal
      setAnonymousUsed(exhausted)
      localStorage.setItem(ANONYMOUS_USED_KEY, String(exhausted))
    }
  }, [user])

  // Combine loading states
  const isLoading = !isAuthLoaded || isLoadingUser

  // Context value
  const value = useMemo<AppContextValue>(
    () => ({
      language,
      setLanguage,
      t,
      translate: translateFn,
      isSignedIn: clerkSignedIn ?? false,
      isLoading,
      user,
      refreshUser,
      quota,
      decrementQuota,
      refreshQuota,
      setAnonymousQuotaExhausted,
      isApiReady,
    }),
    [
      language,
      setLanguage,
      t,
      translateFn,
      clerkSignedIn,
      isLoading,
      user,
      refreshUser,
      quota,
      decrementQuota,
      refreshQuota,
      setAnonymousQuotaExhausted,
      isApiReady,
    ]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export default AppContext
