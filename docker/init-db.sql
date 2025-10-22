--
-- PostgreSQL database initialization script
-- Generated from production database: October 21, 2025 (updated with class_id in activities and user_id in students)
-- This script creates the complete database schema with all tables and initial data
--

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE schoolmanagement'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'schoolmanagement')\gexec

-- Connect to the database
\c schoolmanagement

-- Set configuration
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Drop existing objects (for clean reinstall)
--

DROP TABLE IF EXISTS public.activity_assignments CASCADE;
DROP TABLE IF EXISTS public.activity_files CASCADE;
DROP TABLE IF EXISTS public.teaching_sessions CASCADE;
DROP TABLE IF EXISTS public.diagnostic_sessions CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.resources CASCADE;
DROP TABLE IF EXISTS public.user_activity_logs CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.activities CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.schools CASCADE;
DROP SEQUENCE IF EXISTS public.schools_id_seq CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

--
-- Create custom types
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'teacher',
    'superadmin',
    'student'
);

ALTER TYPE public.app_role OWNER TO postgres;

--
-- Create tables
--

-- Schools table (unchanged)
CREATE TABLE public.schools (
    id bigint NOT NULL,
    address character varying(255) NOT NULL,
    city character varying(255) NOT NULL,
    created_at timestamp(6) without time zone,
    last_diagnostic timestamp(6) without time zone,
    level character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    region character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    students integer NOT NULL
);

ALTER TABLE public.schools OWNER TO postgres;

CREATE SEQUENCE public.schools_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.schools_id_seq OWNER TO postgres;
ALTER SEQUENCE public.schools_id_seq OWNED BY public.schools.id;
ALTER TABLE ONLY public.schools ALTER COLUMN id SET DEFAULT nextval('public.schools_id_seq'::regclass);

-- Profiles table (unchanged)
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    email character varying(255) NOT NULL,
    full_name character varying(255),
    password_hash character varying(255),
    school_id character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone
);

ALTER TABLE public.profiles OWNER TO postgres;

-- User roles table (unchanged)
CREATE TABLE public.user_roles (
    id uuid NOT NULL,
    role character varying(255) NOT NULL,
    user_id uuid NOT NULL,
    CONSTRAINT user_roles_role_check CHECK (((role)::text = ANY ((ARRAY['superadmin'::character varying, 'admin'::character varying, 'teacher'::character varying, 'student'::character varying])::text[])))
);

ALTER TABLE public.user_roles OWNER TO postgres;

-- Activities table (MODIFIED: Added class_id)
CREATE TABLE public.activities (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    created_by uuid,
    description text,
    is_published boolean,
    layout_data text,
    level character varying(255) NOT NULL,
    school_id character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone,
    class_id uuid,  -- NEW: Link to class (nullable if activity is school-wide)
    CONSTRAINT activities_layout_data_json_check CHECK (((layout_data)::jsonb IS NOT NULL))
);

ALTER TABLE public.activities OWNER TO postgres;
COMMENT ON COLUMN public.activities.layout_data IS 'JSON string (stored as TEXT) containing activity layout elements';

-- Activity files table (unchanged)
CREATE TABLE public.activity_files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    activity_id uuid NOT NULL,
    file_type character varying(20) NOT NULL,
    file_name character varying(255) NOT NULL,
    minio_key character varying(255) NOT NULL,
    file_size bigint,
    mime_type character varying(100),
    "position" integer DEFAULT 0,
    element_id character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.activity_files OWNER TO postgres;
COMMENT ON TABLE public.activity_files IS 'Stores metadata for files attached to activities. Actual files stored in MinIO.';
COMMENT ON COLUMN public.activity_files.file_type IS 'Type of file: pdf, image, video, text';
COMMENT ON COLUMN public.activity_files.minio_key IS 'Unique identifier for file in MinIO bucket (format: activity-files/{uuid})';
COMMENT ON COLUMN public.activity_files."position" IS 'Display order within the activity';
COMMENT ON COLUMN public.activity_files.element_id IS 'Reference to element ID in activity layout_data JSON';

-- Activity assignments table (unchanged)
CREATE TABLE public.activity_assignments (
    id uuid NOT NULL,
    assigned_at timestamp(6) without time zone,
    assigned_by character varying(255),
    activity_id uuid NOT NULL,
    school_id bigint NOT NULL
);

ALTER TABLE public.activity_assignments OWNER TO postgres;

-- Classes table (unchanged)
CREATE TABLE public.classes (
    id uuid NOT NULL,
    academic_year character varying(255),
    created_at timestamp(6) without time zone,
    level character varying(255),
    name character varying(255) NOT NULL,
    school_id character varying(255) NOT NULL,
    student_count integer,
    updated_at timestamp(6) without time zone
);

ALTER TABLE public.classes OWNER TO postgres;

-- Students table (MODIFIED: Added user_id to link to profiles)
CREATE TABLE public.students (
    id uuid NOT NULL,
    class_id uuid,
    created_at timestamp(6) without time zone,
    date_of_birth timestamp(6) without time zone,
    first_name character varying(255) NOT NULL,
    gender character varying(255),
    last_name character varying(255) NOT NULL,
    parent_contact character varying(255),
    school_id character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone,
    user_id uuid  -- NEW: Link to profiles.id (user profile)
);

ALTER TABLE public.students OWNER TO postgres;

-- Diagnostic sessions table (unchanged)
CREATE TABLE public.diagnostic_sessions (
    id uuid NOT NULL,
    class_id uuid,
    created_at timestamp(6) without time zone,
    grid_type character varying(255),
    level character varying(255) NOT NULL,
    results jsonb,
    school_id character varying(255) NOT NULL,
    session_date timestamp(6) without time zone,
    subject character varying(255) NOT NULL,
    teacher_id uuid NOT NULL,
    updated_at timestamp(6) without time zone
);

ALTER TABLE public.diagnostic_sessions OWNER TO postgres;

-- Teaching sessions table (unchanged)
CREATE TABLE public.teaching_sessions (
    id uuid NOT NULL,
    activity_id uuid,
    class_id uuid,
    created_at timestamp(6) without time zone,
    notes text,
    percentage_acquired integer,
    school_id character varying(255) NOT NULL,
    session_date date,
    subject character varying(255),
    teacher_id uuid NOT NULL,
    updated_at timestamp(6) without time zone
);

ALTER TABLE public.teaching_sessions OWNER TO postgres;

-- Messages table (unchanged)
CREATE TABLE public.messages (
    id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp(6) without time zone,
    is_read boolean,
    recipient_id uuid NOT NULL,
    school_id character varying(255) NOT NULL,
    sender_id uuid NOT NULL,
    subject character varying(255) NOT NULL
);

ALTER TABLE public.messages OWNER TO postgres;

-- Resources table (unchanged)
CREATE TABLE public.resources (
    id uuid NOT NULL,
    category character varying(255),
    created_at timestamp(6) without time zone,
    description text,
    file_name character varying(255),
    file_size bigint,
    file_url character varying(255),
    school_id character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    uploaded_by uuid
);

ALTER TABLE public.resources OWNER TO postgres;

-- User activity logs table (unchanged)
CREATE TABLE public.user_activity_logs (
    id uuid NOT NULL,
    action_type character varying(255),
    activity_date date NOT NULL,
    details text,
    school_id character varying(255) NOT NULL,
    user_id uuid NOT NULL
);

ALTER TABLE public.user_activity_logs OWNER TO postgres;

--
-- Insert initial data (unchanged, but add user_id to students if needed for existing data)
--

-- Schools (unchanged)
INSERT INTO public.schools (id, address, city, created_at, last_diagnostic, level, name, region, status, students) VALUES
(1, 'Avenue Mohammed V', 'Oujda', '2025-10-18 12:43:48.104076', NULL, 'Primaire', 'Pasteur', 'L''Oriental', 'Active', 0),
(2, '', 'Oujda', '2025-10-18 12:53:05.596974', NULL, 'Primaire', 'Orient', 'L''Oriental', 'Privé', 2500),
(3, '', 'Jerada', '2025-10-18 14:10:00.441774', NULL, 'Primaire', 'Kali Orient', 'L''Oriental', 'Privé', 1600);

-- Set sequence for schools
SELECT pg_catalog.setval('public.schools_id_seq', 3, true);

-- Profiles (unchanged)
INSERT INTO public.profiles (id, created_at, email, full_name, password_hash, school_id, updated_at) VALUES
('5054ed0f-3f4b-4e2d-b009-43e8d0e08f22', '2025-10-18 12:43:48.339806', 'admin@admin.com', 'Super Admin', '$2a$10$mAOHPc29emF0i/6ZPS3o8eWSEwNnepE8Dc52qlfl5/4yOsLgh2wDa', '1', '2025-10-18 12:43:48.339826'),
('61b017bd-17d5-4274-93bb-648d8a6d3a89', '2025-10-18 12:53:05.654434', 'ahmed@pasteur.ma', 'Ahmed Bannani', '$2a$10$cYMq1x2AVNrf4cA9nNCHieURGDPEPEW3GHdY8n8ZfMVkbnliDlYkbSl6', '2', '2025-10-18 12:53:05.654453'),
('56c5ddac-561d-4178-9ba3-763e3f07a837', '2025-10-18 14:10:00.54315', 'ahmed@kali.ma', 'Ahmed Bannani', '$2a$10$MNJTusPNE9hbVIeL7d35OuoBUJLwEl25GVyTjt5NhnG4ZRRxFMVba', '3', '2025-10-18 14:10:00.543171'),
('7baf1f9e-d8c8-4835-b2f5-adac9d182279', '2025-10-19 14:52:01.737434', 'chenouf.abdenour@3.ma', 'Chenouf Abdenour', '$2a$10$CKrn/p70nNDp4B7IB2IqkeQAEkaGIR1l/r03n8OWgWRcM8jCYl9Xe', '3', '2025-10-19 14:52:01.737439'),
('a303af5c-e60d-41fb-b95d-d099d3636dd1', '2025-10-20 20:04:09.417801', 'test@3.ma', 'Test', '$2a$10$1h4vYoTMR9RTYGnMMt/e7.cFKPEPEW3GHdY8n8ZfMVkbnliDlYkbSl6', '3', '2025-10-20 20:04:09.417808');

-- User roles (unchanged)
INSERT INTO public.user_roles (id, role, user_id) VALUES
('9fd33843-27b7-45e6-899b-6c820afe4efd', 'superadmin', '5054ed0f-3f4b-4e2d-b009-43e8d0e08f22'),
('77d649ed-edbf-4c7d-886c-d6451fb212a4', 'admin', '61b017bd-17d5-4274-93bb-648d8a6d3a89'),
('d0068f52-6c97-465d-8bf4-ec1f6fb4092f', 'admin', '56c5ddac-561d-4178-9ba3-763e3f07a837'),
('8f8fed79-dfc7-4d54-a646-0cfdcf876155', 'teacher', '7baf1f9e-d8c8-4835-b2f5-adac9d182279'),
('4087e50b-e551-404a-9027-287a74d7b4f3', 'teacher', 'a303af5c-e60d-41fb-b95d-d099d3636dd1');

--
-- Migration: Add new columns if database already exists
--

-- Add class_id to activities if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'class_id') THEN
    ALTER TABLE public.activities ADD COLUMN class_id uuid;
  END IF;
END$$;

-- Add user_id to students if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'user_id') THEN
    ALTER TABLE public.students ADD COLUMN user_id uuid;
  END IF;
END$$;

--
-- Add primary keys (unchanged)
--

ALTER TABLE ONLY public.schools ADD CONSTRAINT schools_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.activities ADD CONSTRAINT activities_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.activity_files ADD CONSTRAINT activity_files_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.activity_files ADD CONSTRAINT activity_files_minio_key_key UNIQUE (minio_key);
ALTER TABLE ONLY public.activity_assignments ADD CONSTRAINT activity_assignments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.classes ADD CONSTRAINT classes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.students ADD CONSTRAINT students_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.diagnostic_sessions ADD CONSTRAINT diagnostic_sessions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.teaching_sessions ADD CONSTRAINT teaching_sessions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.messages ADD CONSTRAINT messages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.resources ADD CONSTRAINT resources_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_activity_logs ADD CONSTRAINT user_activity_logs_pkey PRIMARY KEY (id);

--
-- Add unique constraint for students table
--

ALTER TABLE public.students
    ADD CONSTRAINT unique_user_id UNIQUE (user_id);  -- Moved here after table creation

--
-- Create indexes (updated with new columns)
--

CREATE INDEX idx_activity_files_activity_id ON public.activity_files USING btree (activity_id);
CREATE INDEX idx_activity_files_minio_key ON public.activity_files USING btree (minio_key);
CREATE INDEX idx_activity_files_position ON public.activity_files USING btree (activity_id, "position");
CREATE INDEX idx_activities_school_class ON public.activities USING btree (school_id, class_id);  -- NEW: For fast filtering by school and class
CREATE INDEX idx_students_user_id ON public.students USING btree (user_id);  -- NEW: For fast lookup by user_id

--
-- Add foreign key constraints (updated with new columns)
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT fk_activities_class FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;  -- NEW: Link activities to classes (SET NULL if class deleted)

ALTER TABLE ONLY public.students
    ADD CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;  -- NEW: Link students to profiles

ALTER TABLE ONLY public.activity_files
    ADD CONSTRAINT fk_activity_files_activity FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.activity_assignments
    ADD CONSTRAINT fkhicv6b9d9e6jhhcyhrkw8ln12 FOREIGN KEY (school_id) REFERENCES public.schools(id);

ALTER TABLE ONLY public.activity_assignments
    ADD CONSTRAINT fkm2oori63bygtylk54868jrih FOREIGN KEY (activity_id) REFERENCES public.activities(id);

--
-- Grant permissions (unchanged)
--

GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;

--
-- Initialization complete
--

\echo 'Database initialization completed successfully!'
\echo 'Super Admin credentials: admin@admin.com / admin123'
\echo 'Database schema and sample data loaded.'