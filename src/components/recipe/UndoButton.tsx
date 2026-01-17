/**
 * UndoButton Component
 *
 * Fixed-position undo button that appears when actions can be undone.
 * Positioned at bottom center of screen.
 *
 * Features:
 * - AnimatePresence for smooth entry/exit
 * - Only visible when canUndo is true
 * - Subtle styling that doesn't distract from cooking
 */

import { motion, AnimatePresence } from 'framer-motion'

// Undo icon
const UndoIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
    />
  </svg>
)

interface UndoButtonProps {
  canUndo: boolean
  onUndo: () => void
  label?: string
}

export default function UndoButton({
  canUndo,
  onUndo,
  label = 'undo',
}: UndoButtonProps) {
  return (
    <AnimatePresence>
      {canUndo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <button
            onClick={onUndo}
            className="
              flex items-center gap-2
              px-4 py-2
              bg-gunmetal/90
              backdrop-blur-sm
              border border-ash/30
              rounded-full
              text-sm text-ash
              hover:text-bone hover:border-ash/50
              transition-colors
              shadow-lg shadow-black/20
              lowercase
            "
          >
            <UndoIcon />
            <span>{label}</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
