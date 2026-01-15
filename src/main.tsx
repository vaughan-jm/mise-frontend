import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import * as Sentry from '@sentry/react'
import posthog from 'posthog-js'
import { BrowserRouter } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { ToastProvider } from './components/ui/Toast'
import App from './App'
import './index.css'

// Environment variables
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined
const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined
const POSTHOG_HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined

// Initialize Sentry (error tracking)
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}

// Initialize PostHog (analytics)
if (POSTHOG_KEY && POSTHOG_HOST) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: true,
    autocapture: true,
  })
}

// Warn in development if Clerk key is missing
if (!CLERK_PUBLISHABLE_KEY) {
  console.warn(
    '[Pare] Missing VITE_CLERK_PUBLISHABLE_KEY. Auth will not work. ' +
    'Set this in your .env file or Vercel environment variables.'
  )
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <StrictMode>
    {CLERK_PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <BrowserRouter>
          <AppProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AppProvider>
        </BrowserRouter>
      </ClerkProvider>
    ) : (
      <BrowserRouter>
        <AppProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AppProvider>
      </BrowserRouter>
    )}
  </StrictMode>
)
