import React from 'react';
import MiseLogo from './MiseLogo';
import colors from '../../constants/colors.js';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Header component for mise-frontend
 *
 * @param {Object} props
 * @param {Object} props.ratingsSummary - Optional ratings summary object with text property
 * @param {Function} props.onShowSaved - Callback to show saved recipes
 * @param {Function} props.onShowAuth - Callback to show authentication modal
 * @param {Function} props.onShowPricing - Callback to show pricing modal
 * @param {Function} props.onLogoClick - Callback when logo is clicked (resets to home)
 * @param {Array} props.savedRecipes - Array of saved recipes for count display
 */
export default function Header({
  ratingsSummary,
  onShowSaved,
  onShowAuth,
  onShowPricing,
  onLogoClick,
  savedRecipes = []
}) {
  const { language, setLanguage, t, languages } = useLanguage();
  const { user, recipesRemaining, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    }
  };

  return (
    <header
      style={styles.header}
      role="banner"
    >
      {/* Left section: Logo and branding */}
      <div
        onClick={handleLogoClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleLogoClick();
          }
        }}
        style={styles.logoSection}
        role="button"
        tabIndex={0}
        aria-label="Return to home"
      >
        <MiseLogo size={28} />
        <span style={styles.brandText}>mise</span>

        {/* Discreet rating display */}
        {ratingsSummary && (
          <span style={styles.ratingText} aria-label={`Rating summary: ${ratingsSummary.text}`}>
            {ratingsSummary.text}
          </span>
        )}
      </div>

      {/* Right section: Controls and user actions */}
      <div style={styles.controls}>
        {/* Language selector */}
        <select
          value={language}
          onChange={handleLanguageChange}
          style={styles.languageSelect}
          aria-label="Select language"
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>

        {/* Recipes remaining counter */}
        <span
          style={styles.recipesCounter}
          aria-label={`${recipesRemaining === Infinity ? 'Unlimited' : recipesRemaining} ${t.recipesLeft}`}
        >
          {recipesRemaining === Infinity ? '∞' : recipesRemaining} {t.recipesLeft}
        </span>

        {/* User actions */}
        {user ? (
          <>
            {/* Saved recipes button */}
            <button
              onClick={onShowSaved}
              style={styles.savedButton}
              aria-label={`View saved recipes (${savedRecipes.length} saved)`}
            >
              📚 {savedRecipes.length}
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              style={styles.logoutButton}
              aria-label="Log out"
            >
              {t.logout}
            </button>
          </>
        ) : (
          <>
            {/* Sign in button */}
            <button
              onClick={onShowAuth}
              style={styles.signInButton}
              aria-label="Sign in to your account"
            >
              {t.signIn}
            </button>
          </>
        )}
      </div>
    </header>
  );
}

// Organized inline styles matching the original dark theme
const styles = {
  header: {
    padding: '12px 16px',
    borderBottom: `1px solid ${colors.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    background: colors.bg,
    zIndex: 100,
  },

  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    outline: 'none',
  },

  brandText: {
    fontSize: '17px',
    fontWeight: '300',
    letterSpacing: '-0.5px',
    color: colors.text,
  },

  ratingText: {
    fontSize: '11px',
    color: colors.dim,
    marginLeft: '4px',
  },

  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },

  languageSelect: {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    color: colors.muted,
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    minWidth: '42px',
    textAlign: 'center',
    outline: 'none',
  },

  recipesCounter: {
    fontSize: '11px',
    color: colors.muted,
    background: colors.card,
    padding: '4px 8px',
    borderRadius: '4px',
  },

  savedButton: {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    color: colors.text,
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
    outline: 'none',
  },

  logoutButton: {
    background: 'none',
    border: 'none',
    color: colors.muted,
    fontSize: '12px',
    cursor: 'pointer',
    outline: 'none',
  },

  signInButton: {
    background: colors.accent,
    border: 'none',
    color: colors.bg,
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    outline: 'none',
  },
};
