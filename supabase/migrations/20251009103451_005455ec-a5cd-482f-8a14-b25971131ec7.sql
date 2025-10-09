-- Insert missing profiles manually with correct school_id mapping
INSERT INTO public.profiles (id, email, full_name, school_id)
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name',
  CASE 
    WHEN u.email LIKE '%ibnbattuta%' THEN '1'
    WHEN u.email LIKE '%alandalous%' THEN '2'
    WHEN u.email LIKE '%pasteur%' THEN '3'
    WHEN u.email LIKE '%alfarabi%' THEN '4'
    WHEN u.email LIKE '%ibnkhaldoun%' THEN '5'
    WHEN u.email LIKE '%excellence%' THEN '6'
  END as school_id
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Insert missing user roles with correct role mapping
INSERT INTO public.user_roles (user_id, role)
SELECT 
  u.id,
  CASE 
    WHEN u.email LIKE 'admin%' THEN 'admin'::app_role
    WHEN u.email LIKE 'prof%' THEN 'teacher'::app_role
  END as role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;