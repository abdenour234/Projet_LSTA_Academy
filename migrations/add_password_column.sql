-- Add password_hash column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Optional: Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
