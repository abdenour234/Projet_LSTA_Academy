-- Simple initialization script for PostgreSQL database
-- Creates app_role enum type needed by JPA entities

DO $$ 
BEGIN
    -- Create app_role enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('admin', 'teacher', 'superadmin', 'student');
    END IF;
END $$;
