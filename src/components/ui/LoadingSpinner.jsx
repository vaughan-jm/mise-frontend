import React from 'react';
import styles from './styles.module.css';

/**
 * LoadingSpinner component
 *
 * A reusable loading spinner with customizable size
 *
 * @param {string} size - The size variant: 'small', 'medium', 'large' (default: 'medium')
 * @param {string} className - Additional CSS classes to apply
 * @param {string} label - Accessible label for screen readers (default: 'Loading')
 */
const LoadingSpinner = ({
  size = 'medium',
  className = '',
  label = 'Loading'
}) => {
  const sizeClass = {
    small: styles.spinnerSmall,
    medium: styles.spinnerMedium,
    large: styles.spinnerLarge
  }[size] || styles.spinnerMedium;

  return (
    <div
      className={`${sizeClass} ${className}`}
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
};

/**
 * LoadingScreen component
 *
 * A full-screen loading indicator with optional message
 *
 * @param {string} message - The loading message to display
 * @param {string} submessage - Additional smaller text below the main message
 */
export const LoadingScreen = ({
  message = 'Loading...',
  submessage = ''
}) => {
  return (
    <div
      style={{
        padding: '60px 20px',
        textAlign: 'center'
      }}
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner size="large" />
      {message && (
        <p style={{
          color: 'var(--color-text)',
          fontSize: '15px',
          marginTop: '20px',
          marginBottom: '8px',
          minHeight: '24px'
        }}>
          {message}
        </p>
      )}
      {submessage && (
        <p style={{
          color: 'var(--color-muted)',
          fontSize: '12px'
        }}>
          {submessage}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
