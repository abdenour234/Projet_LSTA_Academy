/**
 * Role-based access control utilities for frontend
 * 
 * These utilities help with conditional rendering and
 * UI element visibility based on user roles
 */

export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT';

/**
 * Check if a user has a specific role
 * @param userRole - The user's current role
 * @param requiredRole - The required role or array of roles
 * @returns true if user has one of the required roles
 */
export const hasRole = (
  userRole: string | undefined | null,
  requiredRole: UserRole | UserRole[]
): boolean => {
  if (!userRole) return false;
  
  const normalizedUserRole = userRole.toUpperCase();
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.some(role => normalizedUserRole === role.toUpperCase());
  }
  
  return normalizedUserRole === requiredRole.toUpperCase();
};

/**
 * Check if user is SUPERADMIN
 */
export const isSuperAdmin = (userRole: string | undefined | null): boolean => {
  return hasRole(userRole, 'SUPERADMIN');
};

/**
 * Check if user is ADMIN
 */
export const isAdmin = (userRole: string | undefined | null): boolean => {
  return hasRole(userRole, 'ADMIN');
};

/**
 * Check if user is TEACHER
 */
export const isTeacher = (userRole: string | undefined | null): boolean => {
  return hasRole(userRole, 'TEACHER');
};

/**
 * Check if user is STUDENT
 */
export const isStudent = (userRole: string | undefined | null): boolean => {
  return hasRole(userRole, 'STUDENT');
};

/**
 * Check if user can manage students (SUPERADMIN, ADMIN, or TEACHER)
 */
export const canManageStudents = (userRole: string | undefined | null): boolean => {
  return hasRole(userRole, ['SUPERADMIN', 'ADMIN', 'TEACHER']);
};

/**
 * Check if user can manage teachers (SUPERADMIN or ADMIN)
 */
export const canManageTeachers = (userRole: string | undefined | null): boolean => {
  return hasRole(userRole, ['SUPERADMIN', 'ADMIN']);
};

/**
 * Check if user can manage classes (SUPERADMIN, ADMIN, or TEACHER)
 */
export const canManageClasses = (userRole: string | undefined | null): boolean => {
  return hasRole(userRole, ['SUPERADMIN', 'ADMIN', 'TEACHER']);
};

/**
 * Check if user can create/edit activities (SUPERADMIN, ADMIN, or TEACHER)
 */
export const canManageActivities = (userRole: string | undefined | null): boolean => {
  return hasRole(userRole, ['SUPERADMIN', 'ADMIN', 'TEACHER']);
};

/**
 * Check if user can manage schools (SUPERADMIN only)
 */
export const canManageSchools = (userRole: string | undefined | null): boolean => {
  return hasRole(userRole, 'SUPERADMIN');
};

/**
 * Check if user can access admin features (SUPERADMIN or ADMIN)
 */
export const canAccessAdminFeatures = (userRole: string | undefined | null): boolean => {
  return hasRole(userRole, ['SUPERADMIN', 'ADMIN']);
};

/**
 * Get user role display name
 */
export const getRoleDisplayName = (role: string | undefined | null): string => {
  if (!role) return 'Unknown';
  
  const roleMap: Record<string, string> = {
    'SUPERADMIN': 'Super Admin',
    'ADMIN': 'Administrator',
    'TEACHER': 'Teacher',
    'STUDENT': 'Student',
  };
  
  return roleMap[role.toUpperCase()] || role;
};
