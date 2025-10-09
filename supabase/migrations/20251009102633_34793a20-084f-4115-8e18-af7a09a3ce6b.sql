-- Create schools table to store school information
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

-- Create profiles table for additional user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create enum for user roles (with check if not exists)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'teacher');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table with proper security
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create activities table
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Orale', 'Lecture', 'Écriture')),
  title TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on activities
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create diagnostics table
CREATE TABLE IF NOT EXISTS public.diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  subject TEXT NOT NULL,
  level TEXT NOT NULL,
  result INTEGER CHECK (result >= 0 AND result <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on diagnostics
ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for activities
CREATE POLICY "Users can view activities from their school"
  ON public.activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.school_id = activities.school_id
    )
  );

CREATE POLICY "Admins can insert activities"
  ON public.activities FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.school_id = activities.school_id
    )
  );

CREATE POLICY "Admins can update activities"
  ON public.activities FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin')
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.school_id = activities.school_id
    )
  );

CREATE POLICY "Admins can delete activities"
  ON public.activities FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin')
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.school_id = activities.school_id
    )
  );

-- RLS Policies for diagnostics
CREATE POLICY "Users can view diagnostics from their school"
  ON public.diagnostics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.school_id = diagnostics.school_id
    )
  );

CREATE POLICY "Teachers can insert diagnostics"
  ON public.diagnostics FOR INSERT
  WITH CHECK (
    auth.uid() = teacher_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.school_id = diagnostics.school_id
    )
  );

-- Create trigger for profile updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert schools data
INSERT INTO public.schools (id, name, city, region, level, status, address, students, last_diagnostic) VALUES
  ('1', 'École Ibn Battuta', 'Oujda', 'Oriental', 'Primaire', 'Public', 'Quartier Al Qods, Oujda', 320, '2025-09-15'),
  ('2', 'Collège Al Andalous', 'Fès', 'Fès-Meknès', 'Collège', 'Public', 'Avenue Hassan II, Fès', 580, '2025-08-22'),
  ('3', 'Lycée Pasteur', 'Casablanca', 'Casablanca-Settat', 'Lycée', 'Privé', 'Boulevard Zerktouni, Casablanca', 450, '2025-10-01'),
  ('4', 'École Al Farabi', 'Rabat', 'Rabat-Salé-Kénitra', 'Primaire', 'Public', 'Hay Riad, Rabat', 280, '2025-09-28'),
  ('5', 'Collège Ibn Khaldoun', 'Marrakech', 'Marrakech-Safi', 'Collège', 'Public', 'Gueliz, Marrakech', 620, '2025-09-10'),
  ('6', 'Lycée Excellence', 'Tanger', 'Tanger-Tétouan-Al Hoceïma', 'Lycée', 'Privé', 'Avenue Mohammed VI, Tanger', 380, '2025-09-25')
ON CONFLICT (id) DO NOTHING;