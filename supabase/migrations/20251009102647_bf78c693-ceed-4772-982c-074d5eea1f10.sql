-- Enable RLS on schools table
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to view schools
CREATE POLICY "Everyone can view schools"
  ON public.schools FOR SELECT
  USING (true);

-- Create policy for user_roles table  
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);