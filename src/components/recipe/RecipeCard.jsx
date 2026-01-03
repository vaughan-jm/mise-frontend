import React from 'react';
import colors from '../../constants/colors.js';
import Attribution from './Attribution.jsx';

/**
 * RecipeCard component - displays recipe details with image, title, times, and servings adjuster
 * @param {Object} recipe - Recipe object
 * @param {number} servings - Current servings count
 * @param {boolean} isScaled - Whether servings are scaled
 * @param {boolean} isSaved - Whether recipe is saved
 * @param {function} onSave - Callback to save recipe
 * @param {function} onAdjustServings - Callback to adjust servings
 * @param {function} onTranslate - Callback to translate recipe
 * @param {boolean} translating - Translation loading state
 * @param {object} txt - Translations object
 * @param {boolean} user - User logged in state
 * @param {boolean} savingRecipe - Save loading state
 */
export default function RecipeCard({
  recipe,
  servings,
  isScaled = false,
  isSaved = false,
  onSave,
  onAdjustServings,
  onTranslate,
  translating = false,
  txt = {},
  user = null,
  savingRecipe = false,
  onBack
}) {
  const adjustServings = (delta) => {
    const newServings = servings + delta;
    if (newServings >= 1 && newServings <= 20) {
      onAdjustServings(newServings);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '16px', position: 'relative' }}>
      {/* Translating overlay */}
      {translating && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `${colors.bg}dd`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            borderRadius: '12px',
          }}
          role="status"
          aria-live="polite"
          aria-label="Translating recipe"
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                border: `2px solid ${colors.border}`,
                borderTopColor: colors.accent,
                borderRadius: '50%',
                margin: '0 auto 12px',
                animation: 'spin 0.7s linear infinite'
              }}
              aria-hidden="true"
            />
            <p style={{ color: colors.text, fontSize: '14px' }}>Translating...</p>
          </div>
        </div>
      )}

      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: colors.muted,
          fontSize: '13px',
          cursor: 'pointer',
          marginBottom: '12px',
          padding: 0
        }}
        aria-label="Go back to new recipe"
      >
        {txt.newRecipe || '← New recipe'}
      </button>

      {/* Recipe image */}
      {recipe.imageUrl && (
        <div
          style={{
            width: '100%',
            height: '140px',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '16px',
            background: `url(${recipe.imageUrl}) center/cover`
          }}
          role="img"
          aria-label={`${recipe.title} image`}
        />
      )}

      {/* Title and save button */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0, lineHeight: 1.3 }}>
            {recipe.title}
          </h2>
          {user && !isSaved && (
            <button
              onClick={onSave}
              disabled={savingRecipe}
              aria-label={savingRecipe ? 'Saving recipe' : 'Save recipe'}
              style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                color: colors.text,
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: savingRecipe ? 'wait' : 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {savingRecipe ? (txt.saving || 'Saving...') : `💾 ${txt.save || 'Save'}`}
            </button>
          )}
          {user && isSaved && (
            <span
              style={{
                background: colors.accentDim,
                color: colors.text,
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                flexShrink: 0
              }}
              role="status"
              aria-label="Recipe saved"
            >
              ✓ {txt.saved || 'Saved'}
            </span>
          )}
        </div>

        {/* Prep/cook times */}
        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: colors.muted, marginTop: '8px' }}>
          {recipe.prepTime && (
            <span aria-label={`Prep time: ${recipe.prepTime}`}>⏱ {recipe.prepTime}</span>
          )}
          {recipe.cookTime && (
            <span aria-label={`Cook time: ${recipe.cookTime}`}>🔥 {recipe.cookTime}</span>
          )}
        </div>

        {/* Sign in to save prompt */}
        {!user && (
          <button
            onClick={onSave}
            style={{
              marginTop: '8px',
              background: 'none',
              border: 'none',
              color: colors.accent,
              fontSize: '12px',
              cursor: 'pointer',
              padding: 0
            }}
            aria-label="Sign in to save this recipe"
          >
            {txt.signInToSave || 'Sign in to save →'}
          </button>
        )}
      </div>

      {/* Attribution */}
      <Attribution recipe={recipe} />

      {/* Servings adjuster */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          padding: '12px',
          background: colors.card,
          borderRadius: '10px',
          marginBottom: '20px',
          border: `1px solid ${colors.border}`
        }}
        role="group"
        aria-label="Servings adjustment"
      >
        <span style={{ fontSize: '12px', color: colors.muted }}>
          {txt.servings || 'Servings'}
        </span>
        <button
          onClick={() => adjustServings(-1)}
          disabled={servings <= 1}
          aria-label="Decrease servings"
          style={{
            width: '28px',
            height: '28px',
            background: colors.cardHover,
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            color: colors.text,
            fontSize: '14px',
            cursor: servings <= 1 ? 'not-allowed' : 'pointer',
            opacity: servings <= 1 ? 0.5 : 1
          }}
        >
          −
        </button>
        <span
          style={{ fontSize: '16px', fontWeight: '600', minWidth: '20px', textAlign: 'center' }}
          aria-live="polite"
          aria-atomic="true"
        >
          {servings}
        </span>
        <button
          onClick={() => adjustServings(1)}
          disabled={servings >= 20}
          aria-label="Increase servings"
          style={{
            width: '28px',
            height: '28px',
            background: colors.cardHover,
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            color: colors.text,
            fontSize: '14px',
            cursor: servings >= 20 ? 'not-allowed' : 'pointer',
            opacity: servings >= 20 ? 0.5 : 1
          }}
        >
          +
        </button>
        {isScaled && (
          <span
            style={{ fontSize: '10px', color: colors.accent }}
            role="status"
            aria-label="Servings scaled from original"
          >
            {txt.scaled || 'scaled'}
          </span>
        )}
      </div>
    </div>
  );
}
