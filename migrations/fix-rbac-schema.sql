-- ============================================
-- RBAC FIX #1: Update app_role enum to support all roles
-- ============================================

-- Drop existing type and recreate with all roles
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'teacher', 'student');

-- ============================================
-- RBAC FIX #8: Add password_hash column to profiles
-- ============================================

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- ============================================
-- RBAC FIX #3: Add user_id to students table for authentication
-- ============================================

ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);

-- ============================================
-- RBAC FIX #11: Enforce single role per user
-- ============================================

-- Drop the existing unique constraint and add new one that prevents multiple roles
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- Add unique constraint on user_id only (one role per user)
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

-- ============================================
-- Migration Notes:
-- ============================================
-- 1. This will drop all existing user_roles data due to CASCADE
-- 2. You'll need to re-assign roles to users after running this
-- 3. Backup database before running
-- 4. Run this in a transaction for safety:
--    BEGIN;
--    <run migration>
--    COMMIT; (or ROLLBACK if issues)
