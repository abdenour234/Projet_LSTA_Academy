-- Add missing column required by Hibernate schema validation
-- Aligns `teaching_sessions.notes` with `TeachingSession.notes` (TEXT)

ALTER TABLE IF EXISTS public.teaching_sessions
    ADD COLUMN IF NOT EXISTS notes TEXT;
