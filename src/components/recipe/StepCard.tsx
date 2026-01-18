/**
 * StepCard Component
 *
 * Card for the cook phase displaying step instruction with ingredient block.
 *
 * Features:
 * - Step instruction text (no step numbers)
 * - Dark inset ingredient block for visual contrast
 * - Tap to complete with ripple effect
 * - Haptic feedback on tap
 */

import { useState, useRef, useCallback, type MouseEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHaptics } from '../../hooks/useHaptics'
import type { Step } from '../../lib/types'

interface StepCardProps {
  /** Step data */
  step: Step
  /** Called when step is marked complete */
  onComplete: () => void
  /** Whether this is the first incomplete step (for hint) */
  isFirstStep?: boolean
  /** Servings multiplier for scaling ingredient quantities */
  servingsMultiplier?: number
  /** Disabled state */
  disabled?: boolean
}

/**
 * Reformat ingredient text from backend format to desired display format.
 * Backend: "450g / 1 lb sweet Italian sausage" or "1 / 1 egg"
 * Display: "1 lb sweet Italian sausage (450g)" or "1 egg"
 */
function reformatIngredientText(text: string): string {
  const slashMatch = text.match(/^([\d.]+\s*\w*)\s*\/\s*([\d.]+\s*\w*)\s+(.+)$/)

  if (!slashMatch || !slashMatch[1] || !slashMatch[2] || !slashMatch[3]) {
    return text
  }

  const metricPart = slashMatch[1]
  const imperialPart = slashMatch[2]
  const description = slashMatch[3]
  const metric = metricPart.trim()
  const imperial = imperialPart.trim()

  if (metric === imperial) {
    return `${imperial} ${description}`
  }

  const metricNumMatch = metric.match(/^([\d.]+)\s*(.*)$/)
  const imperialNumMatch = imperial.match(/^([\d.]+)\s*(.*)$/)

  if (metricNumMatch?.[1] && imperialNumMatch?.[1]) {
    const metricNum = parseFloat(metricNumMatch[1])
    const metricUnit = metricNumMatch[2] ?? ''
    const imperialNum = parseFloat(imperialNumMatch[1])
    const imperialUnit = imperialNumMatch[2] ?? ''

    if (metricNum === imperialNum && metricUnit === imperialUnit) {
      return `${imperial} ${description}`
    }

    if (!metricUnit && metricNum === imperialNum) {
      return `${imperial} ${description}`
    }
  }

  return `${imperial} ${description} (${metric})`
}

/**
 * Scale ingredient text based on servings multiplier
 */
function scaleIngredientText(text: string, multiplier: number): string {
  const reformatted = reformatIngredientText(text)

  if (multiplier === 1) return reformatted

  return reformatted.replace(
    /(\d+\.?\d*)\s*(lb|oz|g|kg|ml|l|cup|cups|tbsp|tsp|tablespoon|teaspoon|clove|cloves)?/gi,
    (_match, num, unit) => {
      const value = parseFloat(num)
      const scaled = value * multiplier
      const formatted = scaled % 1 === 0
        ? scaled.toString()
        : scaled.toFixed(1).replace(/\.0$/, '')

      return `${formatted}${unit ? ` ${unit}` : ''}`
    }
  )
}

// Ripple effect component
function Ripple({ x, y, onComplete }: { x: number; y: number; onComplete: () => void }) {
  return (
    <motion.div
      className="absolute pointer-events-none rounded-full bg-sage/30"
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
      initial={{ width: 0, height: 0, opacity: 0.6 }}
      animate={{ width: 150, height: 150, opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      onAnimationComplete={onComplete}
    />
  )
}

export default function StepCard({
  step,
  onComplete,
  isFirstStep = false,
  servingsMultiplier = 1,
  disabled = false,
}: StepCardProps) {
  const { vibrate } = useHaptics()
  const containerRef = useRef<HTMLDivElement>(null)
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null)

  const hasIngredients = step.ingredients && step.ingredients.length > 0

  // Handle tap completion
  const handleTap = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (disabled) return

    // Get tap position relative to container
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      const tapX = e.clientX - rect.left
      const tapY = e.clientY - rect.top
      setRipple({ x: tapX, y: tapY })
    }

    vibrate('light')

    // Delay completion slightly for ripple effect
    setTimeout(() => {
      onComplete()
    }, 100)
  }, [disabled, onComplete, vibrate])

  const clearRipple = useCallback(() => {
    setRipple(null)
  }, [])

  return (
    <motion.div
      ref={containerRef}
      onClick={handleTap}
      whileTap={{ scale: 0.98 }}
      className={`
        relative
        overflow-hidden
        rounded-2xl
        border border-ash/20
        bg-gunmetal
        p-4
        cursor-pointer
        transition-colors
        hover:border-sage/50
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {/* Instruction text - no step number */}
      <p className="text-bone leading-relaxed text-lg">
        {step.text}
      </p>

      {/* Ingredients in contrasting dark background block */}
      {hasIngredients && (
        <div className="mt-4 p-3 bg-obsidian rounded-xl">
          <ul className="space-y-1">
            {step.ingredients!.map((ingredient, idx) => (
              <li key={idx} className="text-sm text-ash">
                • {scaleIngredientText(ingredient, servingsMultiplier)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tap hint for first step only */}
      {isFirstStep && (
        <span className="block mt-3 text-xs text-ash/40 lowercase">
          tap when done
        </span>
      )}

      {/* Tap ripple effect */}
      <AnimatePresence>
        {ripple && (
          <Ripple x={ripple.x} y={ripple.y} onComplete={clearRipple} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
