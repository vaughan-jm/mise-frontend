import React from 'react';

/**
 * MiseLogo component
 *
 * Renders the Mise app logo with a customizable size
 *
 * @param {number} size - The width and height of the logo in pixels (default: 32)
 * @param {string} cardColor - The background color of the logo (default: #161b22)
 * @param {string} accentColor - The accent color for the logo details (default: #4ade80)
 */
const MiseLogo = ({
  size = 32,
  cardColor = '#161b22',
  accentColor = '#4ade80'
}) => {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label="Mise logo"
    >
      <rect
        width="200"
        height="200"
        rx="40"
        fill={cardColor}
      />
      <path
        d="M 40 110 Q 40 160 100 160 Q 160 160 160 110"
        fill="none"
        stroke={accentColor}
        strokeWidth="12"
        strokeLinecap="round"
      />
      <circle cx="70" cy="100" r="12" fill={accentColor} />
      <circle cx="100" cy="88" r="12" fill={accentColor} />
      <circle cx="130" cy="100" r="12" fill={accentColor} />
    </svg>
  );
};

export default MiseLogo;
