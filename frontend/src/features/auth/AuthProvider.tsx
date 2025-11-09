import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { useToast } from '@chakra-ui/react';
import { apiClient } from '../../api/client';
import { ensureAccessToken, setAccessToken, signOut as signOutSession } from './session';
import type { AuthResponse, AuthUser, ApiSuccess, ApiError } from '../../types/api';

interface AuthContextState {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: 'admin' | 'user') => boolean;
  setAccessToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

const extractAccessToken = (response: ApiSuccess<AuthResponse>) => {
  const token = response.data.tokens.accessToken;
  if (!token) {
    throw new Error('Auth response missing access token');
  }
  setAccessToken(token);
  return response.data.user;
};

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const showError = useCallback(
    (message: string) => {
      toast({ title: message, status: 'error', duration: 5000, position: 'top' });
    },
    [toast]
  );

  const refreshMe = useCallback(async () => {
    try {
      const response = await apiClient.get<ApiSuccess<{ user: AuthUser }>>('/auth/me');
      setUser(response.data.data.user);
    } catch (error) {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        try {
          await ensureAccessToken();
        } catch {
          // Ignore missing/expired session; refreshMe will reconcile state.
        }
        await refreshMe();
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, [refreshMe]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await apiClient.post<ApiSuccess<AuthResponse>>('/auth/login', {
          email,
          password
        });
        const actor = extractAccessToken(response.data);
        setUser(actor);
        toast({ title: 'Welcome back!', status: 'success', duration: 3000, position: 'top' });
      } catch (error) {
        const message = (error as { response?: { data?: ApiError } }).response?.data?.message ?? 'Login failed';
        showError(message);
        throw error;
      }
    },
    [showError, toast]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await apiClient.post<ApiSuccess<AuthResponse>>('/auth/register', {
          email,
          password
        });
        const actor = extractAccessToken(response.data);
        setUser(actor);
        toast({ title: 'Account created!', status: 'success', duration: 3000, position: 'top' });
      } catch (error) {
        const message = (error as { response?: { data?: ApiError } }).response?.data?.message ?? 'Registration failed';
        showError(message);
        throw error;
      }
    },
    [showError, toast]
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.warn('Failed to logout', error);
    } finally {
      await signOutSession();
      setUser(null);
    }
  }, []);

  const hasRole = useCallback(
    (role: 'admin' | 'user') => {
      if (!user) return false;
      if (role === 'user') return true;
      return user.role === 'admin';
    },
    [user]
  );

  const handleSetAccessToken = useCallback(
    async (token: string) => {
      setAccessToken(token);
      // Fetch user info after setting token
      await refreshMe();
    },
    [refreshMe]
  );

  const value = useMemo(
    () => ({ user, isLoading, login, register, refreshMe, logout, hasRole, setAccessToken: handleSetAccessToken }),
    [user, isLoading, login, register, refreshMe, logout, hasRole, handleSetAccessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
