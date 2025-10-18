-- Add superadmin and student roles to app_role enum
-- This migration extends the app_role type to support all user types in the system

DO $$ 
BEGIN
    -- Add 'superadmin' role if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'superadmin' 
        AND enumtypid = 'app_role'::regtype
    ) THEN
        ALTER TYPE app_role ADD VALUE 'superadmin';
    END IF;

    -- Add 'student' role if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'student' 
        AND enumtypid = 'app_role'::regtype
    ) THEN
        ALTER TYPE app_role ADD VALUE 'student';
    END IF;
END $$;
