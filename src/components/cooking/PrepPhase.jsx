import React from 'react';
import c from '../../constants/colors';

/**
 * PrepPhase - Ingredient gathering phase component
 *
 * Displays a list of ingredients for the user to gather before cooking.
 * Features progress tracking, completion states, and keyboard navigation.
 *
 * @param {Array} ingredients - List of recipe ingredients
 * @param {Object} completedIngredients - Object with completed ingredient indices as keys
 * @param {Function} onComplete - Callback when ingredient is marked complete (index)
 * @param {Function} onUndo - Callback to undo last completed ingredient
 * @param {Function} scaleIngredient - Function to scale ingredient text based on servings
 * @param {Object} txt - Translation strings
 */
const PrepPhase = ({
  ingredients,
  completedIngredients,
  onComplete,
  onUndo,
  scaleIngredient,
  txt
}) => {
  // Calculate remaining ingredients
  const remainingIngredients = ingredients
    .map((ing, i) => ({ ing, i }))
    .filter(({ i }) => !completedIngredients[i]);

  const ingredientsDone = Object.keys(completedIngredients).length;

  // Handle keyboard navigation
  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onComplete(index);
    }
  };

  return (
    <div role="region" aria-label={txt.prepPhase || 'Preparation phase'}>
      {/* Progress bar */}
      {ingredientsDone > 0 && (
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
            {ingredientsDone} {txt.of} {ingredients.length} {txt.gathered}
          </span>
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
            aria-label={txt.undoLastIngredient || 'Undo last ingredient'}
          >
            {txt.undo}
          </button>
        </div>
      )}

      {/* Instruction text */}
      {remainingIngredients.length > 0 && (
        <p
          style={{
            fontSize: '12px',
            color: c.muted,
            marginBottom: '12px',
            textAlign: 'center'
          }}
        >
          {txt.tapIngredient}
        </p>
      )}

      {/* Completion state */}
      {remainingIngredients.length === 0 ? (
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
            ✅
          </span>
          <p style={{ fontSize: '15px', fontWeight: '500', marginBottom: '6px' }}>
            {txt.allGathered}
          </p>
          <p style={{ fontSize: '13px', color: c.muted }}>
            {txt.startCooking}
          </p>
        </div>
      ) : (
        /* Ingredient list */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
          role="list"
          aria-label={txt.ingredientsList || 'Ingredients to gather'}
        >
          {remainingIngredients.map(({ ing, i }, idx) => (
            <div
              key={i}
              role="listitem"
              onClick={() => onComplete(i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              tabIndex={0}
              style={{
                padding: '14px 16px',
                background: idx === 0 ? c.card : c.bg,
                borderRadius: '10px',
                border: `1px solid ${idx === 0 ? c.accent : c.border}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              aria-label={`Ingredient ${idx + 1}: ${scaleIngredient(ing)}`}
              aria-current={idx === 0 ? 'true' : undefined}
            >
              <span
                style={{
                  width: '22px',
                  height: '22px',
                  background: idx === 0 ? c.accent : c.cardHover,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: idx === 0 ? c.bg : c.muted
                }}
                aria-hidden="true"
              >
                {idx + 1}
              </span>
              <span
                style={{
                  fontSize: '14px',
                  lineHeight: 1.5,
                  color: idx === 0 ? c.text : c.muted
                }}
              >
                {scaleIngredient(ing)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PrepPhase;
