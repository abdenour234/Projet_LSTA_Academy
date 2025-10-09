-- Create enum for diagnostic types
CREATE TYPE diagnostic_type AS ENUM (
  'learning_pace',
  'learning_style',
  'multiple_intelligences',
  'family_support',
  'participation_motivation'
);

-- Create diagnostic_sessions table
CREATE TABLE diagnostic_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diagnostic_type diagnostic_type NOT NULL,
  grade_level TEXT NOT NULL,
  class_name TEXT,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_students INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create students table for diagnostic sessions
CREATE TABLE diagnostic_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES diagnostic_sessions(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create diagnostic_results table to store evaluations
CREATE TABLE diagnostic_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES diagnostic_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES diagnostic_students(id) ON DELETE CASCADE,
  criteria_data JSONB NOT NULL, -- Stores all criteria responses
  final_result TEXT NOT NULL, -- Stores the calculated final result
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE diagnostic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for diagnostic_sessions
CREATE POLICY "Users can view sessions from their school"
  ON diagnostic_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.school_id = diagnostic_sessions.school_id
    )
  );

CREATE POLICY "Teachers can insert their own sessions"
  ON diagnostic_sessions FOR INSERT
  WITH CHECK (
    auth.uid() = teacher_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.school_id = diagnostic_sessions.school_id
    )
  );

CREATE POLICY "Teachers can update their own sessions"
  ON diagnostic_sessions FOR UPDATE
  USING (auth.uid() = teacher_id);

-- RLS Policies for diagnostic_students
CREATE POLICY "Users can view students from their school sessions"
  ON diagnostic_students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostic_sessions ds
      JOIN profiles p ON p.id = auth.uid()
      WHERE ds.id = diagnostic_students.session_id
      AND ds.school_id = p.school_id
    )
  );

CREATE POLICY "Teachers can insert students in their sessions"
  ON diagnostic_students FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostic_sessions
      WHERE diagnostic_sessions.id = diagnostic_students.session_id
      AND diagnostic_sessions.teacher_id = auth.uid()
    )
  );

-- RLS Policies for diagnostic_results
CREATE POLICY "Users can view results from their school"
  ON diagnostic_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM diagnostic_sessions ds
      JOIN profiles p ON p.id = auth.uid()
      WHERE ds.id = diagnostic_results.session_id
      AND ds.school_id = p.school_id
    )
  );

CREATE POLICY "Teachers can insert results in their sessions"
  ON diagnostic_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostic_sessions
      WHERE diagnostic_sessions.id = diagnostic_results.session_id
      AND diagnostic_sessions.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update their results"
  ON diagnostic_results FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM diagnostic_sessions
      WHERE diagnostic_sessions.id = diagnostic_results.session_id
      AND diagnostic_sessions.teacher_id = auth.uid()
    )
  );

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_diagnostic_sessions_updated_at
  BEFORE UPDATE ON diagnostic_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diagnostic_results_updated_at
  BEFORE UPDATE ON diagnostic_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_diagnostic_sessions_school ON diagnostic_sessions(school_id);
CREATE INDEX idx_diagnostic_sessions_teacher ON diagnostic_sessions(teacher_id);
CREATE INDEX idx_diagnostic_students_session ON diagnostic_students(session_id);
CREATE INDEX idx_diagnostic_results_session ON diagnostic_results(session_id);
CREATE INDEX idx_diagnostic_results_student ON diagnostic_results(student_id);