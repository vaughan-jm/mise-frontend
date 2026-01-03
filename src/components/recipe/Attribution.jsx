import React from 'react';
import colors from '../../constants/colors.js';

/**
 * Attribution component - displays original recipe source and author
 * @param {Object} recipe - Recipe object with source, author, and sourceUrl
 */
export default function Attribution({ recipe }) {
  if (!recipe.source && !recipe.author) return null;

  return (
    <div
      style={{
        padding: '12px 14px',
        background: colors.card,
        borderRadius: '10px',
        border: `1px solid ${colors.border}`,
        marginBottom: '16px'
      }}
      role="region"
      aria-label="Recipe attribution"
    >
      <p
        style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: colors.muted,
          marginBottom: '6px'
        }}
      >
        Original recipe
      </p>
      <p style={{ fontSize: '14px', color: colors.text, lineHeight: 1.4 }}>
        {recipe.author && <span>{recipe.author} · </span>}
        {recipe.sourceUrl ? (
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: colors.accent, textDecoration: 'none' }}
            onClick={e => e.stopPropagation()}
            aria-label={`View original recipe from ${recipe.source}`}
          >
            {recipe.source}
          </a>
        ) : (
          <span style={{ color: colors.muted }}>{recipe.source}</span>
        )}
      </p>
    </div>
  );
}
