/**
 * CompletionScreen
 *
 * The "aha moment" screen shown when user completes cooking a recipe.
 * Handles three user segments with different CTAs:
 * - Anonymous: Sign up to save (primary), share (secondary), email capture (tertiary)
 * - Free signed-in: Upgrade to save (primary), share (secondary), referral (tertiary)
 * - Paid: Save (primary), share (secondary), photo upload if 4-5 stars (tertiary)
 */

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import posthog from 'posthog-js'
import confetti from 'canvas-confetti'
import type { Recipe, SubscriptionTier } from '../../lib/types'
import { completionMessages } from '../../config/content'
import { getTier } from '../../config/pricing'

// Star rating component
function StarRating({
  rating,
  onRate,
}: {
  rating: number
  onRate: (n: number) => void
}) {
  return (
    <div className="flex gap-1 justify-center">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onRate(n)}
          className={`text-2xl transition-colors ${
            n <= rating ? 'text-sage' : 'text-ash/30 hover:text-ash'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

// Share button with Web Share API
function ShareButton({
  recipe,
  userId,
}: {
  recipe: Recipe
  userId?: string
}) {
  const [copied, setCopied] = useState(false)

  const shareUrl = `https://pare.cooking/r/${encodeURIComponent(recipe.title.slice(0, 50))}${userId ? `?ref=${userId}` : ''}`
  const shareText = `Just made ${recipe.title} with pare.cooking - clean recipes, no ads`

  const handleShare = async () => {
    posthog.capture('share_initiated', {
      recipe_title: recipe.title,
    })

    // Use Web Share API on mobile
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: shareText,
          url: shareUrl,
        })
        posthog.capture('share_completed', {
          recipe_title: recipe.title,
          platform: 'native',
        })
      } catch (error) {
        // User cancelled or error - that's fine
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error)
        }
      }
    } else {
      // Desktop fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
        setCopied(true)
        posthog.capture('share_completed', {
          recipe_title: recipe.title,
          platform: 'copy',
        })
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Copy failed:', error)
      }
    }
  }

  return (
    <button
      onClick={handleShare}
      className="px-6 py-2 text-sm font-medium text-sage border border-sage rounded-full hover:bg-sage/10 transition-colors lowercase"
    >
      {copied ? '✓ copied!' : 'share'}
    </button>
  )
}

// Low-rating feedback form
function LowRatingFeedback({
  onSubmit,
}: {
  onSubmit: (feedback: string) => void
}) {
  const [feedback, setFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <p className="text-xs text-sage lowercase">✓ thanks for the feedback!</p>
    )
  }

  return (
    <div className="mt-4 p-4 rounded-2xl bg-gunmetal border border-ash/20 max-w-xs mx-auto">
      <p className="text-sm text-bone mb-3 lowercase">what could be better?</p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (feedback.trim()) {
            onSubmit(feedback)
            setSubmitted(true)
          }
        }}
        className="space-y-2"
      >
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="too salty? missing steps?"
          rows={2}
          className="w-full px-3 py-2 text-sm bg-obsidian border border-ash/30 rounded-xl text-bone placeholder:text-ash/50 focus:outline-none focus:border-sage resize-none"
        />
        <button
          type="submit"
          disabled={!feedback.trim()}
          className="w-full px-4 py-2 text-sm bg-sage text-obsidian rounded-full hover:bg-sage/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors lowercase"
        >
          send feedback
        </button>
      </form>
    </div>
  )
}

// Email capture form for anonymous users
function EmailCapture({
  email,
  onEmailChange,
  onSubmit,
  submitted,
}: {
  email: string
  onEmailChange: (email: string) => void
  onSubmit: () => void
  submitted: boolean
}) {
  if (submitted) {
    return (
      <p className="text-xs text-sage lowercase">✓ you're on the list!</p>
    )
  }

  return (
    <div className="mt-4 p-4 rounded-2xl bg-gunmetal border border-ash/20 max-w-xs mx-auto">
      <p className="text-sm text-bone mb-3 lowercase">get recipe tips & updates</p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
        className="flex gap-2"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 px-3 py-2 text-sm bg-obsidian border border-ash/30 rounded-full text-bone placeholder:text-ash/50 focus:outline-none focus:border-sage"
        />
        <button
          type="submit"
          disabled={!email}
          className="px-4 py-2 text-sm bg-sage text-obsidian rounded-full hover:bg-sage/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          →
        </button>
      </form>
    </div>
  )
}

// Photo upload for paid users after high rating
function PhotoUpload({
  recipeTitle,
}: {
  recipeTitle: string
}) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploaded, setUploaded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create preview
    const reader = new FileReader()
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Track photo selected
    posthog.capture('photo_upload_selected', {
      recipe_title: recipeTitle,
      file_size: file.size,
      file_type: file.type,
    })
  }

  const handleUpload = async () => {
    if (!photoPreview) return

    posthog.capture('photo_upload_submitted', {
      recipe_title: recipeTitle,
    })

    // For now, submit as feedback with base64 (will be replaced with proper upload)
    try {
      const { submitFeedback } = await import('../../lib/api')
      // Truncate base64 for feedback - just store metadata for now
      await submitFeedback(
        `Photo submission for recipe: ${recipeTitle}\n(Photo captured but cloud storage not yet configured)`
      )
      setUploaded(true)
    } catch (error) {
      console.error('Failed to submit photo:', error)
    }
  }

  if (uploaded) {
    return (
      <div className="mt-4 text-center">
        <p className="text-xs text-sage lowercase">✓ thanks for sharing!</p>
      </div>
    )
  }

  return (
    <div className="mt-4 text-center max-w-xs mx-auto">
      <p className="text-ash text-sm mb-3 lowercase">that good? show us!</p>

      {!photoPreview ? (
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-gunmetal border border-ash/20 rounded-full cursor-pointer hover:bg-gunmetal/80 transition-colors">
          <svg
            className="w-4 h-4 text-sage"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-sm text-bone lowercase">add a photo</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoSelect}
            className="hidden"
          />
        </label>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl overflow-hidden max-w-[200px] mx-auto">
            <img
              src={photoPreview}
              alt="Your creation"
              className="w-full h-auto"
            />
          </div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                setPhotoPreview(null)
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              }}
              className="px-3 py-1 text-xs text-ash hover:text-bone transition-colors lowercase"
            >
              change
            </button>
            <button
              onClick={handleUpload}
              className="px-4 py-2 text-sm bg-sage text-obsidian rounded-full hover:bg-sage/90 transition-colors lowercase"
            >
              share photo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Referral prompt card
function ReferralPrompt({ isPaid }: { isPaid: boolean }) {
  const [linkCopied, setLinkCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [referralUrl, setReferralUrl] = useState<string | null>(null)

  const handleGetLink = async () => {
    posthog.capture('referral_link_requested')

    // If we already have the URL, just copy it
    if (referralUrl) {
      try {
        await navigator.clipboard.writeText(referralUrl)
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
      } catch (error) {
        console.error('Copy failed:', error)
      }
      return
    }

    // Fetch the user's referral code
    setLoading(true)
    try {
      const { getReferralCode } = await import('../../lib/api')
      const { shareUrl } = await getReferralCode()
      setReferralUrl(shareUrl)

      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (error) {
      console.error('Failed to get referral code:', error)
      // Fallback to generic link
      const fallbackUrl = 'https://pare.cooking/?ref=friend'
      try {
        await navigator.clipboard.writeText(fallbackUrl)
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
      } catch (e) {
        console.error('Copy failed:', e)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-6 p-4 bg-gunmetal/50 border border-ash/10 rounded-xl text-center max-w-xs mx-auto">
      <p className="text-bone text-sm mb-2 lowercase">love pare?</p>
      <p className="text-xs text-ash mb-3 lowercase">
        {isPaid
          ? 'refer a friend, get a free month'
          : 'share with a friend — you both get 7 free days'}
      </p>
      <button
        onClick={handleGetLink}
        disabled={loading}
        className="px-4 py-2 text-sm border border-sage/50 text-sage rounded-full hover:bg-sage/10 transition-colors lowercase disabled:opacity-50"
      >
        {loading ? 'loading...' : linkCopied ? '✓ link copied!' : 'get your link'}
      </button>
    </div>
  )
}

interface CompletionScreenProps {
  recipe: Recipe
  rating: number
  onRate: (n: number) => void
  isSaved: boolean
  isSaving: boolean
  onSave: () => void
  userCanSave: boolean
  isSignedIn: boolean
  quota: {
    tier: SubscriptionTier
    remaining: number
  }
  email: string
  onEmailChange: (email: string) => void
  emailSubmitted: boolean
  onEmailSubmit: () => void
  t: {
    rateRecipe: string
    saveRecipe: string
    saved: string
  }
}

export function CompletionScreen({
  recipe,
  rating,
  onRate,
  isSaved,
  isSaving,
  onSave,
  userCanSave,
  isSignedIn,
  quota,
  email,
  onEmailChange,
  emailSubmitted,
  onEmailSubmit,
  t,
}: CompletionScreenProps) {
  const confettiTriggered = useRef(false)
  const [completionMessage] = useState(
    () => completionMessages[Math.floor(Math.random() * completionMessages.length)]
  )

  const isPaid = quota.tier === 'basic' || quota.tier === 'pro'
  const tierInfo = getTier(quota.tier)
  const monthlyPrice = tierInfo?.monthlyPrice ?? 4.99

  // Fire confetti on mount
  useEffect(() => {
    if (!confettiTriggered.current) {
      confettiTriggered.current = true

      // Subtle confetti burst using brand colors
      confetti({
        particleCount: 60,
        spread: 55,
        origin: { y: 0.3 },
        colors: ['#9DB17C', '#E8E4DD', '#6B7280'], // sage, bone, ash
        disableForReducedMotion: true,
      })
    }
  }, [])

  // Track upgrade prompt views
  useEffect(() => {
    if (!isSaved && !userCanSave) {
      posthog.capture('upgrade_prompt_shown', {
        user_tier: quota.tier,
        is_signed_in: isSignedIn,
        prompt_type: isSignedIn ? 'save_to_upgrade' : 'sign_up',
      })
    }
  }, [isSaved, userCanSave, quota.tier, isSignedIn])

  const handleUpgradeClick = () => {
    posthog.capture('upgrade_clicked', {
      from_screen: 'completion',
      user_tier: quota.tier,
    })
  }

  const handleLowRatingFeedback = async (feedback: string) => {
    posthog.capture('low_rating_feedback', {
      rating,
      feedback_length: feedback.length,
    })
    // Submit via feedback API
    try {
      const { submitFeedback } = await import('../../lib/api')
      await submitFeedback(`Recipe feedback (${rating} stars): ${feedback}`)
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="text-center py-8 space-y-6"
    >
      {/* Celebration message */}
      <p className="text-2xl text-sage font-bold lowercase">{completionMessage}</p>

      {/* Rating */}
      <div className="space-y-2">
        <p className="text-ash lowercase">{t.rateRecipe}</p>
        <StarRating rating={rating} onRate={onRate} />
      </div>

      {/* Primary CTA section - varies by user type */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="pt-4 space-y-4"
      >
        {/* PAID USERS: Save button */}
        {isPaid && !isSaved && (
          <button
            onClick={onSave}
            disabled={isSaving}
            className="w-full max-w-xs mx-auto block py-3 text-sm font-medium text-obsidian bg-sage rounded-full hover:bg-sage/90 disabled:opacity-50 transition-colors lowercase"
          >
            {isSaving ? 'saving...' : t.saveRecipe}
          </button>
        )}

        {/* PAID USERS: Saved confirmation */}
        {isPaid && isSaved && (
          <p className="text-sage text-sm lowercase">✓ saved to cookbook</p>
        )}

        {/* FREE SIGNED-IN USERS: Upgrade prompt with loss aversion */}
        {isSignedIn && !isPaid && (
          <div className="space-y-3">
            <p className="text-bone text-sm lowercase">this recipe won't be saved</p>
            <Link
              to="/pricing"
              onClick={handleUpgradeClick}
              className="w-full max-w-xs mx-auto block py-3 text-sm font-medium text-obsidian bg-sage rounded-full hover:bg-sage/90 transition-colors lowercase"
            >
              save to cookbook — ${monthlyPrice}/mo
            </Link>
            {quota.remaining > 0 && (
              <p className="text-xs text-ash/60 lowercase">
                {quota.remaining} recipe{quota.remaining !== 1 ? 's' : ''} left this month
              </p>
            )}
          </div>
        )}

        {/* ANONYMOUS USERS: Sign up prompt */}
        {!isSignedIn && (
          <div className="space-y-3">
            <Link
              to="/pricing"
              onClick={handleUpgradeClick}
              className="w-full max-w-xs mx-auto block py-3 text-sm font-medium text-obsidian bg-sage rounded-full hover:bg-sage/90 transition-colors lowercase"
            >
              sign up to save this recipe
            </Link>
          </div>
        )}

        {/* Share button - shown for everyone after primary CTA */}
        <div className="pt-2">
          <p className="text-ash text-xs mb-2 lowercase">share your creation</p>
          <ShareButton recipe={recipe} />
        </div>
      </motion.div>

      {/* Tertiary section - conditional content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="pt-4"
      >
        {/* Low rating feedback - show for 1-3 star ratings */}
        {rating > 0 && rating <= 3 && (
          <LowRatingFeedback onSubmit={handleLowRatingFeedback} />
        )}

        {/* Photo upload for paid users who rated highly */}
        {isPaid && rating >= 4 && (
          <PhotoUpload recipeTitle={recipe.title} />
        )}

        {/* Email capture for anonymous users who rated positively */}
        {!isSignedIn && rating >= 4 && (
          <EmailCapture
            email={email}
            onEmailChange={onEmailChange}
            onSubmit={onEmailSubmit}
            submitted={emailSubmitted}
          />
        )}

        {/* Referral prompt for signed-in users who rated highly */}
        {isSignedIn && rating >= 4 && (
          <ReferralPrompt isPaid={isPaid} />
        )}
      </motion.div>

      {/* Clean another recipe link */}
      <Link
        to="/"
        className="inline-block text-sm text-ash hover:text-bone transition-colors lowercase"
      >
        clean another recipe →
      </Link>
    </motion.div>
  )
}
