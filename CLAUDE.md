# Mise Frontend - Claude Instructions

## Project Overview
React frontend for Mise recipe extraction app. Single-page app that extracts recipes from URLs, photos, and YouTube videos.

## Tech Stack
- **Framework**: React 18
- **Build**: Vite 5
- **Styling**: Inline CSS-in-JS
- **API**: Fetch to backend REST API
- **Auth**: Clerk (@clerk/clerk-react)
- **Testing**: Playwright

## Structure
```
src/
  Mise.jsx           # Main app component (~1500 lines)
  main.jsx           # React entry point with ClerkProvider
  lib/
    api.js           # API client, utilities, constants
    translations.js  # UI translations (7 languages)
tests/
  app.spec.js        # UI and navigation tests (13 tests)
  recipe.spec.js     # Input mode tests (8 tests)
```

## Common Commands
```bash
npm run dev      # Start dev server (localhost:5173)
npm run build    # Build for production
npm test         # Run Playwright tests
npm run test:ui  # Run tests with Playwright UI
```

## Environment Variables
Set in Vercel dashboard:
- `VITE_API_URL` - Backend API URL
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk publishable key

## Deployment
- **Hosting**: Vercel (auto-deploys from GitHub)
- **Production URL**: https://mise-frontend-alpha.vercel.app
- **Backend**: https://mise-backend-v2-production.up.railway.app

## Authentication (Clerk)
Auth is handled by Clerk. Key components:
- `ClerkProvider` wraps the app in `main.jsx`
- `useUser()` and `useAuth()` hooks for auth state
- `SignIn`, `SignUp` components for auth modals
- `UserButton` for logged-in user menu
- Tokens are automatically included in API calls via `getToken()`

## Key Features
- **Recipe extraction**: URL, photo, YouTube video inputs
- **Multi-language**: EN, ES, FR, PT, ZH, HI, AR
- **Cooking mode**: Prep/Cook phases with ingredient/step tracking
- **Saved recipes**: Requires login
- **Pricing/subscriptions**: Free (3/month), Basic (20/month), Pro (unlimited)
- **Legal pages**: Privacy, Terms, Refund policies
- **Contact form**: Sends to backend which emails via Resend

## API Integration (v2 Backend)
- Error format: `{ error: { code, message } }` - normalized via `normalizeError()` in api.js
- User object: calculates `recipesRemaining` from `recipesUsedThisMonth`
- Checkout: uses `checkoutUrl` from response

## Testing
21 Playwright E2E tests covering:
- App loading and UI elements
- Language switching
- Input mode switching (URL/Photo/Video)
- Footer links and legal pages
- Contact form

Run tests: `npm test`

## Deployment Notes
- Vercel auto-deploys from GitHub
- Environment variables set in Vercel dashboard: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_API_URL`
- Using Clerk **test keys** (production keys require custom domain)

### To go live with Clerk production keys:
1. Connect a custom domain to Vercel
2. Create Clerk production instance
3. Update Vercel env vars with `pk_live_` key
