-- Add missing column required by Hibernate schema validation
-- Aligns `teaching_sessions.activity_id` with `TeachingSession.activityId` (UUID)

ALTER TABLE IF EXISTS public.teaching_sessions
    ADD COLUMN IF NOT EXISTS activity_id UUID;

CREATE INDEX IF NOT EXISTS ix_teaching_sessions_activity_id
    ON public.teaching_sessions(activity_id);
