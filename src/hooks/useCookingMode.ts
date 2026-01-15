/**
 * useCookingMode Hook
 *
 * Manages cooking mode state with prep/cook phases,
 * completion tracking, and undo functionality.
 *
 * Usage:
 *   const {
 *     phase, setPhase,
 *     completedIngredients, completeIngredient,
 *     completedSteps, completeStep,
 *     undo, reset
 *   } = useCookingMode(recipe)
 */

import { useState, useCallback, useMemo } from 'react'
import type { Recipe } from '../lib/types'

export type CookingPhase = 'prep' | 'cook'

interface UndoAction {
  type: 'ingredient' | 'step'
  index: number
  timestamp: number
}

interface UseCookingModeReturn {
  // Phase
  phase: CookingPhase
  setPhase: (phase: CookingPhase) => void

  // Ingredients
  completedIngredients: Set<number>
  completeIngredient: (index: number) => void
  uncompleteIngredient: (index: number) => void
  isIngredientComplete: (index: number) => boolean
  ingredientProgress: { completed: number; total: number }
  allIngredientsComplete: boolean

  // Steps
  completedSteps: Set<number>
  completeStep: (index: number) => void
  uncompleteStep: (index: number) => void
  isStepComplete: (index: number) => boolean
  stepProgress: { completed: number; total: number }
  allStepsComplete: boolean

  // Undo
  canUndo: boolean
  undo: () => void
  undoHistory: UndoAction[]

  // Reset
  reset: () => void
  isComplete: boolean
}

export function useCookingMode(recipe: Recipe | null): UseCookingModeReturn {
  // Phase state
  const [phase, setPhase] = useState<CookingPhase>('prep')

  // Completion state
  const [completedIngredients, setCompletedIngredients] = useState<Set<number>>(
    new Set()
  )
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  // Undo history (last 10 actions)
  const [undoHistory, setUndoHistory] = useState<UndoAction[]>([])

  // Add to undo history
  const addToHistory = useCallback((action: Omit<UndoAction, 'timestamp'>) => {
    setUndoHistory((prev) => {
      const newHistory = [
        ...prev,
        { ...action, timestamp: Date.now() },
      ].slice(-10) // Keep last 10
      return newHistory
    })
  }, [])

  // Complete ingredient
  const completeIngredient = useCallback(
    (index: number) => {
      setCompletedIngredients((prev) => {
        const next = new Set(prev)
        next.add(index)
        return next
      })
      addToHistory({ type: 'ingredient', index })
    },
    [addToHistory]
  )

  // Uncomplete ingredient (for undo)
  const uncompleteIngredient = useCallback((index: number) => {
    setCompletedIngredients((prev) => {
      const next = new Set(prev)
      next.delete(index)
      return next
    })
  }, [])

  // Check if ingredient is complete
  const isIngredientComplete = useCallback(
    (index: number) => completedIngredients.has(index),
    [completedIngredients]
  )

  // Complete step
  const completeStep = useCallback(
    (index: number) => {
      setCompletedSteps((prev) => {
        const next = new Set(prev)
        next.add(index)
        return next
      })
      addToHistory({ type: 'step', index })
    },
    [addToHistory]
  )

  // Uncomplete step (for undo)
  const uncompleteStep = useCallback((index: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev)
      next.delete(index)
      return next
    })
  }, [])

  // Check if step is complete
  const isStepComplete = useCallback(
    (index: number) => completedSteps.has(index),
    [completedSteps]
  )

  // Progress calculations
  const ingredientProgress = useMemo(() => {
    const total = recipe?.ingredients.length ?? 0
    const completed = completedIngredients.size
    return { completed, total }
  }, [recipe, completedIngredients])

  const stepProgress = useMemo(() => {
    const total = recipe?.steps.length ?? 0
    const completed = completedSteps.size
    return { completed, total }
  }, [recipe, completedSteps])

  const allIngredientsComplete = useMemo(() => {
    if (!recipe) return false
    return completedIngredients.size >= recipe.ingredients.length
  }, [recipe, completedIngredients])

  const allStepsComplete = useMemo(() => {
    if (!recipe) return false
    return completedSteps.size >= recipe.steps.length
  }, [recipe, completedSteps])

  const isComplete = allIngredientsComplete && allStepsComplete

  // Undo last action
  const canUndo = undoHistory.length > 0

  const undo = useCallback(() => {
    if (undoHistory.length === 0) return

    const lastAction = undoHistory[undoHistory.length - 1] as UndoAction
    setUndoHistory((prev) => prev.slice(0, -1))

    if (lastAction.type === 'ingredient') {
      uncompleteIngredient(lastAction.index)
    } else {
      uncompleteStep(lastAction.index)
    }
  }, [undoHistory, uncompleteIngredient, uncompleteStep])

  // Reset all state
  const reset = useCallback(() => {
    setPhase('prep')
    setCompletedIngredients(new Set())
    setCompletedSteps(new Set())
    setUndoHistory([])
  }, [])

  return {
    phase,
    setPhase,
    completedIngredients,
    completeIngredient,
    uncompleteIngredient,
    isIngredientComplete,
    ingredientProgress,
    allIngredientsComplete,
    completedSteps,
    completeStep,
    uncompleteStep,
    isStepComplete,
    stepProgress,
    allStepsComplete,
    canUndo,
    undo,
    undoHistory,
    reset,
    isComplete,
  }
}

export default useCookingMode
