import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { auth, authApi, ApiError } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

/**
 * User type definition
 */
export interface User {
  id: number;
  email: string;
  fullName?: string;
  role: string; // SUPERADMIN, ADMIN, TEACHER, STUDENT
  schoolId?: string;
}

/**
 * Authentication context type
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  hasRole: (requiredRole: string | string[]) => boolean;
}

/**
 * Create the authentication context
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider component - provides authentication state to the entire app
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  /**
   * Check if user is authenticated on mount and validate token
   */
  useEffect(() => {
    checkAuth();
    
    // Check token expiration every 5 minutes
    const interval = setInterval(() => {
      if (auth.isAuthenticated()) {
        checkAuth();
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  /**
   * Check authentication status by validating token with backend
   */
  const checkAuth = async (): Promise<void> => {
    try {
      if (!auth.isAuthenticated()) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Validate token with backend
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      // Token is invalid or expired
      console.error('Auth check failed:', error);
      auth.removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login user with email and password
   */
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await authApi.login(email, password);
      setUser(response.user);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Login failed');
    }
  };

  /**
   * Logout user and clear authentication state
   */
  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      auth.removeToken();
      setUser(null);
    }
  };

  /**
   * Check if user has required role(s)
   * @param requiredRole - Single role or array of roles
   */
  const hasRole = (requiredRole: string | string[]): boolean => {
    if (!user) return false;
    
    const userRole = user.role.toUpperCase();
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.some(role => userRole === role.toUpperCase());
    }
    
    return userRole === requiredRole.toUpperCase();
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
