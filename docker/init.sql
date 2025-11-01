-- ============================================-- Simple initialization script for PostgreSQL database

-- School Management System - Complete Database Initialization-- Creates app_role enum type needed by JPA entities

-- Unified schema with RBAC fixes applied

-- Version: 2.0 (RBAC Fixed)DO $$ 

-- Date: October 29, 2025BEGIN

-- ============================================    -- Create app_role enum if it doesn't exist

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN

-- ============================================        CREATE TYPE app_role AS ENUM ('admin', 'teacher', 'superadmin', 'student');

-- 1. CREATE ENUMS    END IF;

-- ============================================END $$;


-- Create enum for user roles (with all 4 roles: SUPERADMIN, ADMIN, TEACHER, STUDENT)
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM ('SUPERADMIN', 'ADMIN', 'TEACHER', 'STUDENT');

-- ============================================
-- 2. CREATE TABLES
-- ============================================

-- TABLE: schools
CREATE TABLE IF NOT EXISTS public.schools (
  id TEXT PRIMARY KEY,
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
  school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
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
  school_id TEXT NOT NULL,
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
  school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
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
  school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID NOT NULL,
  subject TEXT NOT NULL,
  level TEXT NOT NULL,
  result INTEGER CHECK (result >= 0 AND result <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TABLE: diagnostic_sessions
CREATE TABLE IF NOT EXISTS public.diagnostic_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL,
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
  school_id TEXT NOT NULL,
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
  school_id TEXT NOT NULL,
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
  school_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 0,
  activity_date DATE NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TABLE: conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL,
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
  school_id TEXT NOT NULL,
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

-- Insert demo schools
INSERT INTO public.schools (id, name, city, region, level, status, address, students, last_diagnostic) VALUES
  ('1', 'École Ibn Battuta', 'Oujda', 'Oriental', 'Primaire', 'Public', 'Quartier Al Qods, Oujda', 320, '2025-09-15'),
  ('2', 'Collège Al Andalous', 'Fès', 'Fès-Meknès', 'Collège', 'Public', 'Avenue Hassan II, Fès', 580, '2025-08-22'),
  ('3', 'Lycée Pasteur', 'Casablanca', 'Casablanca-Settat', 'Lycée', 'Privé', 'Boulevard Zerktouni, Casablanca', 450, '2025-10-01'),
  ('4', 'École Al Farabi', 'Rabat', 'Rabat-Salé-Kénitra', 'Primaire', 'Public', 'Hay Riad, Rabat', 280, '2025-09-28'),
  ('5', 'Collège Ibn Khaldoun', 'Marrakech', 'Marrakech-Safi', 'Collège', 'Public', 'Gueliz, Marrakech', 620, '2025-09-10'),
  ('6', 'Lycée Excellence', 'Tanger', 'Tanger-Tétouan-Al Hoceïma', 'Lycée', 'Privé', 'Avenue Mohammed VI, Tanger', 380, '2025-09-25')
ON CONFLICT (id) DO NOTHING;

-- Create SUPERADMIN account
-- Email: admin@admin.com
-- Password: admin123 (BCrypt hashed)
INSERT INTO public.profiles (id, email, password_hash, full_name, school_id, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  'admin@admin.com',
  '$2a$10$xvNHQYZBwlH7OzvGxkxhUOQRMlVSHIVHzLxQjz3cjKUmjGRjKWn0K',
  'Super Admin',
  '1',
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

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON public.profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_activities_school_id ON public.activities(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON public.classes(school_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_teaching_sessions_school_id ON public.teaching_sessions(school_id);
CREATE INDEX IF NOT EXISTS idx_teaching_sessions_teacher_id ON public.teaching_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teaching_sessions_class_id ON public.teaching_sessions(class_id);

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
