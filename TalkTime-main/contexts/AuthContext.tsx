import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Employee } from '@/types';
import { authService } from '@/services/authService';
import apiService from '@/services/api';

interface AuthContextType {
  employee: Employee | null;
  isLoading: boolean;
  login: (id: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await apiService.isAuthenticated();
      if (isAuth) {
        const user = await apiService.getStoredUser();
        if (user) {
          setEmployee(user as any);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (id: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authService.login(id, password);
      if (result.success && result.employee) {
        setEmployee(result.employee);
      }
      return { success: result.success, error: result.error };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await authService.logout();
    setEmployee(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ employee, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
