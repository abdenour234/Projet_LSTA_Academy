-- Align resources table with Resource JPA entity

ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS uploaded_by UUID;

-- Backfill from legacy columns when present
UPDATE public.resources
SET
  type = COALESCE(type, file_type),
  uploaded_by = COALESCE(uploaded_by, created_by)
WHERE type IS NULL OR uploaded_by IS NULL;

-- Keep legacy columns (file_type/created_by) for backwards compatibility.
