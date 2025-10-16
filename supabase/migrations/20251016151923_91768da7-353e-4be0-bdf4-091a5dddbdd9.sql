-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new policy allowing users to see their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Create policy allowing admins to view all profiles from their school
CREATE POLICY "Admins can view all profiles from their school"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.school_id = profiles.school_id
  )
);