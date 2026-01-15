/**
 * Header Component
 *
 * App header with logo, navigation, and auth.
 * Uses Clerk for authentication UI.
 */

import { Link, useLocation } from 'react-router-dom'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { useApp } from '../../context/AppContext'

interface HeaderProps {
  showNav?: boolean
  className?: string
}

export default function Header({ showNav = true, className = '' }: HeaderProps) {
  const { t, quota, isSignedIn } = useApp()
  const location = useLocation()

  // Don't show certain nav items on specific pages
  const isHomePage = location.pathname === '/'

  return (
    <header
      className={`
        flex items-center justify-between
        px-4 py-3
        ${className}
      `}
    >
      {/* Logo */}
      <Link
        to="/"
        className="text-xl font-bold text-bone lowercase hover:text-sage transition-colors"
      >
        {t.appName}
      </Link>

      {/* Right side: nav + auth */}
      <div className="flex items-center gap-4">
        {/* Quota indicator (when signed in and not on home page) */}
        {showNav && isSignedIn && !isHomePage && (
          <span className="text-sm text-ash">
            {quota.remaining === Infinity
              ? t.unlimited
              : `${quota.remaining} ${t.recipesRemaining.split(' ').slice(1).join(' ')}`}
          </span>
        )}

        {/* Navigation links */}
        {showNav && (
          <nav className="flex items-center gap-3">
            <SignedIn>
              <Link
                to="/cookbook"
                className="text-sm text-ash hover:text-bone transition-colors lowercase"
              >
                {t.cookbook}
              </Link>
            </SignedIn>

            <Link
              to="/pricing"
              className="text-sm text-ash hover:text-bone transition-colors lowercase"
            >
              {t.pricing}
            </Link>
          </nav>
        )}

        {/* Auth */}
        <SignedIn>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: 'w-8 h-8',
              },
            }}
          />
        </SignedIn>

        <SignedOut>
          <SignInButton mode="modal">
            <button className="text-sm text-ash hover:text-bone transition-colors lowercase">
              {t.signIn}
            </button>
          </SignInButton>
        </SignedOut>
      </div>
    </header>
  )
}
