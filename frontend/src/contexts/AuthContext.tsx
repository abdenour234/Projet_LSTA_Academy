import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { auth, authApi, ApiError } from '@/lib/api';
import { normalizeRole } from '@/lib/roleUtils';

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
    const initAuth = async () => {
      // Try to restore from localStorage first for instant UI update
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser); // Set immediately for better UX
          console.log('[AUTH] Restored user from localStorage:', parsedUser);
        } catch (error) {
          console.error('[AUTH] Failed to parse stored user:', error);
        }
      }
      
      // Then validate with server
      await checkAuth();
    };
    
    initAuth();
    
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
      console.log('[AUTH] User fetched from API:', currentUser);
      
      // ✅ CRITICAL: Normalize role to ensure consistency
      const userRole = normalizeRole(currentUser.role);
      console.log('[AUTH] Role normalized:', { original: currentUser.role, normalized: userRole });
      
      if (!userRole) {
        console.error('[AUTH] Invalid role detected, logging out:', currentUser.role);
        auth.removeToken();
        setUser(null);
        setLoading(false);
        return;
      }
      
      // ✅ Create normalized user object
      const normalizedUser: User = {
        ...currentUser,
        role: userRole, // Always UPPERCASE (SUPERADMIN, ADMIN, TEACHER, STUDENT)
      };
      
      setUser(normalizedUser);
      
      // ✅ Update localStorage with normalized data
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      console.log('[AUTH] User state updated:', normalizedUser);
      
    } catch (error) {
      // Token is invalid, expired, or user is logging out
      console.error('[AUTH] Auth check failed:', error);
      
      // ✅ CRITICAL: Don't clear if we're mid-logout (localStorage already empty)
      if (localStorage.getItem('token')) {
        auth.removeToken();
      }
      
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
    if (!user) {
      console.log('[AUTH] hasRole check failed - no user');
      return false;
    }
    
    // ✅ User role is already normalized in UPPERCASE by checkAuth()
    const userRole = user.role;
    console.log('[AUTH] hasRole check:', { userRole, requiredRole });
    
    if (Array.isArray(requiredRole)) {
      const hasAccess = requiredRole.some(role => {
        const normalizedRequired = normalizeRole(role);
        return normalizedRequired && userRole === normalizedRequired;
      });
      console.log('[AUTH] Array role check result:', hasAccess);
      return hasAccess;
    }
    
    const normalizedRequired = normalizeRole(requiredRole);
    const hasAccess = normalizedRequired !== null && userRole === normalizedRequired;
    console.log('[AUTH] Single role check result:', hasAccess);
    return hasAccess;
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
