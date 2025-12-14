-- Add missing column required by Hibernate schema validation
-- Aligns `teaching_sessions.subject` with `TeachingSession.subject` (VARCHAR)

ALTER TABLE IF EXISTS public.teaching_sessions
    ADD COLUMN IF NOT EXISTS subject VARCHAR(255);

-- Best-effort backfill from legacy free-text field if present
UPDATE public.teaching_sessions
SET subject = LEFT(remarks, 255)
WHERE subject IS NULL
  AND remarks IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_teaching_sessions_subject
    ON public.teaching_sessions(subject);
