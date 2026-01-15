/**
 * Card Component
 *
 * Container card with Pare gunmetal styling.
 * Optional Framer Motion animations.
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'interactive' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  animate?: boolean
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

const variantStyles = {
  default: 'bg-gunmetal',
  interactive: 'bg-gunmetal hover:bg-gunmetal/80 cursor-pointer active:scale-[0.99]',
  elevated: 'bg-gunmetal shadow-lg shadow-black/20',
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      animate = false,
      className = '',
      onClick,
      ...props
    },
    ref
  ) => {
    const baseClasses = `
      rounded-lg
      transition-all duration-150
      ${variantStyles[variant]}
      ${paddingStyles[padding]}
      ${className}
    `

    if (animate) {
      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          whileTap={variant === 'interactive' ? { scale: 0.98 } : undefined}
          className={baseClasses}
          onClick={onClick}
          {...(props as HTMLMotionProps<'div'>)}
        >
          {children}
        </motion.div>
      )
    }

    return (
      <div ref={ref} className={baseClasses} onClick={onClick} {...props}>
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export default Card
