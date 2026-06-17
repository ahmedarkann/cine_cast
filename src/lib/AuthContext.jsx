import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { get, getToken, post, setToken, clearToken, uploadFile } from '@/api/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);

  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: isLoadingUserQuery, isError: isErrorUserQuery, error: userQueryError, refetch: refetchUser } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const token = getToken();
      if (!token) throw new Error('No token found');
      return get('/api/auth/me');
    },
    retry: false, // Don't retry on 401/403
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  useEffect(() => {
    setIsLoadingAuth(isLoadingUserQuery);
    if (currentUser) {
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
    } else if (isErrorUserQuery) {
      setUser(null);
      setIsAuthenticated(false);
      if (userQueryError.status === 401 || userQueryError.status === 403) {
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      } else {
        setAuthError({ type: 'unknown', message: userQueryError.message || 'An unknown error occurred' });
      }
    }

    if (!isLoadingUserQuery) {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, [currentUser, isLoadingUserQuery, isErrorUserQuery, userQueryError]);

  const checkUserAuth = async () => {
    await refetchUser();
  };

  const logout = useCallback((shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    clearToken();
    queryClient.removeQueries(['user', 'me']);
    // Clear the httpOnly refresh cookie server-side
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    if (shouldRedirect) navigate('/login');
  }, [navigate, queryClient]);

  // Listen for session expiry fired by api.js when refresh fails
  useEffect(() => {
    const handler = () => logout(true);
    window.addEventListener('cinecast:session-expired', handler);
    return () => window.removeEventListener('cinecast:session-expired', handler);
  }, [logout]);

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
