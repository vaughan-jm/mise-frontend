/**
 * Footer Component
 *
 * App footer with legal links and contact.
 */

import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

interface FooterProps {
  className?: string
}

export default function Footer({ className = '' }: FooterProps) {
  const { t } = useApp()

  const links = [
    { label: t.privacy, href: '/privacy' },
    { label: t.terms, href: '/terms' },
    { label: t.contact, href: '/contact' },
  ]

  return (
    <footer
      className={`
        flex flex-wrap items-center justify-center gap-4
        px-4 py-4
        text-sm text-ash
        ${className}
      `}
    >
      {links.map((link, index) => (
        <span key={link.href} className="flex items-center gap-4">
          <Link
            to={link.href}
            className="hover:text-bone transition-colors lowercase"
          >
            {link.label}
          </Link>
          {index < links.length - 1 && (
            <span className="text-ash/30">·</span>
          )}
        </span>
      ))}
    </footer>
  )
}
