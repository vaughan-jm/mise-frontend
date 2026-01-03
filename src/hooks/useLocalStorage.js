import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for syncing state with localStorage
 * Handles cases where localStorage is disabled
 * @param {string} key - localStorage key
 * @param {any} initialValue - Default value if key doesn't exist
 * @returns {[any, Function, Function]} - [value, setValue, removeValue]
 */
export function useLocalStorage(key, initialValue) {
  // Get initial value from localStorage or use default
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch {
      // localStorage disabled or invalid JSON
      return initialValue;
    }
  });

  // Update localStorage when value changes
  const setValue = useCallback((value) => {
    try {
      // Allow value to be a function (like useState)
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch {
      // localStorage disabled
      console.warn(`Unable to save ${key} to localStorage`);
    }
  }, [key, storedValue]);

  // Remove from localStorage
  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch {
      // localStorage disabled
    }
  }, [key, initialValue]);

  // Listen for changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch {
          // Invalid JSON
        }
      } else if (e.key === key && e.newValue === null) {
        setStoredValue(initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Simpler version for string values (no JSON parsing)
 * @param {string} key - localStorage key
 * @param {string} initialValue - Default value
 * @returns {[string, Function, Function]}
 */
export function useLocalStorageString(key, initialValue = '') {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      return localStorage.getItem(key) || initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (valueToStore) {
        localStorage.setItem(key, valueToStore);
      } else {
        localStorage.removeItem(key);
      }
    } catch {
      console.warn(`Unable to save ${key} to localStorage`);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch {
      // localStorage disabled
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;
