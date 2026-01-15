/**
 * AccountPage
 *
 * User account page with Clerk UserProfile.
 */

import { SignedIn, SignedOut, SignInButton, UserProfile } from '@clerk/clerk-react'
import { useApp } from '../context/AppContext'
import { useQuota } from '../hooks'
import { PageLayout, Button, Card } from '../components'

// Sign in prompt
function SignInPrompt() {
  const { t } = useApp()

  return (
    <div className="text-center py-16 space-y-4">
      <div className="w-16 h-16 mx-auto rounded-full bg-gunmetal flex items-center justify-center">
        <svg className="w-8 h-8 text-ash" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-bone lowercase">sign in to view your account</h2>
      <p className="text-ash">manage your profile and subscription</p>
      <SignInButton mode="modal">
        <Button>{t.signIn}</Button>
      </SignInButton>
    </div>
  )
}

// Quota card
function QuotaCard() {
  const { t } = useApp()
  const { used, limit, remaining, tier, isUnlimited, percentUsed } = useQuota()

  return (
    <Card padding="lg" className="mb-6">
      <h3 className="text-sm font-bold text-ash uppercase mb-4">usage this month</h3>

      <div className="space-y-3">
        {/* Tier */}
        <div className="flex justify-between">
          <span className="text-ash">plan</span>
          <span className="text-bone font-medium capitalize">{tier}</span>
        </div>

        {/* Usage */}
        <div className="flex justify-between">
          <span className="text-ash">recipes used</span>
          <span className="text-bone font-medium">
            {isUnlimited ? used : `${used} / ${limit}`}
          </span>
        </div>

        {/* Remaining */}
        <div className="flex justify-between">
          <span className="text-ash">remaining</span>
          <span className="text-sage font-medium">
            {isUnlimited ? t.unlimited : remaining}
          </span>
        </div>

        {/* Progress bar (if not unlimited) */}
        {!isUnlimited && (
          <div className="pt-2">
            <div className="h-2 bg-obsidian rounded-full overflow-hidden">
              <div
                className="h-full bg-sage transition-all duration-300"
                style={{ width: `${Math.min(percentUsed, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Upgrade prompt */}
      {tier === 'free' && (
        <div className="mt-4 pt-4 border-t border-obsidian">
          <a href="/pricing" className="text-sm text-sage hover:underline">
            {t.upgradeForMore} →
          </a>
        </div>
      )}

      {/* Refund policy link */}
      <div className="mt-4 pt-4 border-t border-obsidian">
        <a href="/refund" className="text-sm text-ash hover:text-bone transition-colors">
          {t.refund} policy →
        </a>
      </div>
    </Card>
  )
}

export default function AccountPage() {
  const { t } = useApp()

  return (
    <PageLayout maxWidth="xl" className="px-4 py-6">
      <SignedOut>
        <SignInPrompt />
      </SignedOut>

      <SignedIn>
        {/* Header */}
        <h1 className="text-2xl font-bold text-bone lowercase mb-6">{t.account}</h1>

        {/* Quota overview */}
        <QuotaCard />

        {/* Clerk UserProfile */}
        <div className="bg-gunmetal rounded-lg overflow-hidden">
          <UserProfile
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'bg-transparent shadow-none',
                navbar: 'bg-obsidian',
                navbarButton: 'text-ash hover:text-bone',
                navbarButtonActive: 'text-sage',
                pageScrollBox: 'p-4',
                profileSection: 'border-obsidian',
                profileSectionTitle: 'text-bone',
                profileSectionContent: 'text-ash',
                formButtonPrimary: 'bg-sage hover:bg-sage-hover text-obsidian',
                formFieldLabel: 'text-ash',
                formFieldInput: 'bg-obsidian text-bone border-gunmetal',
              },
            }}
          />
        </div>
      </SignedIn>
    </PageLayout>
  )
}
