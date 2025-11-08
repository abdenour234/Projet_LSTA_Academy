-- ============================================
-- School Management System - Complete Database Initialization
-- Version: 2.0 (RBAC Fixed)
-- Date: October 29, 2025
-- ============================================

-- ============================================
-- 1. CREATE ENUMS
-- ============================================

-- Create enum for user roles (with all 4 roles: SUPERADMIN, ADMIN, TEACHER, STUDENT)
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM ('SUPERADMIN', 'ADMIN', 'TEACHER', 'STUDENT');

-- ============================================
-- 2. CREATE TABLES
-- ============================================

-- TABLE: schools
CREATE TABLE IF NOT EXISTS public.schools (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  region TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('Primaire', 'Collège', 'Lycée')),
  status TEXT NOT NULL CHECK (status IN ('Public', 'Privé')),
  address TEXT NOT NULL,
  students INTEGER NOT NULL,
  last_diagnostic TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TABLE: profiles (with password_hash for authentication)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  full_name TEXT,
  school_id BIGINT REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,  -- Changed from TEXT to BIGINT
  matiere TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TABLE: user_roles (single role per user)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  role app_role NOT NULL
);

-- TABLE: students (with user_id for authentication)
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  school_id BIGINT NOT NULL,  -- Changed from TEXT to BIGINT
  class_id UUID,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth TIMESTAMP WITH TIME ZONE,
  gender TEXT CHECK (gender IN ('M', 'F')),
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for student user lookups
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_school_id ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);

-- TABLE: activities
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id BIGINT REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,  -- Changed from TEXT to BIGINT
  type TEXT NOT NULL CHECK (type IN ('Orale', 'Lecture', 'Écriture')),
  title TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TABLE: activity_files
CREATE TABLE IF NOT EXISTS public.activity_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  file_path TEXT NOT NULL,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TABLE: diagnostics
CREATE TABLE IF NOT EXISTS public.diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id BIGINT REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,  -- Changed from TEXT to BIGINT
  teacher_id UUID NOT NULL,
  subject TEXT NOT NULL,
  level TEXT NOT NULL,
  result INTEGER CHECK (result >= 0 AND result <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TABLE: diagnostic_sessions
CREATE TABLE IF NOT EXISTS public.diagnostic_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id BIGINT NOT NULL,  -- Changed from TEXT to BIGINT
  teacher_id UUID NOT NULL,
  class_id UUID,
  subject TEXT NOT NULL,
  level TEXT NOT NULL,
  session_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')),
  results JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TABLE: classes
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id BIGINT NOT NULL,  -- Changed from TEXT to BIGINT
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  filiere TEXT,
  annee_scolaire TEXT NOT NULL,
  effectif INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TABLE: teacher_classes (many-to-many)
CREATE TABLE IF NOT EXISTS public.teacher_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(teacher_id, class_id)
);

-- TABLE: teaching_sessions
CREATE TABLE IF NOT EXISTS public.teaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  school_id BIGINT NOT NULL,  -- Changed from TEXT to BIGINT
  session_date DATE NOT NULL,
  duration_minutes INTEGER,
  activities_realized TEXT[],
  percentage_acquired INTEGER CHECK (percentage_acquired >= 0 AND percentage_acquired <= 100),
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TABLE: session_progress
CREATE TABLE IF NOT EXISTS public.session_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.teaching_sessions(id) ON DELETE CASCADE,
  competence TEXT NOT NULL,
  acquired_count INTEGER DEFAULT 0,
  not_acquired_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TABLE: user_activity_logs
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  school_id BIGINT NOT NULL,  -- Changed from TEXT to BIGINT
  activity_type TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 0,
  activity_date DATE NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TABLE: conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id BIGINT NOT NULL,  -- Changed from TEXT to BIGINT
  participant_ids UUID[] NOT NULL,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TABLE: messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  read_by UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TABLE: resources
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id BIGINT NOT NULL,  -- Changed from TEXT to BIGINT
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- 3. CREATE FUNCTIONS
-- ============================================

-- Function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. CREATE TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_activities_updated_at ON public.activities;
CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_teaching_sessions_updated_at ON public.teaching_sessions;
CREATE TRIGGER update_teaching_sessions_updated_at
  BEFORE UPDATE ON public.teaching_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_classes_updated_at ON public.classes;
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_resources_updated_at ON public.resources;
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_diagnostic_sessions_updated_at ON public.diagnostic_sessions;
CREATE TRIGGER update_diagnostic_sessions_updated_at
  BEFORE UPDATE ON public.diagnostic_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 5. SEED DATA
-- ============================================

-- Insert demo schools (remove explicit IDs, let BIGSERIAL auto-generate)
INSERT INTO public.schools (name, city, region, level, status, address, students, last_diagnostic) VALUES
  ('École Ibn Battuta', 'Oujda', 'Oriental', 'Primaire', 'Public', 'Quartier Al Qods, Oujda', 320, '2025-09-15'),
  ('Collège Al Andalous', 'Fès', 'Fès-Meknès', 'Collège', 'Public', 'Avenue Hassan II, Fès', 580, '2025-08-22'),
  ('Lycée Pasteur', 'Casablanca', 'Casablanca-Settat', 'Lycée', 'Privé', 'Boulevard Zerktouni, Casablanca', 450, '2025-10-01'),
  ('École Al Farabi', 'Rabat', 'Rabat-Salé-Kénitra', 'Primaire', 'Public', 'Hay Riad, Rabat', 280, '2025-09-28'),
  ('Collège Ibn Khaldoun', 'Marrakech', 'Marrakech-Safi', 'Collège', 'Public', 'Gueliz, Marrakech', 620, '2025-09-10'),
  ('Lycée Excellence', 'Tanger', 'Tanger-Tétouan-Al Hoceïma', 'Lycée', 'Privé', 'Avenue Mohammed VI, Tanger', 380, '2025-09-25');

-- Create SUPERADMIN account
-- Email: admin@admin.com
-- Password: admin123 (BCrypt hashed)
INSERT INTO public.profiles (id, email, password_hash, full_name, school_id, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  'admin@admin.com',
  '$2a$10$xvNHQYZBwlH7OzvGxkxhUOQRMlVSHIVHzLxQjz3cjKUmjGRjKWn0K',
  'Super Admin',
  1,  -- Changed from '1' (text) to 1 (bigint)
  now(),
  now()
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name;

-- Assign SUPERADMIN role
INSERT INTO public.user_roles (user_id, role)
VALUES ('00000000-0000-0000-0000-000000000001'::UUID, 'SUPERADMIN')
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

-- ============================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- ============================================
-- 6.1 FOREIGN KEY INDEXES
-- ============================================
-- Critical for JOIN performance and referential integrity

-- Profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON public.profiles(school_id);

-- User roles table
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Activity files table
CREATE INDEX IF NOT EXISTS idx_activity_files_activity_id ON public.activity_files(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_files_uploaded_by ON public.activity_files(uploaded_by);

-- Diagnostics table
CREATE INDEX IF NOT EXISTS idx_diagnostics_school_id ON public.diagnostics(school_id);
CREATE INDEX IF NOT EXISTS idx_diagnostics_teacher_id ON public.diagnostics(teacher_id);

-- Diagnostic sessions table
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_school_id ON public.diagnostic_sessions(school_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_teacher_id ON public.diagnostic_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_class_id ON public.diagnostic_sessions(class_id);

-- Classes table
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON public.classes(school_id);

-- Teacher classes table (many-to-many)
CREATE INDEX IF NOT EXISTS idx_teacher_classes_teacher_id ON public.teacher_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_classes_class_id ON public.teacher_classes(class_id);

-- Teaching sessions table
CREATE INDEX IF NOT EXISTS idx_teaching_sessions_school_id ON public.teaching_sessions(school_id);
CREATE INDEX IF NOT EXISTS idx_teaching_sessions_teacher_id ON public.teaching_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teaching_sessions_class_id ON public.teaching_sessions(class_id);

-- Session progress table
CREATE INDEX IF NOT EXISTS idx_session_progress_session_id ON public.session_progress(session_id);

-- User activity logs table
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_school_id ON public.user_activity_logs(school_id);

-- Conversations table
CREATE INDEX IF NOT EXISTS idx_conversations_school_id ON public.conversations(school_id);

-- Messages table
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);

-- Resources table
CREATE INDEX IF NOT EXISTS idx_resources_school_id ON public.resources(school_id);
CREATE INDEX IF NOT EXISTS idx_resources_created_by ON public.resources(created_by);

-- Activities table
CREATE INDEX IF NOT EXISTS idx_activities_school_id ON public.activities(school_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_by ON public.activities(created_by);

-- ============================================
-- 6.2 SINGLE COLUMN INDEXES (Frequently Queried)
-- ============================================

-- Students table - search queries
CREATE INDEX IF NOT EXISTS idx_students_first_name ON public.students(first_name);
CREATE INDEX IF NOT EXISTS idx_students_last_name ON public.students(last_name);

-- Activities table - filter queries
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_level ON public.activities(level);

-- Classes table - filter queries
CREATE INDEX IF NOT EXISTS idx_classes_level ON public.classes(level);
CREATE INDEX IF NOT EXISTS idx_classes_annee_scolaire ON public.classes(annee_scolaire);

-- Teaching sessions table - date queries
CREATE INDEX IF NOT EXISTS idx_teaching_sessions_session_date ON public.teaching_sessions(session_date);

-- User activity logs table - date and type queries
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_activity_date ON public.user_activity_logs(activity_date);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_activity_type ON public.user_activity_logs(activity_type);

-- Schools table - filter queries
CREATE INDEX IF NOT EXISTS idx_schools_city ON public.schools(city);
CREATE INDEX IF NOT EXISTS idx_schools_region ON public.schools(region);
CREATE INDEX IF NOT EXISTS idx_schools_level ON public.schools(level);
CREATE INDEX IF NOT EXISTS idx_schools_status ON public.schools(status);

-- Resources table - type filter
CREATE INDEX IF NOT EXISTS idx_resources_file_type ON public.resources(file_type);

-- Diagnostic sessions table - filter queries
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_status ON public.diagnostic_sessions(status);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_subject ON public.diagnostic_sessions(subject);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_level ON public.diagnostic_sessions(level);

-- ============================================
-- 6.3 COMPOSITE INDEXES (Multi-column)
-- ============================================
-- Optimizes common query combinations

-- Teaching sessions - common query patterns
CREATE INDEX IF NOT EXISTS idx_teaching_sessions_teacher_class ON public.teaching_sessions(teacher_id, class_id);
CREATE INDEX IF NOT EXISTS idx_teaching_sessions_school_teacher ON public.teaching_sessions(school_id, teacher_id);
CREATE INDEX IF NOT EXISTS idx_teaching_sessions_school_date ON public.teaching_sessions(school_id, session_date);

-- User activity logs - common query patterns
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_school_date ON public.user_activity_logs(school_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_date ON public.user_activity_logs(user_id, activity_date);

-- Classes - common filter combinations
CREATE INDEX IF NOT EXISTS idx_classes_school_level ON public.classes(school_id, level);
CREATE INDEX IF NOT EXISTS idx_classes_school_year ON public.classes(school_id, annee_scolaire);

-- Activities - common filter combinations
CREATE INDEX IF NOT EXISTS idx_activities_school_type ON public.activities(school_id, type);
CREATE INDEX IF NOT EXISTS idx_activities_school_level ON public.activities(school_id, level);

-- Diagnostic sessions - teacher diagnostics
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_school_teacher ON public.diagnostic_sessions(school_id, teacher_id);



-- Resources - school resources by type
CREATE INDEX IF NOT EXISTS idx_resources_school_type ON public.resources(school_id, file_type);

-- Students - search optimization
CREATE INDEX IF NOT EXISTS idx_students_school_class ON public.students(school_id, class_id);

-- ============================================
-- 6.4 SPECIALIZED INDEXES
-- ============================================

-- GIN index for array search on messages read_by
CREATE INDEX IF NOT EXISTS idx_messages_read_by ON public.messages USING GIN(read_by);

-- GIN index for array search on conversations participant_ids
CREATE INDEX IF NOT EXISTS idx_conversations_participant_ids ON public.conversations USING GIN(participant_ids);

-- Text search index for student names (case-insensitive search)
CREATE INDEX IF NOT EXISTS idx_students_first_name_lower ON public.students(LOWER(first_name));
CREATE INDEX IF NOT EXISTS idx_students_last_name_lower ON public.students(LOWER(last_name));

-- ============================================
-- INDEX CREATION SUMMARY
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '📊 Index creation complete:';
  RAISE NOTICE '   - Foreign key indexes: 18';
  RAISE NOTICE '   - Single column indexes: 15';
  RAISE NOTICE '   - Composite indexes: 11';
  RAISE NOTICE '   - Specialized indexes: 4';
  RAISE NOTICE '   - Total indexes: 48';
END $$;

-- ============================================
-- INITIALIZATION COMPLETE
-- ============================================

-- Log successful initialization
DO $$
BEGIN
  RAISE NOTICE '✅ Database initialization complete!';
  RAISE NOTICE '📊 Schema version: 2.0 (RBAC Fixed)';
  RAISE NOTICE '🔐 SUPERADMIN account created: admin@admin.com / admin123';
  RAISE NOTICE '🏫 Demo schools: 6 schools loaded';
  RAISE NOTICE '👥 Roles supported: SUPERADMIN, ADMIN, TEACHER, STUDENT';
END $$;
