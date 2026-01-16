# Pare Frontend - Claude Instructions

## Project Overview
React frontend for Pare recipe extraction app. Single-page app that extracts recipes from URLs, photos, and YouTube videos.

## Tech Stack
- **Framework**: React 18 with TypeScript
- **Build**: Vite 5
- **Styling**: Tailwind CSS with custom design tokens
- **Routing**: React Router v7
- **Auth**: Clerk (@clerk/clerk-react)
- **Error Tracking**: Sentry (@sentry/react)
- **Analytics**: PostHog (posthog-js)
- **Testing**: Playwright

## Structure
```
src/
├── main.tsx              # Entry point (Clerk, Sentry, PostHog init)
├── App.tsx               # Main routing
├── index.css             # Global styles + Tailwind
├── config/
│   ├── theme.ts          # Design tokens
│   ├── pricing.ts        # Pricing tiers and Stripe IDs
│   └── content.ts        # Content strings
├── lib/
│   ├── api.ts            # API client with Clerk auth
│   ├── types.ts          # TypeScript types
│   └── translations.ts   # i18n (7 languages)
├── context/
│   └── AppContext.tsx    # Global state (language, auth, quota)
├── hooks/
│   ├── useRecipe.ts      # Recipe extraction logic
│   ├── useQuota.ts       # Quota helpers
│   ├── useSavedRecipes.ts
│   ├── useCookingMode.ts
│   ├── useHaptics.ts
│   └── useWakeLock.ts
├── pages/
│   ├── HomePage.tsx      # Main input
│   ├── RecipePage.tsx    # Recipe display + cooking mode
│   ├── PricingPage.tsx   # Subscription plans
│   ├── AccountPage.tsx   # User account
│   ├── CookbookPage.tsx  # Saved recipes
│   ├── AdminPage.tsx     # Admin dashboard
│   ├── ContactPage.tsx   # Contact form
│   ├── PrivacyPage.tsx   # Privacy policy
│   ├── TermsPage.tsx     # Terms of service
│   └── RefundPage.tsx    # Refund policy
└── components/
    ├── layout/           # Header, Footer, PageLayout
    └── ui/               # Button, Card, Input, Modal, etc.
```

## Common Commands
```bash
npm run dev      # Start dev server (localhost:5173)
npm run build    # Build for production
npm test         # Run Playwright tests
npm run test:ui  # Run tests with Playwright UI
npm run typecheck # Type check
```

## Environment Variables
Set in Vercel dashboard or `.env`:
- `VITE_API_URL` - Backend API URL
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `VITE_SENTRY_DSN` - Sentry error tracking DSN
- `VITE_PUBLIC_POSTHOG_KEY` - PostHog analytics API key
- `VITE_PUBLIC_POSTHOG_HOST` - PostHog host URL
- `VITE_STRIPE_*_PRICE_ID` - Stripe price IDs

## Architecture Pattern
```
Pages → Hooks → API Client → Context
```
- **Pages**: Full page components with routing
- **Hooks**: Reusable logic (useRecipe, useQuota, etc.)
- **API Client**: Typed fetch wrapper with Clerk auth
- **Context**: Global state for language, auth, quota

## Code Conventions
- All environment variables should be imported from `src/config.ts`
- Error classes in `src/lib/errors.ts`
- TypeScript strict mode enabled
- Use existing components from `src/components/ui/`

## Authentication (Clerk)
- `ClerkProvider` wraps the app in `main.tsx`
- `useUser()` and `useAuth()` hooks for auth state
- Tokens automatically included in API calls via `getToken()`

## Deployment
- **Hosting**: Vercel (auto-deploys from GitHub)
- **Production URL**: https://mise-frontend-alpha.vercel.app
- **Backend**: https://mise-backend-v2-production.up.railway.app

## Key Features
- Recipe extraction: URL, photo, YouTube video inputs
- Multi-language: EN, ES, FR, PT, ZH, HI, AR
- Cooking mode: Prep/Cook phases with ingredient/step tracking
- Saved recipes: Requires login
- Pricing/subscriptions: Free (3/month), Basic (20/month), Pro (unlimited)

## Testing
Playwright E2E tests in `tests/`:
- App loading and UI elements
- Language switching
- Input mode switching
- Footer links and legal pages
- Contact form

Run: `npm test`
