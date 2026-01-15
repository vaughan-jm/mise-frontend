/**
 * Pare Design Tokens
 * "Cast Iron & Steam" palette
 *
 * Change values here to update the entire app.
 * These are also exported to tailwind.config.js
 */

export const colors = {
  // Backgrounds
  obsidian: '#121212',    // Main background
  gunmetal: '#1E1E1E',    // Cards, elevated surfaces

  // Text
  bone: '#E0E0E0',        // Primary text
  ash: '#A0A0A0',         // Secondary text, muted

  // Accent
  sage: '#8F9E8B',        // Primary accent (Pare logo green)
  sageHover: '#7A8977',   // Accent hover state

  // Semantic
  rust: '#8B4A4A',        // Errors, destructive actions
} as const

export const fonts = {
  sans: ['Inter', 'system-ui', 'sans-serif'],
} as const

export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
} as const

export const borderRadius = {
  sm: '0.25rem',    // 4px
  md: '0.5rem',     // 8px
  lg: '1rem',       // 16px
  full: '9999px',
} as const

export const transitions = {
  fast: '150ms ease',
  normal: '200ms ease',
  slow: '300ms ease',
} as const

// CSS variable names for use in index.css
export const cssVariables = {
  '--color-obsidian': colors.obsidian,
  '--color-gunmetal': colors.gunmetal,
  '--color-bone': colors.bone,
  '--color-ash': colors.ash,
  '--color-sage': colors.sage,
  '--color-sage-hover': colors.sageHover,
  '--color-rust': colors.rust,
} as const
