import React, { useState, useEffect } from 'react';
import colors from '../../constants/colors';
import useLanguage from '../../hooks/useLanguage';

/**
 * FeedbackModal - Modal for collecting user feedback and feature suggestions
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onSubmit - Async function to handle feedback submission (receives feedback text)
 * @param {string} [props.userEmail] - Optional user email for notification message
 */
export default function FeedbackModal({ isOpen, onClose, onSubmit, userEmail }) {
  const { t } = useLanguage();
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFeedbackText('');
      setFeedbackSent(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!feedbackText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(feedbackText);
      setFeedbackSent(true);
      setFeedbackText('');

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: colors.bg,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: colors.text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: colors.card,
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${colors.border}`,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: colors.muted,
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '16px',
            padding: 0,
          }}
          aria-label="Close feedback modal"
        >
          {t.back}
        </button>

        {feedbackSent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }} role="status">
            <span style={{ fontSize: '32px' }} aria-hidden="true">💚</span>
            <p style={{ fontSize: '16px', marginTop: '12px' }}>
              {t.thanksFeedbackLong}
            </p>
          </div>
        ) : (
          <>
            <h2
              id="feedback-modal-title"
              style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}
            >
              {t.gotAnIdea}
            </h2>
            <p
              style={{
                fontSize: '13px',
                color: colors.muted,
                marginBottom: '16px',
                lineHeight: 1.5,
              }}
            >
              {t.weShipWeekly}
              {userEmail && (
                <span style={{ display: 'block', marginTop: '4px', color: colors.dim }}>
                  {t.weWillNotify}
                </span>
              )}
            </p>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.whatWouldMakeBetter}
              style={{
                width: '100%',
                height: '100px',
                padding: '12px',
                fontSize: '14px',
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                color: colors.text,
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              aria-label="Feedback text"
              disabled={isSubmitting}
            />
            <button
              onClick={handleSubmit}
              disabled={!feedbackText.trim() || isSubmitting}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: '500',
                background: feedbackText.trim() && !isSubmitting ? colors.accent : colors.dim,
                color: colors.bg,
                border: 'none',
                borderRadius: '8px',
                cursor: feedbackText.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
              }}
              aria-label="Submit feedback"
            >
              {isSubmitting ? '...' : t.send}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
