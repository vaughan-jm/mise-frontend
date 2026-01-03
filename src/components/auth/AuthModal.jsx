import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import colors from '../../constants/colors.js';
import { AUTH_MODES } from '../../constants/index.js';
import GoogleSignIn from './GoogleSignIn.jsx';

/**
 * AuthModal Component
 * Main authentication modal with login/signup modes
 *
 * @param {boolean} isOpen - Whether the modal is open
 * @param {Function} onClose - Callback to close the modal
 * @param {string} initialMode - Initial auth mode ('login' or 'signup')
 */
export default function AuthModal({ isOpen, onClose, initialMode = AUTH_MODES.LOGIN }) {
  const { login, register, loginWithGoogle } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailInputRef = useRef(null);
  const modalRef = useRef(null);

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setEmail('');
      setPassword('');
      setError('');
      setLoading(false);
    }
  }, [isOpen, initialMode]);

  // Focus email input when modal opens
  useEffect(() => {
    if (isOpen && emailInputRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => emailInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle click outside modal to close
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle email/password authentication
  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email and password required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = mode === AUTH_MODES.SIGNUP
        ? await register(email, password)
        : await login(email, password);

      if (result.error) {
        setError(result.error);
      } else {
        // Success - clear form and close modal
        setEmail('');
        setPassword('');
        onClose();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google authentication
  const handleGoogleSuccess = async (response) => {
    setLoading(true);
    setError('');

    try {
      const result = await loginWithGoogle(response.credential);

      if (result.error) {
        setError(result.error);
      } else {
        // Success - close modal
        onClose();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google authentication error
  const handleGoogleError = (errorMessage) => {
    setError(errorMessage || 'Google Sign-In failed');
  };

  // Handle Enter key in password field
  const handlePasswordKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleAuth();
    }
  };

  // Toggle between login and signup
  const toggleMode = () => {
    setMode(mode === AUTH_MODES.LOGIN ? AUTH_MODES.SIGNUP : AUTH_MODES.LOGIN);
    setError('');
  };

  if (!isOpen) return null;

  const isLoginMode = mode === AUTH_MODES.LOGIN;

  return (
    <div
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        minHeight: '100vh',
        background: colors.bg,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: colors.text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 1000,
      }}
    >
      <div
        ref={modalRef}
        style={{
          width: '100%',
          maxWidth: '340px',
          background: colors.card,
          borderRadius: '16px',
          padding: '28px 24px',
          border: `1px solid ${colors.border}`,
        }}
      >
        {/* Back button */}
        <button
          onClick={onClose}
          aria-label="Close authentication modal"
          style={{
            background: 'none',
            border: 'none',
            color: colors.muted,
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '16px',
            padding: 0,
          }}
        >
          ← {t.back || 'Back'}
        </button>

        {/* Title and subtitle */}
        <h2
          id="auth-modal-title"
          style={{
            fontSize: '22px',
            fontWeight: '600',
            marginBottom: '6px',
          }}
        >
          {isLoginMode ? t.welcomeBack : t.createAccount}
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: colors.muted,
            marginBottom: '24px',
          }}
        >
          {isLoginMode
            ? 'Sign in to access saved recipes'
            : 'Get 3 free recipes every month'}
        </p>

        {/* Google Sign-In */}
        <GoogleSignIn
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
        />

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '16px',
            marginBottom: '16px',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: colors.border }} />
          <span style={{ fontSize: '12px', color: colors.muted }}>or</span>
          <div style={{ flex: 1, height: '1px', background: colors.border }} />
        </div>

        {/* Email input */}
        <input
          ref={emailInputRef}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.email}
          aria-label="Email address"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 14px',
            fontSize: '15px',
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            color: colors.text,
            marginBottom: '12px',
            outline: 'none',
            boxSizing: 'border-box',
            opacity: loading ? 0.6 : 1,
          }}
        />

        {/* Password input */}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handlePasswordKeyDown}
          placeholder={t.password}
          aria-label="Password"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 14px',
            fontSize: '15px',
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            color: colors.text,
            marginBottom: '16px',
            outline: 'none',
            boxSizing: 'border-box',
            opacity: loading ? 0.6 : 1,
          }}
        />

        {/* Error message */}
        {error && (
          <p
            role="alert"
            aria-live="polite"
            style={{
              color: colors.error,
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {error}
          </p>
        )}

        {/* Submit button */}
        <button
          onClick={handleAuth}
          disabled={loading}
          aria-label={isLoginMode ? 'Sign in' : 'Create account'}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '15px',
            fontWeight: '600',
            background: colors.accent,
            color: colors.bg,
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'wait' : 'pointer',
            marginBottom: '16px',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '...' : (isLoginMode ? t.signIn : t.createAccount)}
        </button>

        {/* Toggle mode */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '14px',
            color: colors.muted,
          }}
        >
          {isLoginMode ? t.needAccount : t.haveAccount}
          <button
            onClick={toggleMode}
            disabled={loading}
            aria-label={isLoginMode ? 'Switch to sign up' : 'Switch to sign in'}
            style={{
              background: 'none',
              border: 'none',
              color: colors.accent,
              cursor: loading ? 'wait' : 'pointer',
              fontSize: '14px',
              padding: 0,
              marginLeft: '4px',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {isLoginMode ? t.createAccount : t.signIn}
          </button>
        </p>

        {/* Trust messaging */}
        <div
          style={{
            marginTop: '20px',
            padding: '12px',
            background: colors.bg,
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              color: colors.dim,
              lineHeight: 1.5,
            }}
          >
            🔒 We never share your email or data.<br />
            Secure payments via Stripe. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
