/**
 * Application entry point (Refactored version)
 *
 * Wraps the app with context providers for:
 * - Authentication (AuthProvider)
 * - Language/i18n (LanguageProvider)
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { LanguageProvider } from './contexts/LanguageContext.jsx';
import Mise from './MiseRefactored.jsx';

/**
 * App wrapper with all necessary providers
 */
function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Mise />
      </LanguageProvider>
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
