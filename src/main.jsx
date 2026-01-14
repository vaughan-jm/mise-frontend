import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import * as Sentry from '@sentry/react'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import Mise from './Mise.jsx'

// ============================================================================
// Environment Variables
// ============================================================================

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN
const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST

// ============================================================================
// Sentry Initialization
// ============================================================================

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,

    // Capture 100% of errors in dev, 10% in production
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,

    // Don't send expected errors
    beforeSend(event) {
      // Filter out known/expected errors if needed
      return event
    },
  })
  console.log('Sentry initialized')
}

// ============================================================================
// PostHog Initialization
// ============================================================================

if (POSTHOG_KEY && POSTHOG_HOST) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // Capture pageviews automatically
    capture_pageview: true,
    // Capture clicks automatically
    autocapture: true,
    // Respect Do Not Track
    respect_dnt: true,
  })
  console.log('PostHog initialized')
}

// ============================================================================
// Warnings for missing config
// ============================================================================

if (!CLERK_PUBLISHABLE_KEY) {
  console.warn('Missing VITE_CLERK_PUBLISHABLE_KEY - auth will not work')
}

if (!SENTRY_DSN) {
  console.warn('Missing VITE_SENTRY_DSN - error tracking disabled')
}

if (!POSTHOG_KEY || !POSTHOG_HOST) {
  console.warn('Missing PostHog config - analytics disabled')
}

// ============================================================================
// App Render
// ============================================================================

const App = () => (
  <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
    <Mise />
  </ClerkProvider>
)

// Wrap with Sentry error boundary if available
const AppWithErrorBoundary = SENTRY_DSN
  ? Sentry.withProfiler(App)
  : App

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PostHogProvider client={posthog}>
      <AppWithErrorBoundary />
    </PostHogProvider>
  </React.StrictMode>,
)
