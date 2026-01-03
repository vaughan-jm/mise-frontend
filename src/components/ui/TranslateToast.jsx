import React from 'react';
import colors from '../../constants/colors';
import useLanguage from '../../hooks/useLanguage';

/**
 * TranslateToast - Toast notification for translation upgrade prompt
 *
 * @param {Object} props
 * @param {boolean} props.show - Whether the toast is visible
 * @param {string} props.language - Target language code
 * @param {Function} props.onUpgrade - Callback when upgrade button is clicked
 * @param {Function} props.onDismiss - Callback when dismiss button is clicked
 */
export default function TranslateToast({ show, language, onUpgrade, onDismiss }) {
  const { t, languages } = useLanguage();

  if (!show) return null;

  const languageName = languages.find(lang => lang.code === language)?.name || language;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        zIndex: 1000,
        maxWidth: '340px',
        width: '90%',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
      role="alert"
      aria-live="polite"
    >
      <span style={{ fontSize: '24px' }} aria-hidden="true">🌍</span>
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontSize: '14px',
            color: colors.text,
            fontWeight: '500',
            marginBottom: '2px',
          }}
        >
          {t.translateTo} {languageName}?
        </p>
        <p style={{ fontSize: '12px', color: colors.muted }}>
          {t.upgradeForTranslation}
        </p>
      </div>
      <button
        onClick={onUpgrade}
        style={{
          background: colors.accent,
          color: colors.bg,
          border: 'none',
          padding: '8px 14px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
        aria-label="Upgrade to translate recipes"
      >
        $1.99/mo
      </button>
      <button
        onClick={onDismiss}
        style={{
          background: 'none',
          border: 'none',
          color: colors.muted,
          fontSize: '18px',
          cursor: 'pointer',
          padding: '0 4px',
        }}
        aria-label="Dismiss translation prompt"
      >
        ✕
      </button>
    </div>
  );
}
