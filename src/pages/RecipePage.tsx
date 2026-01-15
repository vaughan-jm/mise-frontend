/**
 * RecipePage
 *
 * Cooking mode with prep/cook phases.
 * Tap to complete ingredients and steps.
 */

import { useEffect, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { useCookingMode, useSavedRecipes, useWakeLock, useHaptics } from '../hooks'
import { PageLayout, Button, Card, TabSwitcher } from '../components'
import { useToast } from '../components/ui/Toast'
import type { Recipe } from '../lib/types'
import type { Tab } from '../components/ui/TabSwitcher'
import type { CookingPhase } from '../hooks/useCookingMode'
import { completionMessages } from '../config/content'

// Phase tabs
const phaseTabs: Tab<CookingPhase>[] = [
  { id: 'prep', label: '1. prep' },
  { id: 'cook', label: '2. cook' },
]

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
  const { t, isSignedIn } = useApp()
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
    completeIngredient,
    isIngredientComplete,
    ingredientProgress,
    allIngredientsComplete,
    completeStep,
    isStepComplete,
    stepProgress,
    canUndo,
    undo,
    reset,
    isComplete,
  } = useCookingMode(recipe ?? null)

  // Local state
  const [servings, setServings] = useState(recipe?.servings ?? 4)
  const [isSaved, setIsSaved] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState(0)

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

  // Auto-switch to cook phase when prep is complete
  useEffect(() => {
    if (allIngredientsComplete && phase === 'prep') {
      setPhase('cook')
    }
  }, [allIngredientsComplete, phase, setPhase])

  // Show completion when done
  useEffect(() => {
    if (isComplete && !showRating) {
      setShowRating(true)
    }
  }, [isComplete, showRating])

  // Handle ingredient tap
  const handleIngredientTap = useCallback((index: number) => {
    if (isIngredientComplete(index)) return
    vibrate('light')
    completeIngredient(index)
  }, [isIngredientComplete, vibrate, completeIngredient])

  // Handle step tap
  const handleStepTap = useCallback((index: number) => {
    if (isStepComplete(index)) return
    vibrate('light')
    completeStep(index)
  }, [isStepComplete, vibrate, completeStep])

  // Handle save
  const handleSave = useCallback(async () => {
    if (!recipe || !isSignedIn) return
    const saved = await save(recipe, recipe.source, sourceUrl ?? undefined)
    if (saved) {
      setIsSaved(true)
      showToast(t.saved, 'success')
    }
  }, [recipe, isSignedIn, save, sourceUrl, showToast, t])

  // Handle undo
  const handleUndo = useCallback(() => {
    vibrate('light')
    undo()
    showToast(t.undo, 'info')
  }, [vibrate, undo, showToast, t])

  // Handle reset
  const handleReset = useCallback(() => {
    reset()
    setShowRating(false)
    setRating(0)
  }, [reset])

  // Handle rating
  const handleRate = useCallback((n: number) => {
    setRating(n)
    vibrate('success')
    // TODO: Submit rating to API
  }, [vibrate])

  // Handle back
  const handleBack = useCallback(() => {
    navigate('/')
  }, [navigate])

  if (!recipe) {
    return null
  }

  // Scale ingredient amounts based on servings
  const servingMultiplier = servings / (recipe.servings || 4)

  return (
    <PageLayout showFooter={false} maxWidth="lg" className="px-4 pb-8">
      {/* Recipe Header */}
      <div className="py-4 space-y-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-bone lowercase flex-1">
            {recipe.title}
          </h1>
          <div className="flex gap-2">
            {isSignedIn && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                disabled={isSaved || isSaving}
                isLoading={isSaving}
              >
                {isSaved ? t.saved : t.saveRecipe}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleBack}>
              {t.back}
            </Button>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-ash">
          {/* Servings adjuster */}
          <div className="flex items-center gap-2">
            <span>{t.servings}:</span>
            <button
              onClick={() => setServings((s) => Math.max(1, s - 1))}
              className="w-6 h-6 rounded bg-gunmetal hover:bg-ash/20 transition-colors"
            >
              -
            </button>
            <span className="w-6 text-center text-bone">{servings}</span>
            <button
              onClick={() => setServings((s) => s + 1)}
              className="w-6 h-6 rounded bg-gunmetal hover:bg-ash/20 transition-colors"
            >
              +
            </button>
          </div>

          {recipe.prepTime && (
            <span>{t.prepTime}: {recipe.prepTime}</span>
          )}
          {recipe.cookTime && (
            <span>{t.cookTime}: {recipe.cookTime}</span>
          )}
        </div>

        {/* Source */}
        {(recipe.source || sourceUrl) && (
          <p className="text-xs text-ash/60">
            {t.source}: {sourceUrl ? (
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-sage">
                {recipe.source || sourceUrl}
              </a>
            ) : recipe.source}
          </p>
        )}
      </div>

      {/* Phase Tabs */}
      <div className="flex justify-center mb-6">
        <TabSwitcher
          tabs={phaseTabs}
          activeTab={phase}
          onChange={setPhase}
          size="md"
        />
      </div>

      {/* Progress */}
      <div className="text-center text-sm text-ash mb-4">
        {phase === 'prep' ? (
          <span>{ingredientProgress.completed} {t.ofGathered.replace('{total}', String(ingredientProgress.total))}</span>
        ) : (
          <span>{stepProgress.completed} {t.ofCompleted.replace('{total}', String(stepProgress.total))}</span>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {/* Prep Phase - Ingredients */}
        {phase === 'prep' && (
          <motion.div
            key="prep"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {recipe.ingredients.map((ingredient, index) => {
              const isComplete = isIngredientComplete(index)
              if (isComplete) return null

              // Scale amount if present
              let displayText = ingredient.text
              if (ingredient.amount && servingMultiplier !== 1) {
                const originalAmount = parseFloat(ingredient.amount)
                if (!isNaN(originalAmount)) {
                  const scaledAmount = (originalAmount * servingMultiplier).toFixed(1).replace(/\.0$/, '')
                  displayText = displayText.replace(ingredient.amount, scaledAmount)
                }
              }

              return (
                <Card
                  key={index}
                  variant="interactive"
                  animate
                  onClick={() => handleIngredientTap(index)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-sage/20 text-sage text-sm flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-bone">{displayText}</span>
                  </div>
                </Card>
              )
            })}

            {allIngredientsComplete && (
              <div className="text-center py-8 text-sage">
                <p className="text-lg">{t.allDone}</p>
                <p className="text-sm text-ash mt-2">tap "2. cook" to continue</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Cook Phase - Steps */}
        {phase === 'cook' && (
          <motion.div
            key="cook"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {recipe.steps.map((step, index) => {
              const isComplete = isStepComplete(index)
              if (isComplete) return null

              return (
                <Card
                  key={index}
                  variant="interactive"
                  animate
                  onClick={() => handleStepTap(index)}
                  className="cursor-pointer"
                >
                  <div className="space-y-2">
                    {/* Step number */}
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-sage/20 text-sage text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <p className="text-bone leading-relaxed">{step.text}</p>
                    </div>

                    {/* Related ingredients chips */}
                    {step.ingredients && step.ingredients.length > 0 && (
                      <div className="pl-9">
                        <p className="text-xs text-ash mb-1">{t.youllNeed}:</p>
                        <div className="flex flex-wrap gap-1">
                          {step.ingredients.map((ing, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-sage/10 text-sage text-xs rounded"
                            >
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}

            {/* Completion */}
            {showRating && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-4"
              >
                <p className="text-2xl text-sage font-bold">
                  {completionMessages[Math.floor(Math.random() * completionMessages.length)]}
                </p>
                <div className="space-y-2">
                  <p className="text-ash">{t.rateRecipe}</p>
                  <StarRating rating={rating} onRate={handleRate} />
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips */}
      {recipe.tips && recipe.tips.length > 0 && (
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

      {/* Bottom Actions */}
      <div className="fixed bottom-4 left-4 right-4 flex justify-center gap-3">
        {canUndo && (
          <Button variant="secondary" size="sm" onClick={handleUndo}>
            {t.undo}
          </Button>
        )}
        {(ingredientProgress.completed > 0 || stepProgress.completed > 0) && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            {t.reset}
          </Button>
        )}
      </div>
    </PageLayout>
  )
}
