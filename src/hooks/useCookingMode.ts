/**
 * useCookingMode Hook
 *
 * Manages cooking mode state with prep/cook phases,
 * step completion tracking, and undo functionality.
 *
 * Usage:
 *   const {
 *     phase, setPhase,
 *     completedSteps, completeStep,
 *     undo, reset
 *   } = useCookingMode(recipe)
 */

import { useState, useCallback, useMemo } from 'react'
import type { Recipe } from '../lib/types'

export type CookingPhase = 'prep' | 'cook'

interface UndoAction {
  type: 'step'
  index: number
  timestamp: number
}

interface UseCookingModeReturn {
  // Phase
  phase: CookingPhase
  setPhase: (phase: CookingPhase) => void

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
  const stepProgress = useMemo(() => {
    const total = recipe?.steps.length ?? 0
    const completed = completedSteps.size
    return { completed, total }
  }, [recipe, completedSteps])

  const allStepsComplete = useMemo(() => {
    if (!recipe) return false
    return completedSteps.size >= recipe.steps.length
  }, [recipe, completedSteps])

  const isComplete = allStepsComplete

  // Undo last action
  const canUndo = undoHistory.length > 0

  const undo = useCallback(() => {
    if (undoHistory.length === 0) return

    const lastAction = undoHistory[undoHistory.length - 1] as UndoAction
    setUndoHistory((prev) => prev.slice(0, -1))

    uncompleteStep(lastAction.index)
  }, [undoHistory, uncompleteStep])

  // Reset all state
  const reset = useCallback(() => {
    setPhase('prep')
    setCompletedSteps(new Set())
    setUndoHistory([])
  }, [])

  return {
    phase,
    setPhase,
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
