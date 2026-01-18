/**
 * PillToggle Component
 *
 * Pill-shaped two-option toggle (prep/cook).
 * Selected option highlighted with CSS transition for cross-browser reliability.
 *
 * Features:
 * - Pill shape matching homepage aesthetic
 * - Background transition on selection
 * - Bone highlight on selected, dark on unselected
 */

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
              px-4 py-1.5
              rounded-full
              text-sm font-medium
              lowercase
              transition-all duration-200
              ${isSelected
                ? 'bg-bone text-obsidian'
                : 'bg-transparent text-ash hover:text-bone'}
            `}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
