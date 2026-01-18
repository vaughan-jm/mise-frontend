/**
 * SwipeableItem Component
 *
 * Swipeable card wrapper with iOS Mail-style reveal animation.
 * Supports multiple completion methods: tap, swipe left, swipe right.
 *
 * Features:
 * - Horizontal drag with action bar reveal
 * - Tap to complete with ripple effect
 * - Peek animation for first-time user onboarding
 * - Haptic feedback integration
 */

import { useState, useRef, useCallback, useEffect, type ReactNode, type MouseEvent } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { useHaptics } from '../../hooks/useHaptics'

interface SwipeableItemProps {
  children: ReactNode
  onComplete: () => void
  disabled?: boolean
  swipeThreshold?: number
  showPeek?: boolean
  onPeekComplete?: () => void
  className?: string
}

// Ripple effect component
function Ripple({ x, y, onComplete }: { x: number; y: number; onComplete: () => void }) {
  return (
    <motion.div
      className="absolute pointer-events-none rounded-full bg-sage/30"
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
      initial={{ width: 0, height: 0, opacity: 0.6 }}
      animate={{ width: 120, height: 120, opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      onAnimationComplete={onComplete}
    />
  )
}

export default function SwipeableItem({
  children,
  onComplete,
  disabled = false,
  swipeThreshold = 80,
  showPeek = false,
  onPeekComplete,
  className = '',
}: SwipeableItemProps) {
  const { vibrate } = useHaptics()
  const containerRef = useRef<HTMLDivElement>(null)

  // Drag state
  const x = useMotionValue(0)
  const [isDragging, setIsDragging] = useState(false)
  const [hasPassedThreshold, setHasPassedThreshold] = useState(false)

  // Ripple state
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null)

  // Peek animation state
  const [peekComplete, setPeekComplete] = useState(false)

  // Transform x position to background opacity for reveal effect
  const actionBarOpacity = useTransform(x, [-100, -30, 30, 100], [1, 0.3, 0.3, 1])
  const actionBarScale = useTransform(x, [-100, 0, 100], [1, 0.8, 1])

  // Track when passing threshold for haptic feedback
  useEffect(() => {
    const unsubscribe = x.on('change', (latest) => {
      const passed = Math.abs(latest) > swipeThreshold
      if (passed && !hasPassedThreshold) {
        setHasPassedThreshold(true)
        vibrate('light')
      } else if (!passed && hasPassedThreshold) {
        setHasPassedThreshold(false)
      }
    })
    return () => unsubscribe()
  }, [x, swipeThreshold, hasPassedThreshold, vibrate])

  // Peek animation on mount
  useEffect(() => {
    if (showPeek && !peekComplete) {
      const timer = setTimeout(() => {
        // Animate the peek
        x.set(40)
        setTimeout(() => {
          x.set(0)
          setPeekComplete(true)
          onPeekComplete?.()
        }, 500)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [showPeek, peekComplete, x, onPeekComplete])

  // Handle tap completion
  const handleTap = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (disabled || isDragging) return

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
  }, [disabled, isDragging, onComplete, vibrate])

  // Handle drag end
  const handleDragEnd = useCallback((_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    setIsDragging(false)

    // Check if swipe passed threshold (position or velocity)
    const passedThreshold = Math.abs(info.offset.x) > swipeThreshold || Math.abs(info.velocity.x) > 500

    if (passedThreshold) {
      // Animate off screen in swipe direction, then complete
      const direction = info.offset.x > 0 ? 1 : -1
      x.set(direction * 300)
      vibrate('success')
      setTimeout(() => {
        onComplete()
      }, 100)
    } else {
      // Snap back to center
      x.set(0)
    }
  }, [swipeThreshold, onComplete, vibrate, x])

  const clearRipple = useCallback(() => {
    setRipple(null)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Background action bar (revealed on swipe) */}
      <motion.div
        className="absolute inset-0 rounded-full bg-sage"
        style={{ opacity: actionBarOpacity, scale: actionBarScale }}
      />

      {/* Foreground content (draggable) */}
      <motion.div
        drag={disabled ? false : 'x'}
        dragConstraints={{ left: -150, right: 150 }}
        dragElastic={0.2}
        style={{ x }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        onClick={handleTap}
        className="relative cursor-pointer"
      >
        {children}

        {/* Tap ripple effect */}
        <AnimatePresence>
          {ripple && (
            <Ripple x={ripple.x} y={ripple.y} onComplete={clearRipple} />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
