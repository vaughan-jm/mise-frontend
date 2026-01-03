import React from 'react';
import c from '../../constants/colors';

/**
 * QuickRating - Simple 5-star rating component
 *
 * @param {Function} onRate - Callback when a star is clicked (star number 1-5)
 * @param {Number|null} userRating - Current rating value
 */
const QuickRating = ({ onRate, userRating }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      gap: '4px',
      marginTop: '12px'
    }}
    role="group"
    aria-label="Rate your cooking experience"
  >
    {[1, 2, 3, 4, 5].map(star => (
      <button
        key={star}
        onClick={() => onRate(star)}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          opacity: userRating >= star ? 1 : 0.3,
          transform: userRating >= star ? 'scale(1.1)' : 'scale(1)',
          transition: 'all 0.15s',
        }}
        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        aria-pressed={userRating >= star}
      >
        ★
      </button>
    ))}
  </div>
);

/**
 * CookPhase - Cooking steps phase component
 *
 * Displays cooking steps with progress tracking, inline ingredients, and completion.
 * Features undo/reset, keyboard navigation, and optional rating system.
 *
 * @param {Array} steps - List of recipe steps (strings or objects with instruction/ingredients)
 * @param {Object} completedSteps - Object with completed step indices as keys
 * @param {Function} onComplete - Callback when step is marked complete (index)
 * @param {Function} onUndo - Callback to undo last completed step
 * @param {Function} onReset - Callback to reset all steps
 * @param {Function} scaleIngredient - Function to scale ingredient text based on servings
 * @param {Object} txt - Translation strings
 * @param {Boolean} hasRatedThisSession - Whether user has rated in this session
 * @param {Function} onRate - Callback for rating (star number 1-5)
 * @param {Number|null} userRating - Current rating value
 */
const CookPhase = ({
  steps,
  completedSteps,
  onComplete,
  onUndo,
  onReset,
  scaleIngredient,
  txt,
  hasRatedThisSession,
  onRate,
  userRating
}) => {
  // Calculate remaining steps
  const remainingSteps = steps
    .map((step, i) => ({ step, i }))
    .filter(({ i }) => !completedSteps[i]);

  const stepsDone = Object.keys(completedSteps).length;

  // Handle keyboard navigation
  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onComplete(index);
    }
  };

  return (
    <div role="region" aria-label={txt.cookPhase || 'Cooking phase'}>
      {/* Progress bar with undo and reset */}
      {stepsDone > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
            padding: '10px 14px',
            background: c.accentDim,
            borderRadius: '8px'
          }}
          role="status"
          aria-live="polite"
        >
          <span style={{ fontSize: '12px' }}>
            {stepsDone} {txt.of} {steps.length}
          </span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onUndo}
              style={{
                background: 'none',
                border: 'none',
                color: c.text,
                fontSize: '12px',
                cursor: 'pointer',
                opacity: 0.8
              }}
              aria-label={txt.undoLastStep || 'Undo last step'}
            >
              {txt.undo}
            </button>
            <button
              onClick={onReset}
              style={{
                background: 'none',
                border: 'none',
                color: c.text,
                fontSize: '12px',
                cursor: 'pointer',
                opacity: 0.8
              }}
              aria-label={txt.resetAll || 'Reset all steps'}
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Instruction text */}
      {remainingSteps.length > 0 && (
        <p
          style={{
            fontSize: '12px',
            color: c.muted,
            marginBottom: '12px',
            textAlign: 'center'
          }}
        >
          {txt.tapStep}
        </p>
      )}

      {/* Completion state */}
      {remainingSteps.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '30px 20px',
            background: c.card,
            borderRadius: '12px',
            border: `1px solid ${c.border}`
          }}
          role="status"
          aria-live="polite"
        >
          <span
            style={{
              fontSize: '28px',
              display: 'block',
              marginBottom: '10px'
            }}
            aria-hidden="true"
          >
            🎉
          </span>
          <p style={{ fontSize: '15px', fontWeight: '500', marginBottom: '6px' }}>
            {txt.allDone}
          </p>
          <p style={{ fontSize: '13px', color: c.muted, marginBottom: '12px' }}></p>

          {/* Quick rating - only show if not rated this session */}
          {!hasRatedThisSession && (
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: c.dim, marginBottom: '4px' }}>
                {txt.rateExperience}
              </p>
              <QuickRating onRate={onRate} userRating={userRating} />
            </div>
          )}
          {hasRatedThisSession && (
            <p style={{ fontSize: '12px', color: c.accent, marginBottom: '16px' }}>
              Thanks for rating! 💚
            </p>
          )}

          <button
            onClick={onReset}
            style={{
              background: c.cardHover,
              border: `1px solid ${c.border}`,
              color: c.text,
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
            aria-label={txt.cookAgain || 'Cook this recipe again'}
          >
            Cook Again
          </button>
        </div>
      ) : (
        /* Steps list */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
          role="list"
          aria-label={txt.stepsList || 'Cooking steps'}
        >
          {remainingSteps.map(({ step, i }, idx) => {
            const instruction = typeof step === 'object' ? step.instruction : step;
            const stepIngredients = typeof step === 'object' ? step.ingredients : [];

            return (
              <div
                key={i}
                role="listitem"
                onClick={() => onComplete(i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                tabIndex={0}
                style={{
                  padding: '16px',
                  background: idx === 0 ? c.card : c.bg,
                  borderRadius: '12px',
                  border: `1px solid ${idx === 0 ? c.accent : c.border}`,
                  cursor: 'pointer'
                }}
                aria-label={`Step ${i + 1}: ${instruction}`}
                aria-current={idx === 0 ? 'step' : undefined}
              >
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      background: idx === 0 ? c.accent : c.cardHover,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: '11px',
                      fontWeight: '600',
                      color: idx === 0 ? c.bg : c.muted
                    }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <span
                    style={{
                      fontSize: '14px',
                      lineHeight: 1.6,
                      color: idx === 0 ? c.text : c.muted
                    }}
                  >
                    {instruction}
                  </span>
                </div>

                {/* Inline ingredients for this step */}
                {stepIngredients?.length > 0 && (
                  <div
                    style={{
                      marginTop: '12px',
                      marginLeft: '36px',
                      padding: '10px 12px',
                      background: c.ingredientBg,
                      borderRadius: '8px',
                      border: `1px solid ${c.ingredientBorder}`
                    }}
                    role="complementary"
                    aria-label="Ingredients needed for this step"
                  >
                    <p
                      style={{
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: c.accent,
                        marginBottom: '6px',
                        fontWeight: '600'
                      }}
                    >
                      You'll need:
                    </p>
                    {stepIngredients.map((ing, j) => (
                      <p
                        key={j}
                        style={{
                          fontSize: '13px',
                          color: c.text,
                          marginBottom: j < stepIngredients.length - 1 ? '4px' : 0,
                          lineHeight: 1.4
                        }}
                      >
                        • {scaleIngredient(ing)}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CookPhase;
