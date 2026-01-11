# Mise Frontend - Claude Instructions

## Project Overview
React frontend for Mise recipe extraction app. Single-page app that extracts recipes from URLs, photos, and YouTube videos.

## Tech Stack
- **Framework**: React 18 (single JSX file)
- **Build**: Vite 5
- **Styling**: Inline CSS-in-JS
- **API**: Fetch to backend REST API
- **Auth**: JWT tokens stored in localStorage

## Structure
```
src/
  Mise.jsx    # Entire app in one file (~1500 lines)
  main.jsx    # React entry point
```

## Common Commands
```bash
npm run dev      # Start dev server (localhost:5173)
npm run build    # Build for production
```

## Environment Variables
Set in Vercel dashboard:
- `VITE_API_URL` - Backend API URL
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID (optional)

## Deployment
- **Hosting**: Vercel (auto-deploys from GitHub)
- **Production URL**: https://mise-frontend-alpha.vercel.app
- **Backend**: https://mise-backend-v2-production.up.railway.app

## API Integration (v2 Backend)
Frontend was updated to work with v2 backend:
- Error format: `{ error: { code, message } }` - normalized via `normalizeError()`
- User object: calculates `recipesRemaining` from `recipesUsedThisMonth`
- Plans: transforms nested v2 format
- Checkout: uses `checkoutUrl` instead of `url`
- Ratings: `/api/feedback/rating` and `/api/feedback/ratings/summary`
- Save recipe: sends flat object (not nested)
- Saved recipes: transforms snake_case to camelCase

## Known Issues (TODO)
1. **Create account not working** - Returns INTERNAL_ERROR from backend
   - Likely database issue on Railway (need to check logs)

2. **Clean image not working** - Screenshots from Mac not processing
   - May be image format or size issue

3. **Cook tab missing ingredient amounts** - YouTube recipes show amounts in ingredients tab but not in cook tab
   - Check how `phase === 'cook'` renders ingredients in Mise.jsx
