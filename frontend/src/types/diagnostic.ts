export type DiagnosticType = 
  | 'learning_pace'
  | 'learning_style'
  | 'multiple_intelligences'
  | 'family_support'
  | 'participation_motivation';

export interface DiagnosticCriteria {
  id: string;
  label: string;
  options: string[];
}

export interface DiagnosticGrid {
  type: DiagnosticType;
  title: string;
  description: string;
  criteria: DiagnosticCriteria[];
  resultOptions: string[];
}

export interface Student {
  id: string;
  name: string;
  order: number;
}

export interface DiagnosticSession {
  id: string;
  school_id: string;
  teacher_id: string;
  diagnostic_type: DiagnosticType;
  grade_level: string;
  class_name?: string;
  session_date: string;
  total_students: number;
  created_at: string;
}

export interface DiagnosticResult {
  id: string;
  session_id: string;
  student_id: string;
  criteria_data: any;
  final_result: string;
  created_at: string;
  updated_at: string;
}
