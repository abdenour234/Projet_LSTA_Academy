/**
 * Spring Boot REST API Client
 * Base configuration and HTTP methods for interacting with the backend
 */

import { toast } from '@/hooks/use-toast';

/**
 * Centralized API Configuration
 * Works in both development (localhost:8080) and production (nginx proxy /api)
 * Export this to use in all components instead of hardcoding URLs
 */
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  
  /**
   * Get the full API URL with path
   * @param path - API endpoint path (e.g., '/schools', '/teachers')
   */
  getUrl: (path: string): string => {
    const baseUrl = API_CONFIG.BASE_URL;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }
};

const API_BASE_URL = API_CONFIG.BASE_URL;

// Token management
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'current_user';

/**
 * Handle 401 Unauthorized responses globally
 * - Shows user-friendly toast notification
 * - Clears authentication state
 * - Redirects to appropriate login page
 */
function handleUnauthorized(): void {
  const currentUser = auth.getUser();
  const schoolId = currentUser?.schoolId;

  // Clear authentication state
  auth.removeToken();

  // Show user-friendly notification
  toast({
    title: 'Session expirée',
    description: 'Votre session a expiré. Veuillez vous reconnecter.',
    variant: 'destructive',
  });

  // Redirect to appropriate login page
  if (schoolId) {
    // Redirect to school-specific login
    window.location.href = `/school/${schoolId}/login`;
  } else {
    // Fallback to general login
    window.location.href = '/login';
  }
}

export const auth = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
  
  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  
  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  
  getUser: () => {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },
  
  setUser: (user: any): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Complete session cleanup - removes ALL authentication data
   * Use this before login or on logout to ensure clean state
   */
  clearAllAuthData: (): void => {
    console.log('[AUTH] Performing complete session cleanup');
    
    // Clear all auth-related localStorage items
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    
    // Clear any other potential auth data
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('auth_') || key.startsWith('user_') || key === 'token' || key === 'user')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear sessionStorage as well
    sessionStorage.clear();
    
    console.log('[AUTH] Session cleanup complete');
  }
};

// API Error class
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// HTTP Request options
interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

// Generic fetch wrapper
async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Add authorization header if token exists and not skipped
  if (!skipAuth) {
    const token = auth.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401 && !skipAuth) {
      handleUnauthorized();
      throw new ApiError(401, 'Session expirée - Authentification requise');
    }

    // Parse response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle error responses
    if (!response.ok) {
      // Ensure message is always a string
      let errorMessage = 'An error occurred';
      if (typeof data === 'string') {
        errorMessage = data;
      } else if (data && typeof data.message === 'string') {
        errorMessage = data.message;
      } else if (data && typeof data.error === 'string') {
        errorMessage = data.error;
      }
      
      throw new ApiError(
        response.status,
        errorMessage,
        data
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, error instanceof Error ? error.message : 'Network error');
  }
}

// HTTP Methods
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),

  patch: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  // File upload helper
  upload: async <T>(endpoint: string, file: File, additionalData?: Record<string, string>): Promise<T> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add any additional form data
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const token = auth.getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    // Handle 401 Unauthorized in file uploads
    if (response.status === 401) {
      handleUnauthorized();
      throw new ApiError(401, 'Session expirée - Authentification requise');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        error.message || 'Upload failed',
        error
      );
    }

    return response.json();
  },
};

// Auth API endpoints
export const authApi = {
  // AJOUTEZ CES 2 MÉTHODES dans authApi
  changePassword: async (newPassword: string, confirmPassword: string) => {
  return api.post('/auth/change-password', { newPassword, confirmPassword });
},
getStudentsBySchool: async (schoolId: string) => {
  const allUsers = await api.get<any[]>(`/teachers/school/${schoolId}`);
  const students = allUsers.filter(user => user.role === 'STUDENT');
  
  // Get student details from /students endpoint
  const studentDetails = await api.get<any[]>(`/students/school/${schoolId}`);
  
  return students.map(student => {
    const detail = studentDetails.find(d => 
      d.first_name === student.fullName.split(' ')[0] && 
      d.last_name === student.fullName.split(' ').slice(1).join(' ')
    );
    return {
      ...student,
      first_name: detail?.firstName || student.fullName.split(' ')[0],
      last_name: detail?.lastName || student.fullName.split(' ').slice(1).join(' '),
      date_of_birth: detail?.dateOfBirth || '',
      gender: detail?.gender || '',
      parent_contact: detail?.parentContact || '',
    };
  });
},

createStudentRecord: async (studentData: {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  parentContact?: string;
  schoolId: string;
}) => {
  return api.post('/students', studentData);
},
  login: async (email: string, password: string) => {
    // ✅ CRITICAL: Complete cleanup of ALL old session data before new login
    console.log('[AUTH] Clearing ALL old session data before new login');
    auth.clearAllAuthData();
    
    // Small delay to ensure cleanup completes
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const response = await api.post<{ token: string; user: any }>(
      '/auth/login',
      { email, password },
      { skipAuth: true }
    );
    
    console.log('[AUTH] Login successful, storing new session data');
    
    // Store token and user info securely
    auth.setToken(response.token);
    auth.setUser(response.user);
    
    // Verify token immediately after login with fresh data
    try {
      const verifiedUser = await api.get<any>('/auth/me');
      console.log('[LOGIN] Token verified successfully with fresh user data:', verifiedUser);
      
      // Update with verified data to ensure consistency
      auth.setUser(verifiedUser);
    } catch (error) {
      console.error('[LOGIN] Token verification failed:', error);
      auth.clearAllAuthData();
      throw new Error('Session validation failed');
    }
    
    return response;
  },

  logout: async () => {
    console.log('[AUTH] Initiating logout process');
    
    // ✅ STEP 1: Call backend logout endpoint first (with current token)
    try {
      await api.post('/auth/logout');
      console.log('[AUTH] Backend logout successful');
    } catch (error) {
      // Continue with local cleanup even if backend fails
      console.error('[AUTH] Backend logout error (continuing with local cleanup):', error);
    }
    
    // ✅ STEP 2: Complete local session cleanup
    auth.clearAllAuthData();
    
    // ✅ STEP 3: Small delay to ensure cleanup completes
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // ✅ STEP 4: Hard redirect to login page to clear navigation history and force full page reload
    console.log('[AUTH] Redirecting to login page (hard redirect)');
    window.location.href = '/login';
    
    // Return a promise that never resolves to prevent further execution
    return new Promise(() => {});
  },

  getCurrentUser: async () => {
    // ✅ ALWAYS fetch fresh data from server, don't use cache
    console.log('[AUTH] Fetching current user from server');
    const user = await api.get<any>('/auth/me');
    console.log('[AUTH] Current user fetched:', user);
    
    // Update cache with fresh data
    auth.setUser(user);
    return user;
  },

  register: async (userData: {
    email: string;
    password: string;
    fullName?: string;
    role: string;
    schoolId: string;
    matiere?: string;
    phone?: string;
  }) => {
    const response = await api.post<{ token: string; user: any }>(
      '/auth/register',
      userData,
      { skipAuth: true }
    );
    
    // Store token and user info
    auth.setToken(response.token);
    auth.setUser(response.user);
    
    return response;
  },

  /**
   * Register a user BY ADMIN - does NOT return token
   * Use this when admin creates teachers/students to prevent auto-login
   * Admin stays logged in as admin after creating users
   */
  registerByAdmin: async (userData: {
    email: string;
    password: string;
    fullName?: string;
    role: string;
    schoolId: string;
    dateOfBirth?: string;
    gender?: string;
    parentContact?: string;
    massar?: string;
    classId?: string;
  }) => {
    console.log('[AUTH] Admin creating user (no auto-login):', { email: userData.email, role: userData.role });
    
    // Uses admin's current token for authorization
    const response = await api.post<{ user: any; message: string }>(
      '/auth/register-by-admin',
      userData,
      { skipAuth: false } // Use admin's token
    );
    
    // ✅ CRITICAL: Do NOT touch localStorage or auth state
    // Admin remains logged in
    console.log('[AUTH] User created by admin successfully, admin session preserved');
    
    return response;
  },

  signupAdmin: async (signupData: {
    fullName: string;
    email: string;
    password: string;
    schoolName: string;
    schoolCity: string;
    schoolRegion: string;
    schoolLevel: string;
    schoolStatus: string;
    schoolAddress: string;
    schoolStudents: number;
  }) => {
    const response = await api.post<{ 
      token: string; 
      user: any;
      school: { id: number; name: string; city: string; region: string; };
    }>(
      '/auth/signup-admin',
      signupData,
      { skipAuth: true }
    );
    
    // Store token and user info
    auth.setToken(response.token);
    auth.setUser(response.user);
    
    return response;
  },
};

// School API endpoints
export const schoolApi = {
  getAll: () => api.get<any[]>('/schools'),
  
  getById: (id: string) => api.get<any>(`/schools/${id}`),
  
  create: (school: any) => api.post<any>('/schools', school),
  
  update: (id: string, school: any) => api.put<any>(`/schools/${id}`, school),
  
  delete: (id: string) => api.delete(`/schools/${id}`),
  
  uploadLogo: (schoolId: string, file: File) => 
    api.upload<{ url: string }>('/storage/upload', file, { 
      entityType: 'school_logo',
      entityId: schoolId 
    }),
};

interface Activity {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  classId: string;
  nature?: string; // NEW
}

// Activity API endpoints
export const activityApi = {
  getAll: () => api.get<any[]>('/activities'),
  
  getById: (id: string) => api.get<any>(`/activities/${id}`),
  
  create: (activity: any) => api.post<any>('/activities', activity),
  
  update: (id: string, activity: any) => api.put<any>(`/activities/${id}`, activity),
  
  delete: (id: string) => api.delete(`/activities/${id}`),
  
  uploadResource: (activityId: string, file: File) =>
    api.upload<{ url: string }>('/storage/upload', file, {
      entityType: 'activity_resource',
      entityId: activityId
    }),
   getPublished: (params: { 
  schoolId: string; 
  classId?: string;
  nature?: 'Classe' | 'fait maison';
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
}) => {
  const { schoolId, classId, nature, approvalStatus } = params;
  let query = `?schoolId=${schoolId}`;
  if (classId) query += `&classId=${classId}`;
  if (nature) query += `&nature=${nature}`;
  if (approvalStatus) query += `&approvalStatus=${approvalStatus}`;
  
  return api.get<Activity[]>(`/activities/published${query}`);
},
};

// Class (Classe) API endpoints
export const classApi = {
  getAll: () => api.get<any[]>('/classes'),
  
  getBySchoolId: (schoolId: string) => api.get<any[]>(`/classes/school/${schoolId}`),
  
  getById: (id: string) => api.get<any>(`/classes/${id}`),
  
  create: (classData: any) => api.post<any>('/classes', classData),
  
  update: (id: string, classData: any) => api.put<any>(`/classes/${id}`, classData),
  
  delete: (id: string) => api.delete(`/classes/${id}`),
};

// Teacher API endpoints
export const teacherApi = {
  getAll: () => api.get<any[]>('/teachers'),
  
  getBySchoolId: (schoolId: string) => api.get<any[]>(`/teachers/school/${schoolId}`),
  
  getById: (id: string) => api.get<any>(`/teachers/${id}`),
  
  create: (teacher: any) => api.post<any>('/teachers', teacher),
  
  update: (id: string, teacher: any) => api.put<any>(`/teachers/${id}`, teacher),
  
  delete: (id: string) => api.delete(`/teachers/${id}`),
};

// Session API endpoints
export const sessionApi = {
  getAll: () => api.get<any[]>('/sessions'),
  
  getByTeacherId: (teacherId: string) => api.get<any[]>(`/sessions/teacher/${teacherId}`),
  
  getById: (id: string) => api.get<any>(`/sessions/${id}`),
  
  create: (session: any) => api.post<any>('/sessions', session),
  
  update: (id: string, session: any) => api.put<any>(`/sessions/${id}`, session),
  
  delete: (id: string) => api.delete(`/sessions/${id}`),
};

// Storage/File API endpoints
export const storageApi = {
  upload: (file: File, entityType: string, entityId: string) =>
    api.upload<{ url: string; fileName: string }>('/storage/upload', file, {
      entityType,
      entityId
    }),
  
  getSignedUrl: (fileName: string) =>
    api.get<{ url: string }>(`/storage/signed-url?fileName=${encodeURIComponent(fileName)}`),
  
  delete: (fileName: string) =>
    api.delete(`/storage/${encodeURIComponent(fileName)}`),
};

// Statistics API endpoints
export const statsApi = {
  getAdminStats: () => api.get<any>('/stats/admin'),
  
  getSchoolStats: (schoolId: string) => api.get<any>(`/stats/school/${schoolId}`),
  
  getTeacherStats: (teacherId: string) => api.get<any>(`/stats/teacher/${teacherId}`),
};

// Student API endpoints
export const studentApi = {
  getAll: () => api.get<any[]>('/students'),
  
  getBySchoolId: (schoolId: string) => api.get<any[]>(`/students/school/${schoolId}`),
  
  getByClass: (classId: string) => api.get<any[]>(`/students/class/${classId}`),
  
  getById: (id: string) => api.get<any>(`/students/${id}`),
getCurrentStudent: () => api.get<any>('/students/me', { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } }),  
  create: (studentData: any) => api.post<any>('/students', studentData),
  
  update: (id: string, studentData: any) => api.put<any>(`/students/${id}`, studentData),
  
  delete: (id: string) => api.delete(`/students/${id}`),
};

// Ajoutez ces interfaces et API endpoints à votre fichier api.ts existant

// ============================================
// DIAGNOSTIC TYPES
// ============================================

// types/diagnostic.ts ou dans ton fichier d'API
export interface DiagnosticSession {
  id: string;
  schoolId: number;
  teacherId: string;
  diagnosticType: string;
  gradeLevel: string;
  className?: string;
  classId?: string;
  totalStudents: number;
  status?: string;
  sessionDate?: string; // ISO string
  createdAt: string;
  updatedAt?: string;
}

export interface DiagnosticStudent {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  studentOrder: number;
}

export interface DiagnosticResult {
  id: string;
  sessionId: string;
  studentId: string;
  criteriaData: Record<string, string>;
  finalResult: string;
  createdAt: string;
}

export interface CreateDiagnosticSessionRequest {
  schoolId: number;
  teacherId: string;
  diagnosticType: string;
  gradeLevel: string;
  className?: string;
  classId: string; // ID de la classe pour récupérer automatiquement les étudiants
}

export interface SaveDiagnosticResultsRequest {
  sessionId: string;
  results: Array<{
    studentId: string;
    criteriaData: Record<string, string>;
    finalResult: string;
  }>;
}

export interface DiagnosticStats {
  resultDistribution: Record<string, number>;
  criteriaStats: Record<string, Record<string, number>>;
  studentResults: Array<{
    studentName: string;
    criteriaData: Record<string, string>;
    finalResult: string;
  }>;
}

// ============================================
// DIAGNOSTIC API ENDPOINTS
// ============================================

export const diagnosticApi = {
  /**
   * Créer une nouvelle session de diagnostic
   * Les étudiants sont automatiquement récupérés depuis la classe
   */
  createSession: (data: CreateDiagnosticSessionRequest) =>
    api.post<DiagnosticSession>('/diagnostics/sessions', data),

  /**
   * Récupérer une session par ID
   */
  getSession: (sessionId: string) =>
    api.get<DiagnosticSession>(`/diagnostics/sessions/${sessionId}`),

  /**
   * Récupérer toutes les sessions d'un enseignant
   */
  getSessionsByTeacher: (teacherId: string) =>
    api.get<DiagnosticSession[]>(`/diagnostics/sessions/teacher/${teacherId}`),

  /**
   * Récupérer toutes les sessions d'une école
   */
  getSessionsBySchool: (schoolId: number) =>
    api.get<DiagnosticSession[]>(`/diagnostics/sessions/school/${schoolId}`),

  /**
   * Récupérer les étudiants d'une session
   */
  getSessionStudents: (sessionId: string) =>
    api.get<DiagnosticStudent[]>(`/diagnostics/sessions/${sessionId}/students`),

  /**
   * Sauvegarder les résultats d'un diagnostic
   */
  saveResults: (data: SaveDiagnosticResultsRequest) =>
    api.post<void>('/diagnostics/results', data),

  /**
   * Récupérer les résultats d'une session
   */
  getResults: (sessionId: string) =>
    api.get<DiagnosticResult[]>(`/diagnostics/sessions/${sessionId}/results`),

  /**
   * Récupérer les statistiques d'une session
   */
  getStats: (sessionId: string) =>
    api.get<DiagnosticStats>(`/diagnostics/sessions/${sessionId}/stats`),

  /**
   * Supprimer une session de diagnostic
   */
  deleteSession: (sessionId: string) =>
    api.delete<void>(`/diagnostics/sessions/${sessionId}`),
};

// Subject API endpoints
export const subjectApi = {
  getAll: () => api.get<any[]>('/subjects'),
  
  getBySchoolId: (schoolId: number, activeOnly: boolean = false) => 
    api.get<any[]>(`/subjects/school/${schoolId}?activeOnly=${activeOnly}`),
  
  getById: (id: string) => api.get<any>(`/subjects/${id}`),
  
  create: (subject: any) => api.post<any>('/subjects', subject),
  
  update: (id: string, subject: any) => api.put<any>(`/subjects/${id}`, subject),
  
  toggleStatus: (id: string) => api.patch<any>(`/subjects/${id}/toggle-status`, {}),
  
  delete: (id: string) => api.delete(`/subjects/${id}`),
};

// Teacher Management API endpoints (new teacher entity with specialty)
export const teacherManagementApi = {
  getAll: () => api.get<any[]>('/teacher-management'),
  
  getBySchoolId: (schoolId: number, specialty?: string, activeOnly: boolean = false) => {
    const params = new URLSearchParams({ activeOnly: String(activeOnly) });
    if (specialty) params.append('specialty', specialty);
    return api.get<any[]>(`/teacher-management/school/${schoolId}?${params.toString()}`);
  },
  
  getById: (id: string) => api.get<any>(`/teacher-management/${id}`),
  
  getByProfileId: (profileId: string) => api.get<any>(`/teacher-management/profile/${profileId}`),
  
  create: (teacher: any) => api.post<any>('/teacher-management', teacher),
  
  update: (id: string, teacher: any) => api.put<any>(`/teacher-management/${id}`, teacher),
  
  toggleStatus: (id: string) => api.patch<any>(`/teacher-management/${id}/toggle-status`, {}),
  
  delete: (id: string) => api.delete(`/teacher-management/${id}`),
};

// Class Subject API endpoints
export const classSubjectApi = {
  assignSubject: (assignment: any) => api.post<any>('/class-subjects', assignment),
  
  updateAssignment: (id: string, assignment: any) => api.put<any>(`/class-subjects/${id}`, assignment),
  
  assignTeacher: (classId: string, subjectId: string, teacherId: string) =>
    api.patch<any>(`/class-subjects/class/${classId}/subject/${subjectId}/teacher/${teacherId}`, {}),
  
  getSubjectsForClass: (classId: string) => api.get<any[]>(`/class-subjects/class/${classId}`),
  
  getClassesForTeacher: (teacherId: string) => api.get<any[]>(`/class-subjects/teacher/${teacherId}`),
  
  getClassesForSubject: (subjectId: string) => api.get<any[]>(`/class-subjects/subject/${subjectId}`),
  
  removeSubject: (classId: string, subjectId: string) =>
    api.delete(`/class-subjects/class/${classId}/subject/${subjectId}`),
  
  removeAllSubjects: (classId: string) => api.delete(`/class-subjects/class/${classId}/all`),
  getByTeacherId: (teacherId: string) =>
  api.get(`/class-subjects/teacher/${teacherId}`),
};

// Teacher Activity API endpoints (approval workflow)
// ...existing code...

// Dans ton fichier api.ts → remplace teacherActivityApi par ÇA :

export const teacherActivityApi = {
  // CES ROUTES EXISTENT DÉJÀ DANS TON BACKEND → 100% SÛR
  getPendingActivities: async (subjectId?: string) => {
    const params = subjectId ? `?subjectId=${subjectId}` : '';
    return api.get<any[]>(`/activities/pending-approval${params}`);
  },

  getPendingCount: async () => {
    return api.get<{ count: number }>('/activities/pending-count');
  },

  // CELLE-LÀ EST CORRECTE (tu l’as déjà corrigée)
  getMyActivities: async () => {
    return api.get<any[]>('/activities/teacher/my-activities');
  },

  approveActivity: async (activityId: string) => {
    return api.post<any>(`/activities/${activityId}/approve`, {});
  },

  denyActivity: async (activityId: string) => {
    return api.post<any>(`/activities/${activityId}/deny`, {});
  },
};
// ...existing code...

// Export everything
export default api;