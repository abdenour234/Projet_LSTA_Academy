import React, { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole, hasRole } from '@/lib/roleUtils';

/**
 * Props for RoleGuard component
 */
interface RoleGuardProps {
  children: ReactNode;
  requiredRole?: UserRole | UserRole[]; // Required role(s) for visibility
  fallback?: ReactNode; // Optional fallback content if user doesn't have required role
  hideIfUnauthorized?: boolean; // If true, renders nothing when unauthorized (default: true)
}

/**
 * RoleGuard component - conditionally renders children based on user role
 * 
 * Usage:
 * ```tsx
 * <RoleGuard requiredRole="ADMIN">
 *   <AdminButton />
 * </RoleGuard>
 * 
 * <RoleGuard requiredRole={["ADMIN", "TEACHER"]}>
 *   <ManageStudentsButton />
 * </RoleGuard>
 * 
 * <RoleGuard requiredRole="SUPERADMIN" fallback={<p>Access Denied</p>}>
 *   <SuperAdminPanel />
 * </RoleGuard>
 * ```
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredRole,
  fallback = null,
  hideIfUnauthorized = true,
}) => {
  const { user } = useAuth();

  // If no role requirement, render children (authenticated users only via PrivateRoute)
  if (!requiredRole) {
    return <>{children}</>;
  }

  // Check if user has required role
  const hasRequiredRole = hasRole(user?.role, requiredRole);

  if (hasRequiredRole) {
    return <>{children}</>;
  }

  // User doesn't have required role
  if (hideIfUnauthorized) {
    return null; // Don't render anything
  }

  return <>{fallback}</>; // Render fallback content
};
