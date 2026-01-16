/**
 * Header Component
 *
 * Minimal header: Logo + "pare" + v1.0 badge on left, auth on right.
 * Present on all pages, links to homepage.
 */

import { Link, useLocation } from 'react-router-dom'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import logoSvg from '../../assets/brand/icon-only-dark-mode-cropped.svg'

interface HeaderProps {
  className?: string
}

export default function Header({ className = '' }: HeaderProps) {
  const { pathname } = useLocation()
  const isHomepage = pathname === '/'

  return (
    <header
      className={`
        flex items-center justify-between
        px-4 py-3
        ${className}
      `}
    >
      {/* Left: Logo + "pare" + version badge - links to home */}
      <Link to="/" className="flex items-center gap-2 group">
        <img src={logoSvg} alt="Pare" className="h-8 w-auto" />
        {!isHomepage && (
          <span className="text-xl font-bold text-bone lowercase group-hover:text-sage transition-colors">
            pare
          </span>
        )}
        <span className="text-[10px] bg-ash/20 text-ash px-2 py-0.5 rounded-full">
          v1.0
        </span>
      </Link>

      {/* Right: Auth */}
      <SignedIn>
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: 'w-8 h-8',
            },
          }}
        >
          <UserButton.MenuItems>
            <UserButton.Link
              label="Cookbook"
              labelIcon={<CookbookIcon />}
              href="/cookbook"
            />
          </UserButton.MenuItems>
        </UserButton>
      </SignedIn>

      <SignedOut>
        <SignInButton mode="modal">
          <button className="px-4 py-2 text-sm text-ash bg-gunmetal border border-ash/20 rounded-full hover:border-sage hover:text-bone transition-colors lowercase">
            sign in
          </button>
        </SignInButton>
      </SignedOut>
    </header>
  )
}

// Simple cookbook icon for UserButton menu
function CookbookIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}
