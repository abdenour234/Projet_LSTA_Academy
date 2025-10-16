-- ============================================
-- School Management System - PostgreSQL Schema
-- Consolidated migration for Docker deployment
-- ============================================

-- Create enum for user roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'teacher');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- TABLE: schools
-- ============================================
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

-- ============================================
-- TABLE: profiles
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  full_name TEXT,
  school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  matiere TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- TABLE: user_roles
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- ============================================
-- TABLE: activities
-- ============================================
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

-- ============================================
-- TABLE: diagnostics
-- ============================================
CREATE TABLE IF NOT EXISTS public.diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID NOT NULL,
  subject TEXT NOT NULL,
  level TEXT NOT NULL,
  result INTEGER CHECK (result >= 0 AND result <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- TABLE: classes
-- ============================================
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

-- ============================================
-- TABLE: teacher_classes (many-to-many)
-- ============================================
CREATE TABLE IF NOT EXISTS public.teacher_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(teacher_id, class_id)
);

-- ============================================
-- TABLE: teaching_sessions
-- ============================================
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

-- ============================================
-- TABLE: session_progress
-- ============================================
CREATE TABLE IF NOT EXISTS public.session_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.teaching_sessions(id) ON DELETE CASCADE,
  competence TEXT NOT NULL,
  acquired_count INTEGER DEFAULT 0,
  not_acquired_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- TABLE: user_activity_logs
-- ============================================
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

-- ============================================
-- TABLE: conversations
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL,
  participant_ids UUID[] NOT NULL,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- TABLE: messages
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  read_by UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- FUNCTIONS
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
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teaching_sessions_updated_at
  BEFORE UPDATE ON public.teaching_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SEED DATA
-- ============================================

INSERT INTO public.schools (id, name, city, region, level, status, address, students, last_diagnostic) VALUES
  ('1', 'École Ibn Battuta', 'Oujda', 'Oriental', 'Primaire', 'Public', 'Quartier Al Qods, Oujda', 320, '2025-09-15'),
  ('2', 'Collège Al Andalous', 'Fès', 'Fès-Meknès', 'Collège', 'Public', 'Avenue Hassan II, Fès', 580, '2025-08-22'),
  ('3', 'Lycée Pasteur', 'Casablanca', 'Casablanca-Settat', 'Lycée', 'Privé', 'Boulevard Zerktouni, Casablanca', 450, '2025-10-01'),
  ('4', 'École Al Farabi', 'Rabat', 'Rabat-Salé-Kénitra', 'Primaire', 'Public', 'Hay Riad, Rabat', 280, '2025-09-28'),
  ('5', 'Collège Ibn Khaldoun', 'Marrakech', 'Marrakech-Safi', 'Collège', 'Public', 'Gueliz, Marrakech', 620, '2025-09-10'),
  ('6', 'Lycée Excellence', 'Tanger', 'Tanger-Tétouan-Al Hoceïma', 'Lycée', 'Privé', 'Avenue Mohammed VI, Tanger', 380, '2025-09-25')
ON CONFLICT (id) DO NOTHING;
