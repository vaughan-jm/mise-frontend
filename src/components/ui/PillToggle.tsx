/**
 * PillToggle Component
 *
 * Pill-shaped two-option toggle (prep/cook).
 * Selected option highlighted with animated sliding indicator.
 *
 * Features:
 * - Pill shape matching homepage aesthetic
 * - Animated sliding background on selection
 * - Sage highlight on selected, dark on unselected
 */

import { motion } from 'framer-motion'

interface PillToggleOption {
  value: string
  label: string
}

interface PillToggleProps {
  options: [PillToggleOption, PillToggleOption]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default function PillToggle({
  options,
  value,
  onChange,
  disabled = false,
}: PillToggleProps) {
  return (
    <div
      className={`
        inline-flex
        rounded-full
        bg-obsidian
        border border-ash/20
        p-1
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      {options.map((option) => {
        const isSelected = option.value === value

        return (
          <button
            key={option.value}
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            className={`
              relative
              px-4 py-1.5
              rounded-full
              text-sm font-medium
              lowercase
              transition-colors duration-200
              ${isSelected ? 'text-obsidian' : 'text-ash hover:text-bone'}
            `}
          >
            {/* Animated background indicator */}
            {isSelected && (
              <motion.div
                layoutId="pill-toggle-indicator"
                className="absolute inset-0 z-0 bg-bone rounded-full"
                initial={false}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 30
                }}
              />
            )}

            {/* Label */}
            <span className="relative z-10">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
