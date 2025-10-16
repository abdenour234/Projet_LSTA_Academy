-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles from their school" ON public.profiles;

-- Create a security definer function to get user's school_id without RLS
CREATE OR REPLACE FUNCTION public.get_user_school_id(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.profiles WHERE id = _user_id
$$;

-- Create the correct admin policy using the security definer function
CREATE POLICY "Admins can view all profiles from their school"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) AND
  school_id = get_user_school_id(auth.uid())
);