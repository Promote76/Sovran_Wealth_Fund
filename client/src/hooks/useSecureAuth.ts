import { useState, useEffect } from 'react';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  accountStatus: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export function useSecureAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false
  });

  useEffect(() => {
    verifySession();
  }, []);

  const verifySession = async () => {
    try {
      const response = await fetch('/api/secure-auth/verify', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAuthState({
          user: data.user,
          loading: false,
          error: null,
          isAuthenticated: true
        });
      } else {
        setAuthState({
          user: null,
          loading: false,
          error: 'Not authenticated',
          isAuthenticated: false
        });
      }
    } catch (error) {
      console.error('Session verification failed:', error);
      setAuthState({
        user: null,
        loading: false,
        error: 'Authentication failed',
        isAuthenticated: false
      });
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/secure-auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAuthState({
          user: data.user,
          loading: false,
          error: null,
          isAuthenticated: true
        });
        return true;
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: data.error || 'Login failed',
          isAuthenticated: false
        }));
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Network error during login',
        isAuthenticated: false
      }));
      return false;
    }
  };

  const register = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/secure-auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ firstName, lastName, email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAuthState({
          user: data.user,
          loading: false,
          error: null,
          isAuthenticated: true
        });
        return true;
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: data.error || 'Registration failed',
          isAuthenticated: false
        }));
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Network error during registration',
        isAuthenticated: false
      }));
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/secure-auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    setAuthState({
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false
    });
  };

  const isAdmin = (): boolean => {
    return authState.user?.role === 'admin' || authState.user?.role === 'super_admin';
  };

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated: authState.isAuthenticated,
    login,
    register,
    logout,
    isAdmin,
    refreshSession: verifySession
  };
}
