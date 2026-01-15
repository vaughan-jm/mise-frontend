/**
 * Button Component
 *
 * Primary UI button with variants and loading state.
 * Uses Pare sage accent color.
 */

import { forwardRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import Spinner from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
  children: ReactNode
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-sage text-obsidian hover:bg-sage-hover active:bg-sage-hover disabled:bg-ash disabled:text-gunmetal',
  secondary:
    'bg-transparent border border-sage text-sage hover:bg-sage/10 active:bg-sage/20 disabled:border-ash disabled:text-ash',
  ghost:
    'bg-transparent text-ash hover:text-bone hover:bg-gunmetal active:bg-gunmetal/80 disabled:text-ash/50',
  danger:
    'bg-rust text-bone hover:bg-rust/80 active:bg-rust/70 disabled:bg-ash disabled:text-gunmetal',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className = '',
      disabled,
      type = 'button',
      onClick,
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading

    return (
      <motion.button
        ref={ref}
        type={type}
        whileTap={{ scale: isDisabled ? 1 : 0.98 }}
        className={`
          inline-flex items-center justify-center gap-2
          font-medium lowercase rounded-lg
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-sage/50 focus:ring-offset-2 focus:ring-offset-obsidian
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
        disabled={isDisabled}
        onClick={onClick}
      >
        {isLoading ? (
          <>
            <Spinner size="sm" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export default Button
