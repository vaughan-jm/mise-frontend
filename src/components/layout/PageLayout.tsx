/**
 * PageLayout Component
 *
 * Consistent page wrapper with header and footer.
 * Handles page structure and responsive layout.
 */

import { type ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'

interface PageLayoutProps {
  children: ReactNode
  showHeader?: boolean
  showFooter?: boolean
  showNav?: boolean
  centered?: boolean
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  className?: string
}

const maxWidthStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full',
}

export default function PageLayout({
  children,
  showHeader = true,
  showFooter = true,
  showNav = true,
  centered = false,
  maxWidth = '2xl',
  className = '',
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-obsidian flex flex-col">
      {/* Header */}
      {showHeader && (
        <Header
          showNav={showNav}
          className={`mx-auto w-full ${maxWidthStyles[maxWidth]}`}
        />
      )}

      {/* Main content */}
      <main
        className={`
          flex-1 w-full
          mx-auto
          ${maxWidthStyles[maxWidth]}
          ${centered ? 'flex flex-col items-center justify-center' : ''}
          ${className}
        `}
      >
        {children}
      </main>

      {/* Footer */}
      {showFooter && (
        <Footer
          className={`mx-auto w-full ${maxWidthStyles[maxWidth]}`}
        />
      )}
    </div>
  )
}
