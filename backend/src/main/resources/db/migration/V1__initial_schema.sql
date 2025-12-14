-- ============================================
-- School Management System - Complete Database Initialization
-- Version: 2.0 (RBAC Fixed + Trigger Order Fixed)
-- Date: November 14, 2025
-- ============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- ============================================
-- 1. CREATE TABLES
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
  school_id BIGINT REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  matiere TEXT,
  phone TEXT,
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TABLE: user_roles (single role per user)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  role TEXT NOT NULL
);

-- TABLE: students (with user_id for authentication)
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  school_id BIGINT NOT NULL,
  class_id UUID,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  massar character varying(255),
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
-- Note: No unique constraint on massar - duplicates are allowed for now
CREATE INDEX IF NOT EXISTS idx_students_massar ON public.students(massar) WHERE massar IS NOT NULL;

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
  school_id BIGINT REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID NOT NULL,
  subject TEXT NOT NULL,
  level TEXT NOT NULL,
  result INTEGER CHECK (result >= 0 AND result <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TABLE: classes
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  filiere TEXT,
  annee_scolaire TEXT NOT NULL,
  effectif INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TABLE: subjects (school-specific subjects)
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id BIGINT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(school_id, name)
);

-- TABLE: teachers (teachers with single specialty)
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_id BIGINT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  specialty TEXT,
  phone_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TABLE: class_subjects (linking classes with subjects and assigned teachers)
CREATE TABLE IF NOT EXISTS public.class_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  hours_per_week INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(class_id, subject_id)
);

-- TABLE: activities (moved here after classes and subjects are created)
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id BIGINT REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  nature TEXT NOT NULL DEFAULT 'Classe' CHECK (nature IN ('Classe', 'fait maison')),
  description TEXT,
  level TEXT NOT NULL,
  layout_data TEXT,
  is_published BOOLEAN DEFAULT false,
  approval_status TEXT DEFAULT 'PENDING' CHECK (approval_status IN ('PENDING', 'APPROVED', 'DENIED')),
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_approval_status ON public.activities(approval_status);
CREATE INDEX IF NOT EXISTS idx_activities_subject_id ON public.activities(subject_id);
CREATE INDEX IF NOT EXISTS idx_activities_class_id ON public.activities(class_id);

-- TABLE: teacher_classes (many-to-many) - DEPRECATED, kept for backward compatibility
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
  school_id BIGINT NOT NULL,
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
  school_id BIGINT NOT NULL,
  activity_type TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 0,
  activity_date DATE NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TABLE: conversations (Messagerie interne entre profs et admins)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id BIGINT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  participant1_id UUID NOT NULL,
  participant2_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_conversation UNIQUE (participant1_id, participant2_id)
);

-- TABLE: messages (Enrichie pour messagerie avec pièces jointes)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id BIGINT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  read_by UUID,
  has_attachments BOOLEAN DEFAULT FALSE,
  attachment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- TABLE: message_attachments (Pièces jointes stockées dans MinIO)
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  file_hash TEXT,
  uploaded_by UUID NOT NULL,
  school_id BIGINT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  scan_status TEXT DEFAULT 'PENDING' CHECK (scan_status IN ('PENDING', 'CLEAN', 'INFECTED', 'ERROR')),
  scan_details TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE,
  purge_scheduled_at TIMESTAMP WITH TIME ZONE
);

-- TABLE: diagnostic_sessions
CREATE TABLE IF NOT EXISTS public.diagnostic_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id BIGINT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  diagnostic_type TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  class_name TEXT,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  total_students INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  session_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TABLE: diagnostic_students
CREATE TABLE IF NOT EXISTS public.diagnostic_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.diagnostic_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TABLE: diagnostic_results
CREATE TABLE IF NOT EXISTS public.diagnostic_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.diagnostic_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.diagnostic_students(id) ON DELETE CASCADE,
  criteria_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  final_result TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TABLE: resources
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TABLE: historique_administration (AC-02-03 - Teacher Attendance Tracking)
-- Historique des événements administratifs : absences et retards des enseignants
CREATE TABLE IF NOT EXISTS public.historique_administration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id BIGINT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('ABSENCE', 'RETARD', 'OTHER')),
  event_date DATE NOT NULL,
  reason TEXT,
  is_justified BOOLEAN NOT NULL DEFAULT false,
  duration_minutes INTEGER,
  recorded_by UUID NOT NULL,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TABLE: historique_professeur (AC-02-03 - Student Attendance Tracking)
-- Historique des événements gérés par les enseignants : absences des étudiants
CREATE TABLE IF NOT EXISTS public.historique_professeur (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id BIGINT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('ABSENCE', 'OTHER')),
  event_date DATE NOT NULL,
  reason TEXT,
  is_justified BOOLEAN NOT NULL DEFAULT false,
  teacher_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- 2. CREATE FUNCTIONS (BEFORE TRIGGERS!)
-- ============================================

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
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

-- ============================================
-- 3. CREATE TRIGGERS (AFTER FUNCTIONS!)
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

DROP TRIGGER IF EXISTS update_diagnostic_results_updated_at ON public.diagnostic_results;
CREATE TRIGGER update_diagnostic_results_updated_at
  BEFORE UPDATE ON public.diagnostic_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON public.profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_activity_files_activity_id ON public.activity_files(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_files_uploaded_by ON public.activity_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_diagnostics_school_id ON public.diagnostics(school_id);
CREATE INDEX IF NOT EXISTS idx_diagnostics_teacher_id ON public.diagnostics(teacher_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_school ON public.diagnostic_sessions(school_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_teacher ON public.diagnostic_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_class ON public.diagnostic_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_students_session ON public.diagnostic_students(session_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_students_student ON public.diagnostic_students(student_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_results_session ON public.diagnostic_results(session_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_results_student ON public.diagnostic_results(student_id);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON public.classes(school_id);

-- Subjects table
CREATE INDEX IF NOT EXISTS idx_subjects_school_id ON public.subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_is_active ON public.subjects(is_active);

-- AC-02-03: Attendance tracking indexes
CREATE INDEX IF NOT EXISTS idx_historique_admin_school_teacher ON public.historique_administration(school_id, teacher_id);
CREATE INDEX IF NOT EXISTS idx_historique_admin_event_date ON public.historique_administration(event_date);
CREATE INDEX IF NOT EXISTS idx_historique_admin_event_type ON public.historique_administration(event_type);
CREATE INDEX IF NOT EXISTS idx_historique_prof_school_teacher ON public.historique_professeur(school_id, teacher_id);
CREATE INDEX IF NOT EXISTS idx_historique_prof_class ON public.historique_professeur(class_id);
CREATE INDEX IF NOT EXISTS idx_historique_prof_student ON public.historique_professeur(student_id);
CREATE INDEX IF NOT EXISTS idx_historique_prof_event_date ON public.historique_professeur(event_date);
CREATE INDEX IF NOT EXISTS idx_historique_prof_event_type ON public.historique_professeur(event_type);

-- Teachers table
CREATE INDEX IF NOT EXISTS idx_teachers_profile_id ON public.teachers(profile_id);
CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON public.teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_specialty ON public.teachers(specialty);
CREATE INDEX IF NOT EXISTS idx_teachers_is_active ON public.teachers(is_active);

-- Class subjects table
CREATE INDEX IF NOT EXISTS idx_class_subjects_class_id ON public.class_subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_subject_id ON public.class_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_teacher_id ON public.class_subjects(teacher_id);

-- Teacher classes table (many-to-many) - DEPRECATED
CREATE INDEX IF NOT EXISTS idx_teacher_classes_teacher_id ON public.teacher_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_classes_class_id ON public.teacher_classes(class_id);
CREATE INDEX IF NOT EXISTS idx_teaching_sessions_school_id ON public.teaching_sessions(school_id);
CREATE INDEX IF NOT EXISTS idx_teaching_sessions_teacher_id ON public.teaching_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teaching_sessions_class_id ON public.teaching_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_session_progress_session_id ON public.session_progress(session_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_school_id ON public.user_activity_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_conversations_school_id ON public.conversations(school_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_resources_school_id ON public.resources(school_id);
CREATE INDEX IF NOT EXISTS idx_resources_created_by ON public.resources(created_by);
CREATE INDEX IF NOT EXISTS idx_activities_school_id ON public.activities(school_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_by ON public.activities(created_by);

-- Single column indexes
CREATE INDEX IF NOT EXISTS idx_students_first_name ON public.students(first_name);
CREATE INDEX IF NOT EXISTS idx_students_last_name ON public.students(last_name);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_level ON public.activities(level);
CREATE INDEX IF NOT EXISTS idx_classes_level ON public.classes(level);
CREATE INDEX IF NOT EXISTS idx_classes_annee_scolaire ON public.classes(annee_scolaire);
CREATE INDEX IF NOT EXISTS idx_teaching_sessions_session_date ON public.teaching_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_activity_date ON public.user_activity_logs(activity_date);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_activity_type ON public.user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_schools_city ON public.schools(city);
CREATE INDEX IF NOT EXISTS idx_schools_region ON public.schools(region);
CREATE INDEX IF NOT EXISTS idx_schools_level ON public.schools(level);
CREATE INDEX IF NOT EXISTS idx_schools_status ON public.schools(status);
CREATE INDEX IF NOT EXISTS idx_resources_file_type ON public.resources(file_type);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_status ON public.diagnostic_sessions(status);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_teaching_sessions_teacher_class ON public.teaching_sessions(teacher_id, class_id);
CREATE INDEX IF NOT EXISTS idx_teaching_sessions_school_teacher ON public.teaching_sessions(school_id, teacher_id);
CREATE INDEX IF NOT EXISTS idx_teaching_sessions_school_date ON public.teaching_sessions(school_id, session_date);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_school_date ON public.user_activity_logs(school_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_date ON public.user_activity_logs(user_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_classes_school_level ON public.classes(school_id, level);
CREATE INDEX IF NOT EXISTS idx_classes_school_year ON public.classes(school_id, annee_scolaire);
CREATE INDEX IF NOT EXISTS idx_activities_school_type ON public.activities(school_id, type);
CREATE INDEX IF NOT EXISTS idx_activities_school_level ON public.activities(school_id, level);
CREATE INDEX IF NOT EXISTS idx_resources_school_type ON public.resources(school_id, file_type);
CREATE INDEX IF NOT EXISTS idx_students_school_class ON public.students(school_id, class_id);

-- Specialized GIN indexes
CREATE INDEX IF NOT EXISTS idx_messages_read_by ON public.messages(read_by);

-- Text search indexes
CREATE INDEX IF NOT EXISTS idx_students_first_name_lower ON public.students(LOWER(first_name));
CREATE INDEX IF NOT EXISTS idx_students_last_name_lower ON public.students(LOWER(last_name));

-- Index pour conversations
CREATE INDEX IF NOT EXISTS idx_conv_participant1 ON public.conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conv_participant2 ON public.conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_conv_school ON public.conversations(school_id);
CREATE INDEX IF NOT EXISTS idx_conv_last_message ON public.conversations(last_message_at DESC);

-- Index pour messages enrichis
CREATE INDEX IF NOT EXISTS idx_msg_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_msg_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_msg_recipient ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_msg_created ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_msg_school ON public.messages(school_id);

-- Index pour pièces jointes
CREATE INDEX IF NOT EXISTS idx_attachment_message ON public.message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_attachment_uploader ON public.message_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_attachment_scan_status ON public.message_attachments(scan_status);
CREATE INDEX IF NOT EXISTS idx_attachment_school ON public.message_attachments(school_id);

-- ============================================
-- 5. SEED DATA
-- ============================================

-- Insert demo schools
INSERT INTO public.schools (name, city, region, level, status, address, students, last_diagnostic) VALUES
  ('École Ibn Battuta', 'Oujda', 'Oriental', 'Primaire', 'Public', 'Quartier Al Qods, Oujda', 320, '2025-09-15'),
  ('Collège Al Andalous', 'Fès', 'Fès-Meknès', 'Collège', 'Public', 'Avenue Hassan II, Fès', 580, '2025-08-22'),
  ('Lycée Pasteur', 'Casablanca', 'Casablanca-Settat', 'Lycée', 'Privé', 'Boulevard Zerktouni, Casablanca', 450, '2025-10-01'),
  ('École Al Farabi', 'Rabat', 'Rabat-Salé-Kénitra', 'Primaire', 'Public', 'Hay Riad, Rabat', 280, '2025-09-28'),
  ('Collège Ibn Khaldoun', 'Marrakech', 'Marrakech-Safi', 'Collège', 'Public', 'Gueliz, Marrakech', 620, '2025-09-10'),
  ('Lycée Excellence', 'Tanger', 'Tanger-Tétouan-Al Hoceïma', 'Lycée', 'Privé', 'Avenue Mohammed VI, Tanger', 380, '2025-09-25')
ON CONFLICT DO NOTHING;

-- Create SUPERADMIN account (admin@admin.com / admin123)
INSERT INTO public.profiles (id, email, password_hash, full_name, school_id, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  'admin@admin.com',
  '$2b$12$/B/YKPYMs8en0f06AnSRzOgrJMTsNa5zl14S4.EdXEEPslM0Cgs1a',
  'Super Admin',
  1,
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
-- 6. TRIGGERS POUR MESSAGERIE
-- ============================================

-- Fonction pour mettre à jour last_message_at dans conversation
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations 
    SET last_message_at = NEW.created_at, updated_at = now()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour last_message_at
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON public.messages;
CREATE TRIGGER trigger_update_conversation_last_message
AFTER INSERT ON public.messages
FOR EACH ROW
WHEN (NEW.conversation_id IS NOT NULL)
EXECUTE FUNCTION update_conversation_last_message();

-- ============================================
-- 7. VUES POUR REPORTING MESSAGERIE
-- ============================================

-- Vue des conversations actives avec statistiques
CREATE OR REPLACE VIEW active_conversations_stats AS
SELECT 
    c.id AS conversation_id,
    c.school_id,
    c.participant1_id,
    c.participant2_id,
    c.created_at,
    c.last_message_at,
    COUNT(m.id) AS total_messages,
    COUNT(CASE WHEN m.is_read = false THEN 1 END) AS unread_messages,
    MAX(m.created_at) AS latest_message_at
FROM public.conversations c
LEFT JOIN public.messages m ON m.conversation_id = c.id AND m.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.school_id, c.participant1_id, c.participant2_id, c.created_at, c.last_message_at;

-- Vue des statistiques de fichiers par école
CREATE OR REPLACE VIEW attachment_stats_by_school AS
SELECT 
    school_id,
    COUNT(*) AS total_attachments,
    SUM(file_size) AS total_storage_bytes,
    ROUND(SUM(file_size)::NUMERIC / 1024 / 1024, 2) AS total_storage_mb,
    COUNT(CASE WHEN scan_status = 'CLEAN' THEN 1 END) AS clean_files,
    COUNT(CASE WHEN scan_status = 'PENDING' THEN 1 END) AS pending_scan,
    COUNT(CASE WHEN scan_status = 'INFECTED' THEN 1 END) AS infected_files
FROM public.message_attachments
WHERE deleted_at IS NULL
GROUP BY school_id;

-- ============================================
-- INITIALIZATION COMPLETE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database initialization complete!';
  RAISE NOTICE '📊 Schema version: 2.2 (Internal Messaging System)';
  RAISE NOTICE '🔐 SUPERADMIN: admin@admin.com / admin123';
  RAISE NOTICE '🏫 Demo schools: 6 schools loaded';
  RAISE NOTICE '👥 Roles: SUPERADMIN, ADMIN, TEACHER, STUDENT';
  RAISE NOTICE '💬 Messagerie: Conversations, Messages, Attachments';
  RAISE NOTICE '📈 Total indexes: 60+';
END $$;