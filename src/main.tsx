import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import * as Sentry from '@sentry/react'
import posthog from 'posthog-js'
import { BrowserRouter } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { ToastProvider } from './components/ui/Toast'
import { env } from './config'
import App from './App'
import './index.css'

// Initialize Sentry (error tracking)
if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
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
if (env.POSTHOG_KEY && env.POSTHOG_HOST) {
  posthog.init(env.POSTHOG_KEY, {
    api_host: env.POSTHOG_HOST,
    capture_pageview: true,
    autocapture: true,
  })
}

// Warn in development if Clerk key is missing
if (!env.CLERK_PUBLISHABLE_KEY) {
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
    {env.CLERK_PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={env.CLERK_PUBLISHABLE_KEY}>
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
