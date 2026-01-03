import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';
import { getFingerprint } from '../utils/fingerprint.js';
import { ENDPOINTS, ANONYMOUS_RECIPE_LIMIT } from '../constants/index.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recipesRemaining, setRecipesRemaining] = useState(ANONYMOUS_RECIPE_LIMIT);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = api.getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const data = await api.get(ENDPOINTS.AUTH.ME);
      if (data.user) {
        setUser(data.user);
        setRecipesRemaining(data.user.recipesRemaining ?? Infinity);
      } else {
        // Invalid token, clear it
        api.setToken(null);
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.post(ENDPOINTS.AUTH.LOGIN, { email, password });

    if (data.error) {
      return { error: data.error };
    }

    api.setToken(data.token);
    setUser(data.user);
    setRecipesRemaining(data.user.recipesRemaining ?? Infinity);
    return { success: true, user: data.user };
  }, []);

  const register = useCallback(async (email, password) => {
    const data = await api.post(ENDPOINTS.AUTH.REGISTER, { email, password });

    if (data.error) {
      return { error: data.error };
    }

    api.setToken(data.token);
    setUser(data.user);
    setRecipesRemaining(data.user.recipesRemaining ?? Infinity);
    return { success: true, user: data.user };
  }, []);

  const loginWithGoogle = useCallback(async (credential) => {
    const data = await api.post(ENDPOINTS.AUTH.GOOGLE, { credential });

    if (data.error) {
      return { error: data.error };
    }

    api.setToken(data.token);
    setUser(data.user);
    setRecipesRemaining(data.user.recipesRemaining ?? Infinity);
    return { success: true, user: data.user };
  }, []);

  const logout = useCallback(async () => {
    await api.post(ENDPOINTS.AUTH.LOGOUT);
    api.setToken(null);
    setUser(null);
    setRecipesRemaining(ANONYMOUS_RECIPE_LIMIT);
  }, []);

  const updateRecipesRemaining = useCallback((count) => {
    setRecipesRemaining(count);
  }, []);

  const getAuthHeaders = useCallback(() => {
    const fingerprint = !user ? getFingerprint() : null;
    return { fingerprint };
  }, [user]);

  const value = {
    user,
    loading,
    recipesRemaining,
    isAuthenticated: !!user,
    login,
    register,
    loginWithGoogle,
    logout,
    updateRecipesRemaining,
    getAuthHeaders,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
