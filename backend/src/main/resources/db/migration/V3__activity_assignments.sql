-- Add missing table required by ActivityAssignment entity
-- This is a forward-only migration to avoid changing already-applied V1.

CREATE TABLE IF NOT EXISTS public.activity_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  school_id BIGINT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITHOUT TIME ZONE,
  assigned_by TEXT,
  UNIQUE(activity_id, school_id)
);

CREATE INDEX IF NOT EXISTS idx_activity_assignments_school_id ON public.activity_assignments(school_id);
CREATE INDEX IF NOT EXISTS idx_activity_assignments_activity_id ON public.activity_assignments(activity_id);
