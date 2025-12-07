/**
 * User API Service
 * Handles user search and listing for messaging system
 */

import api from './api';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  schoolId: number;
}

const userService = {
  /**
   * Find user by email (exact match)
   */
  async getUserByEmail(email: string, schoolId: number): Promise<User> {
    console.log('[USER_API] Getting user by email:', email);
    return api.get<User>(`/users/by-email?email=${encodeURIComponent(email)}&schoolId=${schoolId}`);
  },

  /**
   * List all users in a school (TEACHER + ADMIN only)
   */
  async getUsersBySchool(schoolId: number): Promise<User[]> {
    console.log('[USER_API] Getting users for school:', schoolId);
    return api.get<User[]>(`/users/school/${schoolId}`);
  },

  /**
   * Search users by name or email
   */
  async searchUsers(query: string, schoolId: number, limit: number = 10): Promise<User[]> {
    console.log('[USER_API] Searching users:', query);
    return api.get<User[]>(
      `/users/search?query=${encodeURIComponent(query)}&schoolId=${schoolId}&limit=${limit}`
    );
  },
};

export default userService;
