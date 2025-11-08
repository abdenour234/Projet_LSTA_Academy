import React, { ReactNode, useEffect, useRef } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { PageLoadingSpinner } from '@/components/ui/loading-spinner';
import { normalizeRole, getRoleDashboardRoute } from '@/lib/roleUtils';

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
  const params = useParams();
  const { toast } = useToast();
  
  // Track if we've already shown a toast to avoid duplicates
  const toastShownRef = useRef(false);

  console.log('[PRIVATE_ROUTE] Check:', { 
    path: location.pathname, 
    user: user?.email, 
    role: user?.role, 
    requiredRole, 
    loading, 
    isAuthenticated 
  });

  // Show loading spinner while checking authentication
  if (loading) {
    return <PageLoadingSpinner text="Vérification de l'authentification..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('[PRIVATE_ROUTE] Not authenticated, redirecting to login');
    // Show toast notification for unauthenticated access
    if (!toastShownRef.current) {
      toastShownRef.current = true;
      toast({
        title: 'Authentification requise',
        description: 'Veuillez vous connecter pour accéder à cette page.',
        variant: 'destructive',
      });
    }
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // ✅ SECURITY: Check if route requires school context
  const requiresSchoolContext = location.pathname.includes('/school/');
  const urlSchoolId = params.id; // From route parameter :id
  
  if (requiresSchoolContext) {
    console.log('[PRIVATE_ROUTE] School context check:', { 
      urlSchoolId, 
      userSchoolId: user?.schoolId,
      userRole: user?.role 
    });

    // ✅ Verify user has a schoolId
    if (!user?.schoolId) {
      console.error('[PRIVATE_ROUTE] User missing schoolId for school route');
      if (!toastShownRef.current) {
        toastShownRef.current = true;
        toast({
          title: 'Accès refusé',
          description: 'Aucune école associée à votre compte. Contactez un administrateur.',
          variant: 'destructive',
        });
      }
      return <Navigate to="/" replace />;
    }

    // ✅ Verify URL schoolId matches user's schoolId (except for SUPERADMIN)
    const userRole = normalizeRole(user.role);
    if (userRole !== 'SUPERADMIN' && urlSchoolId && urlSchoolId !== user.schoolId) {
      console.error('[PRIVATE_ROUTE] School ID mismatch:', { 
        urlSchoolId, 
        userSchoolId: user.schoolId 
      });
      if (!toastShownRef.current) {
        toastShownRef.current = true;
        toast({
          title: 'Accès refusé',
          description: 'Vous ne pouvez pas accéder aux données d\'une autre école.',
          variant: 'destructive',
        });
      }
      // Redirect to user's own school dashboard
      const correctDashboard = getRoleDashboardRoute(user.role, user.schoolId);
      return <Navigate to={correctDashboard} replace />;
    }
  }

  // Check role-based access if required
  if (requiredRole && !hasRole(requiredRole)) {
    console.error('[PRIVATE_ROUTE] Role check failed:', { 
      userRole: user?.role, 
      requiredRole 
    });
    
    // Show toast notification for unauthorized access
    if (!toastShownRef.current) {
      toastShownRef.current = true;
      const requiredRoleText = Array.isArray(requiredRole) 
        ? requiredRole.join(', ') 
        : requiredRole;
      
      toast({
        title: 'Accès refusé',
        description: `Vous n'avez pas les permissions nécessaires. Rôle requis: ${requiredRoleText}`,
        variant: 'destructive',
      });
    }
    
    // Redirect to user's appropriate dashboard
    const userRole = normalizeRole(user?.role);
    const correctDashboard = userRole && user?.schoolId
      ? getRoleDashboardRoute(userRole, user.schoolId)
      : '/';
    
    console.log('[PRIVATE_ROUTE] Redirecting to correct dashboard:', correctDashboard);
    return <Navigate to={correctDashboard} replace />;
  }

  console.log('[PRIVATE_ROUTE] Access granted');
  // User is authenticated and authorized - render protected content
  return <>{children}</>;
};
