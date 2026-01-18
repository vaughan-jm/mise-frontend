/**
 * PricingPage
 *
 * Subscription plans with monthly/yearly toggle.
 */

import { useState, useCallback } from 'react'
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { useQuota } from '../hooks'
import { PageLayout, Button, Card, TabSwitcher } from '../components'
import { useToast } from '../components/ui/Toast'
import { pricingTiers, formatPrice, getYearlySavings } from '../config/pricing'
import { createCheckout } from '../lib/api'
import type { Tab } from '../components/ui/TabSwitcher'

type BillingPeriod = 'monthly' | 'yearly'

const billingTabs: Tab<BillingPeriod>[] = [
  { id: 'monthly', label: 'monthly' },
  { id: 'yearly', label: 'yearly' },
]

// Check icon
const CheckIcon = () => (
  <svg className="w-4 h-4 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

export default function PricingPage() {
  const { t } = useApp()
  const { tier: currentTier } = useQuota()
  const { showToast } = useToast()

  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')
  const [loadingTier, setLoadingTier] = useState<string | null>(null)

  // Handle checkout
  const handleCheckout = useCallback(async (tierId: string, priceId: string | undefined) => {
    if (!priceId) {
      showToast('Unable to start checkout', 'error')
      return
    }

    setLoadingTier(tierId)
    try {
      const checkoutUrl = await createCheckout(priceId)
      window.location.href = checkoutUrl
    } catch (error) {
      showToast('Failed to start checkout. Please try again.', 'error')
    } finally {
      setLoadingTier(null)
    }
  }, [showToast])

  return (
    <PageLayout maxWidth="xl" className="px-4 py-8">
      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-2xl font-bold text-bone lowercase">{t.pricing}</h1>
        <p className="text-ash">choose a plan that works for you</p>

        {/* Billing toggle */}
        <div className="flex justify-center">
          <TabSwitcher
            tabs={billingTabs}
            activeTab={billingPeriod}
            onChange={setBillingPeriod}
            size="sm"
          />
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {pricingTiers.map((tier, index) => {
          const isCurrentTier = tier.id === currentTier
          const isFree = tier.id === 'free'
          const isPro = tier.id === 'pro'
          const yearlySavings = getYearlySavings(tier)

          const price = billingPeriod === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice
          const priceId = billingPeriod === 'monthly'
            ? tier.stripePriceIdMonthly
            : tier.stripePriceIdYearly

          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                padding="lg"
                className={`relative h-full flex flex-col ${
                  isPro ? 'ring-2 ring-sage' : ''
                }`}
              >
                {/* Popular badge */}
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-sage text-obsidian text-xs font-bold rounded-full">
                    {t.mostPopular}
                  </div>
                )}

                {/* Tier name */}
                <h2 className="text-xl font-bold text-bone lowercase mb-2">
                  {tier.name}
                </h2>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-3xl font-bold text-bone">
                    {formatPrice(price)}
                  </span>
                  {!isFree && (
                    <span className="text-ash">
                      {billingPeriod === 'monthly' ? t.perMonth : t.perYear}
                    </span>
                  )}
                </div>

                {/* Yearly savings badge */}
                {billingPeriod === 'yearly' && yearlySavings > 0 && (
                  <div className="mb-4">
                    <span className="px-2 py-1 bg-sage/20 text-sage text-xs rounded">
                      {t.savePercent.replace('{percent}', String(yearlySavings))}
                    </span>
                  </div>
                )}

                {/* Recipe limit */}
                <p className="text-sm text-ash mb-4">
                  {tier.recipesPerMonth === 'unlimited'
                    ? t.unlimitedRecipes
                    : t.recipesPerMonth.replace('{count}', String(tier.recipesPerMonth))}
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-6 flex-1">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ash">
                      <CheckIcon />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                {isCurrentTier ? (
                  <Button variant="secondary" fullWidth disabled>
                    {t.currentPlan}
                  </Button>
                ) : isFree ? (
                  <SignedOut>
                    <SignInButton mode="modal">
                      <Button variant="secondary" fullWidth>
                        {t.signIn}
                      </Button>
                    </SignInButton>
                  </SignedOut>
                ) : (
                  <>
                    <SignedIn>
                      <Button
                        fullWidth
                        variant={isPro ? 'primary' : 'secondary'}
                        isLoading={loadingTier === tier.id}
                        onClick={() => handleCheckout(tier.id, priceId)}
                      >
                        {t.subscribe}
                      </Button>
                    </SignedIn>
                    <SignedOut>
                      <SignInButton mode="modal">
                        <Button fullWidth variant={isPro ? 'primary' : 'secondary'}>
                          {t.signIn} to {t.subscribe}
                        </Button>
                      </SignInButton>
                    </SignedOut>
                  </>
                )}
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* FAQ or additional info */}
      <div className="mt-12 text-center text-sm text-ash">
        <p>all plans include recipe extraction from URLs, photos, and YouTube videos.</p>
        <p className="mt-2">
          questions? <a href="/contact" className="text-sage hover:underline">contact us</a>
        </p>
      </div>
    </PageLayout>
  )
}
