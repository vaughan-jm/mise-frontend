/**
 * RecipePage
 *
 * Cooking mode with prep/cook phases.
 * Redesigned with pill-shaped swipeable cards,
 * category grouping, and smooth animations.
 */

import { useEffect, useState, useCallback } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'
import {
  useCookingMode,
  useSavedRecipes,
  useWakeLock,
  useHaptics,
  useOnboarding,
} from '../hooks'
import { PageLayout } from '../components'
import { useToast } from '../components/ui/Toast'
import PillToggle from '../components/ui/PillToggle'
import {
  IngredientList,
  StepCard,
  RecipeHeader,
  UndoButton,
} from '../components/recipe'
import type { Recipe } from '../lib/types'
import { completionMessages } from '../config/content'
import { canSaveRecipes } from '../config/pricing'

// Star rating component
function StarRating({ rating, onRate }: { rating: number; onRate: (n: number) => void }) {
  return (
    <div className="flex gap-1">
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

export default function RecipePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t, isSignedIn, quota } = useApp()
  const userCanSave = isSignedIn && canSaveRecipes(quota.tier)
  const { showToast } = useToast()
  const { vibrate } = useHaptics()
  const { request: requestWakeLock, release: releaseWakeLock } = useWakeLock()
  const { save, isSaving } = useSavedRecipes()

  // New hooks for redesign
  const { hasSeenPeek, markPeekSeen } = useOnboarding()

  // Get recipe from navigation state
  const recipe = location.state?.recipe as Recipe | undefined
  const sourceUrl = location.state?.sourceUrl as string | undefined

  // Cooking mode state
  const {
    phase,
    setPhase,
    completeStep,
    isStepComplete,
    canUndo,
    undo,
    isComplete,
  } = useCookingMode(recipe ?? null)

  // Local state
  const [servings, setServings] = useState(recipe?.servings ?? 4)
  const [isSaved, setIsSaved] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState(0)
  const [email, setEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)

  // Request wake lock on mount
  useEffect(() => {
    requestWakeLock()
    return () => {
      releaseWakeLock()
    }
  }, [requestWakeLock, releaseWakeLock])

  // Redirect if no recipe
  useEffect(() => {
    if (!recipe) {
      navigate('/')
    }
  }, [recipe, navigate])

  // Show completion when done
  useEffect(() => {
    if (isComplete && !showRating) {
      setShowRating(true)
    }
  }, [isComplete, showRating])

  // Handle save - only for paid users
  const handleSave = useCallback(async () => {
    if (!recipe || !userCanSave) return
    const saved = await save(recipe, recipe.source, sourceUrl ?? undefined)
    if (saved) {
      setIsSaved(true)
      showToast(t.saved, 'success')
    }
  }, [recipe, userCanSave, save, sourceUrl, showToast, t])

  // Handle undo
  const handleUndo = useCallback(() => {
    vibrate('light')
    undo()
    showToast(t.undo, 'info')
  }, [vibrate, undo, showToast, t])

  // Handle rating
  const handleRate = useCallback((n: number) => {
    setRating(n)
    vibrate('success')
    // TODO: Submit rating to API
  }, [vibrate])

  if (!recipe) {
    return null
  }

  // Scale ingredient amounts based on servings
  const servingsMultiplier = servings / (recipe.servings || 4)

  // Should show peek animation (first time only, for cook phase)
  const shouldShowPeek = !hasSeenPeek && phase === 'cook'

  return (
    <PageLayout showFooter={false} maxWidth="lg" className="px-4 pb-24">
      {/* Recipe Header */}
      <div className="py-4">
        <RecipeHeader
          recipe={recipe}
          servings={servings}
          onServingsChange={setServings}
        />
      </div>

      {/* Phase Toggle */}
      <div className="flex justify-center mb-6">
        <PillToggle
          options={[
            { value: 'prep', label: '1. prep' },
            { value: 'cook', label: '2. cook' },
          ]}
          value={phase}
          onChange={(value) => setPhase(value as 'prep' | 'cook')}
        />
      </div>


      {/* Content */}
      <AnimatePresence mode="wait">
        {/* Prep Phase - Grouped Ingredients */}
        {phase === 'prep' && (
          <motion.div
            key="prep"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <IngredientList
              ingredients={recipe.ingredients}
              ingredientsStructured={recipe.ingredientsStructured}
              servingsMultiplier={servingsMultiplier}
            />
          </motion.div>
        )}

        {/* Cook Phase - Steps */}
        {phase === 'cook' && !showRating && (
          <motion.div
            key="cook"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <AnimatePresence mode="popLayout">
              {recipe.steps.map((step, index) => {
                if (isStepComplete(index)) return null

                // First incomplete step gets peek if we haven't shown it
                const isFirstIncomplete = !recipe.steps.slice(0, index).some((_, i) => !isStepComplete(i))
                const showStepPeek = shouldShowPeek && isFirstIncomplete

                return (
                  <motion.div
                    key={index}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{
                      opacity: 0,
                      height: 0,
                      marginBottom: 0,
                      transition: { duration: 0.2 }
                    }}
                    transition={{
                      layout: { duration: 0.25, ease: 'easeOut' },
                      opacity: { duration: 0.15 }
                    }}
                  >
                    <StepCard
                      number={index + 1}
                      step={step}
                      onComplete={() => completeStep(index)}
                      showPeek={showStepPeek}
                      onPeekComplete={markPeekSeen}
                      servingsMultiplier={servingsMultiplier}
                    />
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* All steps complete but rating not shown yet */}
            {isComplete && !showRating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-sage"
              >
                <p className="text-lg lowercase">all steps completed!</p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Completion Screen */}
        {showRating && (
          <motion.div
            key="completion"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8 space-y-6"
          >
            <p className="text-2xl text-sage font-bold lowercase">
              {completionMessages[Math.floor(Math.random() * completionMessages.length)]}
            </p>

            {/* Rating */}
            <div className="space-y-2">
              <p className="text-ash lowercase">{t.rateRecipe}</p>
              <StarRating rating={rating} onRate={handleRate} />
            </div>

            {/* Action buttons */}
            <div className="flex flex-col items-center gap-3 pt-4">
              {/* Save button or upgrade nudge */}
              {!isSaved && (
                userCanSave ? (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2 text-sm font-medium text-obsidian bg-sage rounded-full hover:bg-sage/90 disabled:opacity-50 transition-colors lowercase"
                  >
                    {isSaving ? 'saving...' : t.saveRecipe}
                  </button>
                ) : (
                  <Link
                    to="/pricing"
                    className="px-6 py-2 text-sm font-medium text-obsidian bg-sage rounded-full hover:bg-sage/90 transition-colors lowercase"
                  >
                    {isSignedIn ? 'upgrade to save recipes' : 'sign up to save'}
                  </Link>
                )
              )}

              {/* Already saved indicator */}
              {isSaved && (
                <p className="text-sage text-sm lowercase">✓ {t.saved}</p>
              )}

              {/* Clean another recipe */}
              <Link
                to="/"
                className="text-sm text-ash hover:text-bone transition-colors lowercase"
              >
                clean another recipe →
              </Link>

              {/* Quota nudge for free users */}
              {quota.tier === 'free' && quota.remaining <= 2 && quota.remaining > 0 && (
                <p className="text-xs text-ash/60 mt-2 lowercase">
                  {quota.remaining} recipe{quota.remaining !== 1 ? 's' : ''} left this month
                </p>
              )}

              {/* Email capture for non-signed-in users who rated */}
              {!isSignedIn && rating > 0 && !emailSubmitted && (
                <div className="mt-4 p-4 rounded-2xl bg-gunmetal border border-ash/20 max-w-xs">
                  <p className="text-sm text-bone mb-3 lowercase">get recipe tips & updates</p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (email) {
                        // TODO: Submit to backend
                        setEmailSubmitted(true)
                        showToast('thanks! we\'ll be in touch', 'success')
                      }
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
              )}
              {emailSubmitted && (
                <p className="text-xs text-sage mt-2 lowercase">✓ you're on the list!</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips */}
      {recipe.tips && recipe.tips.length > 0 && !showRating && (
        <div className="mt-8 pt-6 border-t border-gunmetal">
          <h3 className="text-sm font-bold text-ash lowercase mb-3">{t.tips}</h3>
          <ul className="space-y-2">
            {recipe.tips.map((tip, index) => (
              <li key={index} className="text-sm text-ash/80 pl-4 border-l-2 border-sage/30">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Undo Button */}
      <UndoButton
        canUndo={canUndo}
        onUndo={handleUndo}
        label={t.undo}
      />
    </PageLayout>
  )
}
