import React from 'react';
import colors from '../../constants/colors.js';

/**
 * RecipeList component - displays saved recipes with cook/delete actions
 * @param {Array} recipes - Array of saved recipe objects
 * @param {function} onLoad - Callback when recipe is loaded for cooking
 * @param {function} onDelete - Callback when recipe is deleted
 * @param {function} onBack - Callback when back button is clicked
 * @param {object} txt - Translations object
 */
export default function RecipeList({
  recipes = [],
  onLoad,
  onDelete,
  onBack,
  txt = {}
}) {
  return (
    <div
      style={{ minHeight: '100vh', background: colors.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: colors.text }}
    >
      {/* Header */}
      <header
        style={{
          padding: '14px 20px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: colors.muted,
            fontSize: '14px',
            cursor: 'pointer',
            padding: 0
          }}
          aria-label="Go back to main page"
        >
          {txt.back || '← Back'}
        </button>
        <span
          style={{ fontSize: '13px', color: colors.muted }}
          aria-live="polite"
          aria-atomic="true"
        >
          {recipes.length} {txt.recipes || 'recipes'}
        </span>
      </header>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
          {txt.savedRecipes || 'Saved Recipes'}
        </h2>

        {recipes.length === 0 ? (
          <p
            style={{ color: colors.muted, textAlign: 'center', padding: '40px 0' }}
            role="status"
          >
            {txt.noSavedRecipes || 'No saved recipes yet'}
          </p>
        ) : (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            role="list"
            aria-label="Saved recipes"
          >
            {recipes.map(r => (
              <div
                key={r.id}
                style={{
                  background: colors.card,
                  borderRadius: '10px',
                  border: `1px solid ${colors.border}`,
                  overflow: 'hidden',
                  display: 'flex'
                }}
                role="listitem"
              >
                {/* Recipe thumbnail */}
                {r.imageUrl && (
                  <div
                    style={{
                      width: '72px',
                      height: '72px',
                      flexShrink: 0,
                      background: `url(${r.imageUrl}) center/cover`
                    }}
                    role="img"
                    aria-label={`${r.title} thumbnail`}
                  />
                )}

                {/* Recipe info */}
                <div
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <h3
                    style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '2px',
                      lineHeight: 1.3
                    }}
                  >
                    {r.title}
                  </h3>
                  <p style={{ fontSize: '11px', color: colors.muted }}>
                    {r.source || 'Cookbook'}
                  </p>
                </div>

                {/* Action buttons */}
                <div
                  style={{ display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${colors.border}` }}
                  role="group"
                  aria-label={`Actions for ${r.title}`}
                >
                  <button
                    onClick={() => onLoad(r)}
                    style={{
                      flex: 1,
                      padding: '0 14px',
                      background: 'none',
                      border: 'none',
                      color: colors.accent,
                      fontSize: '12px',
                      cursor: 'pointer',
                      borderBottom: `1px solid ${colors.border}`
                    }}
                    aria-label={`Cook ${r.title}`}
                  >
                    {txt.cookRecipe || 'Cook'}
                  </button>
                  <button
                    onClick={() => onDelete(r.id)}
                    style={{
                      flex: 1,
                      padding: '0 14px',
                      background: 'none',
                      border: 'none',
                      color: colors.error,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                    aria-label={`Delete ${r.title}`}
                  >
                    {txt.deleteRecipe || 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
