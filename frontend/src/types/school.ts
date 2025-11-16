/**
 * School Management Types
 * Types for subjects, teachers, and class-subject assignments
 */

export interface Subject {
  id: string;
  schoolId: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectDTO {
  schoolId: number;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface Teacher {
  id: string;
  profileId: string;
  schoolId: number;
  specialty: string;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherDTO {
  profileId: string;
  schoolId: number;
  specialty: string;
  phoneNumber?: string;
  isActive?: boolean;
}

export interface ClassSubject {
  id: string;
  classId: string;
  subjectId: string;
  teacherId?: string;
  hoursPerWeek?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClassSubjectDTO {
  classId: string;
  subjectId: string;
  teacherId?: string;
  hoursPerWeek?: number;
}

// Extended types with related data for display
export interface TeacherWithProfile extends Teacher {
  profile?: {
    id: string;
    email: string;
    fullName: string;
  };
}

export interface ClassSubjectWithDetails extends ClassSubject {
  subject?: Subject;
  teacher?: TeacherWithProfile;
  className?: string;
}
