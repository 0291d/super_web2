import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import {
  AuthUser,
  changeCurrentUserPassword,
  clearAuthToken,
  getCurrentUser,
  login as loginRequest,
  register as registerRequest,
  setAuthToken,
  updateCurrentUser,
} from '../api/auth';

type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  newsletter: boolean;
};

type AuthContextType = {
  user: AuthUser | null;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  updateProfile: (input: {
    firstName: string;
    lastName: string;
    newsletter?: boolean;
    addresses?: AuthUser['addresses'];
  }) => Promise<AuthUser>;
  changePassword: (input: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<AuthUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .finally(() => setIsAuthLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const data = await loginRequest(email, password);
    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(input: RegisterInput) {
    const data = await registerRequest(input);
    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function updateProfile(input: {
    firstName: string;
    lastName: string;
    newsletter?: boolean;
    addresses?: AuthUser['addresses'];
  }) {
    const updatedUser = await updateCurrentUser(input);
    setUser(updatedUser);
    return updatedUser;
  }

  async function changePassword(input: {
    currentPassword: string;
    newPassword: string;
  }) {
    const updatedUser = await changeCurrentUserPassword(input);
    setUser(updatedUser);
    return updatedUser;
  }

  function logout() {
    clearAuthToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isAuthLoading, login, register, updateProfile, changePassword, logout }}>
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
