import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/**
 * Props for PrivateRoute component
 */
interface PrivateRouteProps {
  children: ReactNode;
  requiredRole?: string | string[]; // Optional role requirement
  redirectTo?: string; // Custom redirect path
}

/**
 * PrivateRoute component - protects routes requiring authentication
 * 
 * Features:
 * - Shows loading state while checking authentication
 * - Redirects unauthenticated users to login
 * - Supports role-based access control
 * - Redirects unauthorized users (wrong role)
 * 
 * @param children - Protected content to render
 * @param requiredRole - Required role(s) for access (SUPERADMIN, ADMIN, TEACHER, STUDENT)
 * @param redirectTo - Custom redirect path (defaults to /login)
 */
export const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  requiredRole,
  redirectTo = '/login',
}) => {
  const { user, loading, isAuthenticated, hasRole } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access if required
  if (requiredRole && !hasRole(requiredRole)) {
    // Determine appropriate redirect based on user role
    const userRole = user?.role.toUpperCase();
    let unauthorizedRedirect = '/';
    
    switch (userRole) {
      case 'SUPERADMIN':
        unauthorizedRedirect = '/superadmin/dashboard';
        break;
      case 'ADMIN':
        unauthorizedRedirect = user?.schoolId 
          ? `/school/${user.schoolId}/admin/dashboard` 
          : '/';
        break;
      case 'TEACHER':
        unauthorizedRedirect = user?.schoolId 
          ? `/school/${user.schoolId}/teacher/dashboard` 
          : '/';
        break;
      case 'STUDENT':
        unauthorizedRedirect = '/student/dashboard';
        break;
      default:
        unauthorizedRedirect = '/';
    }
    
    return <Navigate to={unauthorizedRedirect} replace />;
  }

  // User is authenticated and authorized - render protected content
  return <>{children}</>;
};
