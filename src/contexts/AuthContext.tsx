'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import type { ApiPostAuthor } from '@/services/api';

type RegisterPayload = {
  fullName: string;
  username: string;
  email: string;
  password: string;
};

type AuthContextType = {
  user: ApiPostAuthor | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiPostAuthor | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const currentToken = await api.getToken();
      if (!currentToken) {
        setUser(null);
        setToken(null);
        return;
      }
      setToken(currentToken);
      const userProfile = await api.getMe();
      setUser(userProfile);
    } catch {
      // Token expired or invalid
      api.setToken(null);
      setUser(null);
      setToken(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await refreshUser();
      setIsLoading(false);
    };
    void initAuth();
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await api.login(identifier, password);
    setToken(res.tokens.accessToken);
    setUser(res.user);
  };

  const register = async (payload: RegisterPayload) => {
    const res = await api.register(payload);
    setToken(res.tokens.accessToken);
    setUser(res.user);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setToken(null);
  };

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, token, isLoading],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
