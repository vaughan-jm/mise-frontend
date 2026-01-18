/**
 * Pare App
 *
 * Main application with routing.
 */

import { Routes, Route } from 'react-router-dom'
import {
  HomePage,
  RecipePage,
  CookbookPage,
  PricingPage,
  AccountPage,
  AdminPage,
  PrivacyPage,
  TermsPage,
  RefundPage,
  ContactPage,
  SharedRecipePage,
} from './pages'

// 404 Page
function NotFoundPage() {
  return (
    <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-bone mb-4">404</h1>
      <p className="text-ash mb-6">page not found</p>
      <a
        href="/"
        className="px-4 py-2 bg-sage text-obsidian rounded-lg font-medium lowercase hover:bg-sage-hover transition-colors"
      >
        go home
      </a>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/recipe" element={<RecipePage />} />
      <Route path="/r/:id" element={<SharedRecipePage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/refund" element={<RefundPage />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* Protected routes (Clerk handles auth UI) */}
      <Route path="/cookbook" element={<CookbookPage />} />
      <Route path="/account" element={<AccountPage />} />

      {/* Admin route */}
      <Route path="/admin" element={<AdminPage />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
