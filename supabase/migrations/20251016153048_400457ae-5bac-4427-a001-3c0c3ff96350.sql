-- Allow admins to view user roles from their school
CREATE POLICY "Admins can view roles from their school"
ON public.user_roles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.profiles p1
    JOIN public.profiles p2 ON p2.id = user_roles.user_id
    WHERE p1.id = auth.uid() 
    AND p1.school_id = p2.school_id
  )
);