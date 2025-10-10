-- Add INSERT policy for schools table (allow anyone to create schools for demo purposes)
CREATE POLICY "Anyone can insert schools"
ON public.schools
FOR INSERT
TO public
WITH CHECK (true);

-- Add UPDATE and DELETE policies for schools (allow anyone for demo purposes)
CREATE POLICY "Anyone can update schools"
ON public.schools
FOR UPDATE
TO public
USING (true);

CREATE POLICY "Anyone can delete schools"
ON public.schools
FOR DELETE
TO public
USING (true);

-- Create function to generate demo users for a school
CREATE OR REPLACE FUNCTION public.create_demo_users_for_school()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id uuid;
  teacher_user_id uuid;
BEGIN
  -- Create admin user
  admin_user_id := extensions.uuid_generate_v4();
  
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud
  ) VALUES (
    admin_user_id,
    '00000000-0000-0000-0000-000000000000',
    'admin@' || NEW.id || '.edu',
    crypt('admin123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', 'Administrateur', 'school_id', NEW.id, 'role', 'admin'),
    now(),
    now(),
    'authenticated',
    'authenticated'
  );

  -- Create teacher user
  teacher_user_id := extensions.uuid_generate_v4();
  
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud
  ) VALUES (
    teacher_user_id,
    '00000000-0000-0000-0000-000000000000',
    'teacher@' || NEW.id || '.edu',
    crypt('teacher123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', 'Enseignant', 'school_id', NEW.id, 'role', 'teacher'),
    now(),
    now(),
    'authenticated',
    'authenticated'
  );

  RETURN NEW;
END;
$$;

-- Create trigger to automatically create demo users when a school is created
DROP TRIGGER IF EXISTS on_school_created ON public.schools;
CREATE TRIGGER on_school_created
  AFTER INSERT ON public.schools
  FOR EACH ROW
  EXECUTE FUNCTION public.create_demo_users_for_school();