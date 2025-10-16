-- 1. Table des classes
CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id text NOT NULL,
  name text NOT NULL,
  level text NOT NULL,
  filiere text,
  annee_scolaire text NOT NULL,
  effectif integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- 2. Extension de la table teachers (utilisation de profiles existante)
-- Ajout de colonnes supplémentaires à profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS matiere text,
ADD COLUMN IF NOT EXISTS phone text;

-- 3. Table de liaison teacher-classes (many-to-many)
CREATE TABLE public.teacher_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(teacher_id, class_id)
);

ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;

-- 4. Table des séances d'enseignement
CREATE TABLE public.teaching_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  school_id text NOT NULL,
  session_date date NOT NULL,
  duration_minutes integer,
  activities_realized text[],
  percentage_acquired integer CHECK (percentage_acquired >= 0 AND percentage_acquired <= 100),
  remarks text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.teaching_sessions ENABLE ROW LEVEL SECURITY;

-- 5. Table de progression par compétence
CREATE TABLE public.session_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.teaching_sessions(id) ON DELETE CASCADE,
  competence text NOT NULL,
  acquired_count integer DEFAULT 0,
  not_acquired_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.session_progress ENABLE ROW LEVEL SECURITY;

-- 6. Table de suivi du temps d'utilisation
CREATE TABLE public.user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id text NOT NULL,
  activity_type text NOT NULL,
  duration_seconds integer DEFAULT 0,
  activity_date date NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- 7. Table des conversations
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id text NOT NULL,
  participant_ids uuid[] NOT NULL,
  subject text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- 8. Table des messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  read_by uuid[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour classes
CREATE POLICY "Users can view classes from their school"
ON public.classes FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid() AND school_id = classes.school_id
));

CREATE POLICY "Admins can insert classes"
ON public.classes FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND school_id = classes.school_id)
);

CREATE POLICY "Admins can update classes"
ON public.classes FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND school_id = classes.school_id)
);

CREATE POLICY "Admins can delete classes"
ON public.classes FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND school_id = classes.school_id)
);

-- RLS Policies pour teacher_classes
CREATE POLICY "Users can view teacher_classes from their school"
ON public.teacher_classes FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles p
  JOIN classes c ON c.id = teacher_classes.class_id
  WHERE p.id = auth.uid() AND p.school_id = c.school_id
));

CREATE POLICY "Admins can manage teacher_classes"
ON public.teacher_classes FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) AND
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN classes c ON c.id = teacher_classes.class_id
    WHERE p.id = auth.uid() AND p.school_id = c.school_id
  )
);

-- RLS Policies pour teaching_sessions
CREATE POLICY "Users can view sessions from their school"
ON public.teaching_sessions FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid() AND school_id = teaching_sessions.school_id
));

CREATE POLICY "Teachers can insert their sessions"
ON public.teaching_sessions FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = teacher_id AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND school_id = teaching_sessions.school_id)
);

CREATE POLICY "Teachers can update their sessions"
ON public.teaching_sessions FOR UPDATE
TO authenticated
USING (auth.uid() = teacher_id);

-- RLS Policies pour session_progress
CREATE POLICY "Users can view progress from their school"
ON public.session_progress FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM teaching_sessions ts
  JOIN profiles p ON p.id = auth.uid()
  WHERE ts.id = session_progress.session_id AND ts.school_id = p.school_id
));

CREATE POLICY "Teachers can manage their session progress"
ON public.session_progress FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM teaching_sessions
  WHERE id = session_progress.session_id AND teacher_id = auth.uid()
));

-- RLS Policies pour user_activity_logs
CREATE POLICY "Users can view their own activity"
ON public.user_activity_logs FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own activity"
ON public.user_activity_logs FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all activities from their school"
ON public.user_activity_logs FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND school_id = user_activity_logs.school_id)
);

-- RLS Policies pour conversations
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can create conversations in their school"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND school_id = conversations.school_id) AND
  auth.uid() = ANY(participant_ids)
);

-- RLS Policies pour messages
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM conversations
  WHERE id = messages.conversation_id AND auth.uid() = ANY(participant_ids)
));

CREATE POLICY "Users can send messages in their conversations"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM conversations
    WHERE id = messages.conversation_id AND auth.uid() = ANY(participant_ids)
  )
);

-- Trigger pour updated_at sur teaching_sessions
CREATE TRIGGER update_teaching_sessions_updated_at
BEFORE UPDATE ON public.teaching_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour updated_at sur classes
CREATE TRIGGER update_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour updated_at sur conversations
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();