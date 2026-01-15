/**
 * Input Component
 *
 * Text input with Pare styling.
 */

import { forwardRef, type InputHTMLAttributes } from 'react'

export type InputSize = 'sm' | 'md' | 'lg'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  inputSize?: InputSize
  fullWidth?: boolean
}

const sizeStyles: Record<InputSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-5 py-3 text-lg',
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      inputSize = 'md',
      fullWidth = true,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-ash mb-1.5 lowercase"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            block rounded-lg
            bg-gunmetal text-bone
            border border-ash/20
            placeholder:text-ash/60
            focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage
            disabled:bg-gunmetal/50 disabled:text-ash disabled:cursor-not-allowed
            transition-colors duration-150
            ${sizeStyles[inputSize]}
            ${fullWidth ? 'w-full' : ''}
            ${error ? 'border-rust focus:ring-rust/50 focus:border-rust' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-rust">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-ash">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
