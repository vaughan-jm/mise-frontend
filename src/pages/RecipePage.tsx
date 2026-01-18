/**
 * RecipePage
 *
 * Cooking mode with prep/cook phases.
 * Redesigned with pill-shaped swipeable cards,
 * category grouping, and smooth animations.
 */

import { useEffect, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import posthog from 'posthog-js'
import { useApp } from '../context/AppContext'
import {
  useCookingMode,
  useSavedRecipes,
  useWakeLock,
  useHaptics,
} from '../hooks'
import { PageLayout } from '../components'
import { useToast } from '../components/ui/Toast'
import {
  IngredientList,
  StepCard,
  RecipeHeader,
  UndoButton,
} from '../components/recipe'
import type { Recipe } from '../lib/types'
import { canSaveRecipes } from '../config/pricing'
import * as api from '../lib/api'
import { CompletionScreen } from '../components/completion'

export default function RecipePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t, isSignedIn, quota } = useApp()
  const userCanSave = isSignedIn && canSaveRecipes(quota.tier)
  const { showToast } = useToast()
  const { vibrate } = useHaptics()
  const { request: requestWakeLock, release: releaseWakeLock } = useWakeLock()
  const { save, isSaving } = useSavedRecipes()


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

      // Track completion event
      posthog.capture('recipe_completed', {
        recipe_title: recipe?.title,
        source_type: recipe?.source,
        user_tier: quota.tier,
        is_signed_in: isSignedIn,
      })
    }
  }, [isComplete, showRating, recipe?.title, recipe?.source, quota.tier, isSignedIn])

  // Handle save - only for paid users
  const handleSave = useCallback(async () => {
    if (!recipe || !userCanSave) return

    // Track save initiated
    posthog.capture('save_initiated', {
      recipe_title: recipe.title,
      user_tier: quota.tier,
    })

    const saved = await save(recipe, recipe.source, sourceUrl ?? undefined)
    if (saved) {
      setIsSaved(true)
      showToast(t.saved, 'success')

      // Track save success
      posthog.capture('save_completed', {
        recipe_title: recipe.title,
        user_tier: quota.tier,
      })
    }
  }, [recipe, userCanSave, save, sourceUrl, showToast, t, quota.tier])

  // Handle undo
  const handleUndo = useCallback(() => {
    vibrate('light')
    undo()
    showToast(t.undo, 'info')
  }, [vibrate, undo, showToast, t])

  // Handle rating
  const handleRate = useCallback(async (n: number) => {
    setRating(n)
    vibrate('success')

    // Track rating event
    posthog.capture('recipe_rated', {
      rating: n,
      recipe_title: recipe?.title,
      user_tier: quota.tier,
      is_signed_in: isSignedIn,
    })

    // Submit rating to API
    try {
      await api.submitRating(n)
    } catch (error) {
      // Silently fail - rating is not critical
      console.error('Failed to submit rating:', error)
    }
  }, [vibrate, recipe?.title, quota.tier, isSignedIn])

  if (!recipe) {
    return null
  }

  // Scale ingredient amounts based on servings
  const servingsMultiplier = servings / (recipe.servings || 4)

  return (
    <PageLayout showFooter={false} maxWidth="lg" className="px-4 pb-24">
      {/* Recipe Header */}
      <div className="py-4">
        <RecipeHeader
          recipe={recipe}
          servings={servings}
          onServingsChange={setServings}
          phase={phase}
          onPhaseChange={(value) => setPhase(value as 'prep' | 'cook')}
        />
      </div>


      {/* Content */}
      {/* Prep Phase - Grouped Ingredients */}
      {phase === 'prep' && (
        <div>
          <IngredientList
            ingredients={recipe.ingredients}
            ingredientsStructured={recipe.ingredientsStructured}
            servingsMultiplier={servingsMultiplier}
          />
        </div>
      )}

      {/* Cook Phase - Steps */}
      {phase === 'cook' && !showRating && (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {recipe.steps.map((step, index) => {
              if (isStepComplete(index)) return null

              // Check if this is the first incomplete step (for tap hint)
              const isFirstIncomplete = !recipe.steps.slice(0, index).some((_, i) => !isStepComplete(i))

              return (
                <motion.div
                  key={index}
                  exit={{
                    opacity: 0,
                    height: 0,
                    marginBottom: 0,
                    transition: { duration: 0.2 }
                  }}
                >
                  <StepCard
                    step={step}
                    onComplete={() => completeStep(index)}
                    isFirstStep={isFirstIncomplete}
                    servingsMultiplier={servingsMultiplier}
                  />
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* All steps complete but rating not shown yet */}
          {isComplete && !showRating && (
            <div className="text-center py-8 text-sage">
              <p className="text-lg lowercase">all steps completed!</p>
            </div>
          )}
        </div>
      )}

      {/* Completion Screen */}
      {showRating && (
        <CompletionScreen
          recipe={recipe}
          rating={rating}
          onRate={handleRate}
          isSaved={isSaved}
          isSaving={isSaving}
          onSave={handleSave}
          userCanSave={userCanSave}
          isSignedIn={isSignedIn}
          quota={quota}
          email={email}
          onEmailChange={setEmail}
          emailSubmitted={emailSubmitted}
          onEmailSubmit={async () => {
            if (email) {
              posthog.capture('email_capture_submitted', {
                source: 'completion_screen',
              })
              try {
                await api.submitEmailCapture(email, 'completion_screen')
              } catch (error) {
                console.error('Failed to submit email:', error)
              }
              setEmailSubmitted(true)
              showToast("thanks! we'll be in touch", 'success')
            }
          }}
          t={t}
        />
      )}

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
