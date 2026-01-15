/**
 * TabSwitcher Component
 *
 * Segmented control for switching between options.
 * Used for URL/Photo/Video and Prep/Cook tabs.
 */

import { motion } from 'framer-motion'
import { type ReactNode } from 'react'

export interface Tab<T extends string> {
  id: T
  label: string
  icon?: ReactNode
}

interface TabSwitcherProps<T extends string> {
  tabs: Tab<T>[]
  activeTab: T
  onChange: (tab: T) => void
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  className?: string
}

const sizeStyles = {
  sm: 'text-sm py-1.5 px-3',
  md: 'text-base py-2 px-4',
  lg: 'text-lg py-2.5 px-5',
}

export default function TabSwitcher<T extends string>({
  tabs,
  activeTab,
  onChange,
  size = 'md',
  fullWidth = false,
  className = '',
}: TabSwitcherProps<T>) {
  return (
    <div
      className={`
        inline-flex items-center gap-1
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              relative flex items-center justify-center gap-2
              font-medium lowercase rounded-md
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-sage/50
              ${sizeStyles[size]}
              ${fullWidth ? 'flex-1' : ''}
              ${isActive ? 'text-obsidian' : 'text-ash hover:text-bone border border-ash/10'}
            `}
          >
            {/* Active background */}
            {isActive && (
              <motion.div
                layoutId="tab-active-bg"
                className="absolute inset-0 bg-sage rounded-md"
                transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
              />
            )}

            {/* Content */}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
