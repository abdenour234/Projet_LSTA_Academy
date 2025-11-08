/**
 * School Access Validation Utilities
 * Ensures users can only access their assigned school's data
 */

import { authApi } from './api';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  role: string;
  schoolId?: string;
}

/**
 * Validates that the current user has access to the specified school
 * 
 * @param schoolId - The school ID from the URL
 * @returns Object with validation result and user data
 * @throws Error if validation fails
 */
export async function validateSchoolAccess(schoolId: string): Promise<{
  isValid: boolean;
  user: User | null;
  error?: string;
}> {
  try {
    // Get current authenticated user
    const user = await authApi.getCurrentUser();
    
    if (!user) {
      return {
        isValid: false,
        user: null,
        error: 'Non authentifié'
      };
    }

    // SUPERADMIN can access all schools
    if (user.role.toUpperCase() === 'SUPERADMIN') {
      return {
        isValid: true,
        user
      };
    }

    // Other roles must match their assigned school - convert both to strings for type-safe comparison
    if (String(user.schoolId) !== String(schoolId)) {
      return {
        isValid: false,
        user,
        error: `Accès refusé: vous n'êtes pas autorisé à accéder à cette école (École assignée: ${user.schoolId}, École demandée: ${schoolId})`
      };
    }

    return {
      isValid: true,
      user
    };
  } catch (error) {
    console.error('School access validation error:', error);
    return {
      isValid: false,
      user: null,
      error: 'Erreur lors de la validation d\'accès'
    };
  }
}

/**
 * Hook-style validator for use in React components
 * Automatically redirects if access is denied
 * 
 * @param schoolId - The school ID from URL params
 * @param navigate - React Router navigate function
 * @param toast - Toast notification function
 * @returns User object if valid, null otherwise
 */
export async function validateAndRedirect(
  schoolId: string,
  navigate: (path: string) => void,
  toast?: (options: any) => void
): Promise<User | null> {
  const { isValid, user, error } = await validateSchoolAccess(schoolId);

  if (!isValid) {
    // Show error toast if available
    if (toast && error) {
      toast({
        title: 'Accès refusé',
        description: error,
        variant: 'destructive',
      });
    }

    // Redirect based on user role or to login
    if (user) {
      const userRole = user.role.toUpperCase();
      switch (userRole) {
        case 'SUPERADMIN':
          navigate('/superadmin/dashboard');
          break;
        case 'ADMIN':
          navigate(`/school/${user.schoolId}/admin/dashboard`);
          break;
        case 'TEACHER':
          navigate(`/school/${user.schoolId}/teacher/dashboard`);
          break;
        case 'STUDENT':
          navigate(`/school/${user.schoolId}/student/dashboard`);
          break;
        default:
          navigate('/login');
      }
    } else {
      navigate(`/school/${schoolId}/login`);
    }

    return null;
  }

  return user;
}
