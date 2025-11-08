/**
 * Role-based access control utilities for frontend
 * 
 * These utilities help with conditional rendering and
 * UI element visibility based on user roles
 */

export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT';

/**
 * Normalize a role string to uppercase standard format
 * Handles various input formats (lowercase, mixed case, with underscores, etc.)
 * 
 * @param role - Role string to normalize (can be null/undefined)
 * @returns Normalized role in UPPERCASE or null if invalid
 * 
 * @example
 * normalizeRole('admin') // 'ADMIN'
 * normalizeRole('SuperAdmin') // 'SUPERADMIN'
 * normalizeRole('school_admin') // 'ADMIN'
 * normalizeRole('teacher') // 'TEACHER'
 * normalizeRole(null) // null
 */
export const normalizeRole = (role: string | null | undefined): UserRole | null => {
  if (!role) {
    return null;
  }

  // Convert to uppercase and trim whitespace
  const normalized = role.toUpperCase().trim();

  // Handle legacy role names and variations
  const roleMappings: Record<string, UserRole> = {
    'SUPER_ADMIN': 'SUPERADMIN',
    'SUPERADMIN': 'SUPERADMIN',
    'SUPER ADMIN': 'SUPERADMIN',
    'SCHOOL_ADMIN': 'ADMIN',
    'ADMIN': 'ADMIN',
    'ADMINISTRATOR': 'ADMIN',
    'TEACHER': 'TEACHER',
    'ENSEIGNANT': 'TEACHER',
    'STUDENT': 'STUDENT',
    'ETUDIANT': 'STUDENT',
    'ÉLÈVE': 'STUDENT',
  };

  return roleMappings[normalized] || null;
};

/**
 * Check if a role is valid
 * 
 * @param role - Role string to validate
 * @returns True if role is valid, false otherwise
 * 
 * @example
 * isValidRole('ADMIN') // true
 * isValidRole('admin') // true
 * isValidRole('invalid') // false
 */
export const isValidRole = (role: string | null | undefined): boolean => {
  return normalizeRole(role) !== null;
};

/**
 * Check if a user has a specific role
 * @param userRole - The user's current role
 * @param requiredRole - The required role or array of roles
 * @returns true if user has one of the required roles
 * 
 * @example
 * hasRole('admin', 'ADMIN') // true
 * hasRole('teacher', ['ADMIN', 'TEACHER']) // true
 * hasRole('student', ['ADMIN', 'TEACHER']) // false
 */
export const hasRole = (
  userRole: string | undefined | null,
  requiredRole: UserRole | UserRole[]
): boolean => {
  const normalizedUserRole = normalizeRole(userRole);
  
  if (!normalizedUserRole) {
    return false;
  }
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.some(role => {
      const normalizedRequired = normalizeRole(role);
      return normalizedRequired && normalizedUserRole === normalizedRequired;
    });
  }
  
  const normalizedRequired = normalizeRole(requiredRole);
  return normalizedRequired !== null && normalizedUserRole === normalizedRequired;
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
 * @param role - Role to get display name for
 * @param locale - Locale for translation (default: 'fr')
 * @returns User-friendly role name
 * 
 * @example
 * getRoleDisplayName('ADMIN') // 'Administrateur'
 * getRoleDisplayName('TEACHER', 'en') // 'Teacher'
 */
export const getRoleDisplayName = (
  role: string | undefined | null,
  locale: 'fr' | 'en' = 'fr'
): string => {
  const normalizedRole = normalizeRole(role);
  
  const displayNames: Record<string, Record<UserRole, string>> = {
    fr: {
      'SUPERADMIN': 'Super Administrateur',
      'ADMIN': 'Administrateur',
      'TEACHER': 'Enseignant',
      'STUDENT': 'Étudiant',
    },
    en: {
      'SUPERADMIN': 'Super Administrator',
      'ADMIN': 'Administrator',
      'TEACHER': 'Teacher',
      'STUDENT': 'Student',
    },
  };
  
  if (!normalizedRole) {
    return locale === 'fr' ? 'Rôle inconnu' : 'Unknown role';
  }
  
  return displayNames[locale][normalizedRole];
};

/**
 * Get the default dashboard route for a role
 * 
 * @param role - User's role
 * @param schoolId - School ID (required for ADMIN, TEACHER roles)
 * @returns Dashboard route path
 * 
 * @example
 * getRoleDashboardRoute('SUPERADMIN') // '/superadmin/dashboard'
 * getRoleDashboardRoute('ADMIN', 'abc-123') // '/school/abc-123/admin/dashboard'
 */
export const getRoleDashboardRoute = (
  role: string | null | undefined,
  schoolId?: string | null
): string => {
  const normalizedRole = normalizeRole(role);

  switch (normalizedRole) {
    case 'SUPERADMIN':
      return '/superadmin/dashboard';
    
    case 'ADMIN':
      return schoolId 
        ? `/school/${schoolId}/admin/dashboard` 
        : '/';
    
    case 'TEACHER':
      return schoolId 
        ? `/school/${schoolId}/teacher/dashboard` 
        : '/';
    
    case 'STUDENT':
      return '/student/dashboard';
    
    default:
      return '/';
  }
};

/**
 * Check if a role has access to all schools (multi-tenant admin)
 * 
 * @param role - Role to check
 * @returns True if role has global access
 */
export const isGlobalRole = (role: string | undefined | null): boolean => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'SUPERADMIN';
};

/**
 * Check if a role requires school context
 * 
 * @param role - Role to check
 * @returns True if role requires schoolId
 */
export const requiresSchoolContext = (role: string | undefined | null): boolean => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'ADMIN' || normalizedRole === 'TEACHER';
};
