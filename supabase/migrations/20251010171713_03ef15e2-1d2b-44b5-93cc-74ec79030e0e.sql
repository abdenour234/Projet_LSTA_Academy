-- Remove the problematic trigger and function
DROP TRIGGER IF EXISTS on_school_created ON public.schools;
DROP FUNCTION IF EXISTS public.create_demo_users_for_school();

-- The school creation will now work without automatic user creation
-- Users can still be created manually via the existing SetupDemo component