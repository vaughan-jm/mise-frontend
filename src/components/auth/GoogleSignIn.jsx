import React, { useEffect, useRef, useState } from 'react';
import { GOOGLE_CLIENT_ID } from '../../constants/index.js';

/**
 * GoogleSignIn Component
 * Handles Google Sign-In with proper script loading and cleanup
 *
 * @param {Function} onSuccess - Callback when Google auth succeeds
 * @param {Function} onError - Callback when Google auth fails
 */
export default function GoogleSignIn({ onSuccess, onError }) {
  const buttonRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Don't load if no client ID
    if (!GOOGLE_CLIENT_ID) return;

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existingScript) {
      // Script already loaded, just wait for it
      const checkGoogleLoaded = setInterval(() => {
        if (window.google?.accounts?.id) {
          setScriptLoaded(true);
          clearInterval(checkGoogleLoaded);
        }
      }, 100);

      return () => clearInterval(checkGoogleLoaded);
    }

    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setScriptLoaded(true);
    };

    script.onerror = () => {
      if (onError) {
        onError('Failed to load Google Sign-In');
      }
    };

    document.body.appendChild(script);

    // Cleanup: Remove script when component unmounts
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [onError]);

  useEffect(() => {
    if (!scriptLoaded || !buttonRef.current || !window.google) return;

    // Initialize Google Sign-In
    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response.credential) {
            onSuccess(response);
          } else if (onError) {
            onError('No credential received from Google');
          }
        },
      });

      // Render the button
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: buttonRef.current.offsetWidth || 292, // Use container width
        text: 'continue_with',
      });
    } catch (error) {
      if (onError) {
        onError('Failed to initialize Google Sign-In');
      }
    }
  }, [scriptLoaded, onSuccess, onError]);

  // Don't render if no client ID
  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div
      ref={buttonRef}
      aria-label="Sign in with Google"
      style={{ minHeight: '40px' }}
    />
  );
}
