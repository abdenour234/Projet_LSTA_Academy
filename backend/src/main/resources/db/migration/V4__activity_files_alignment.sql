-- Align activity_files table with the ActivityFile JPA entity

-- 1) Add missing columns
ALTER TABLE public.activity_files
  ADD COLUMN IF NOT EXISTS minio_key TEXT,
  ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS element_id VARCHAR(100);

-- 2) Widen file_size to BIGINT (entity uses Long)
ALTER TABLE public.activity_files
  ALTER COLUMN file_size TYPE BIGINT USING file_size::bigint;

-- 3) Backfill minio_key for existing rows (older schema used file_path to store the MinIO key)
UPDATE public.activity_files
SET minio_key = file_path
WHERE minio_key IS NULL;

-- 4) Enforce constraints expected by entity
ALTER TABLE public.activity_files
  ALTER COLUMN minio_key SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_activity_files_minio_key ON public.activity_files(minio_key);

-- 5) Helpful query index
CREATE INDEX IF NOT EXISTS idx_activity_files_activity_id ON public.activity_files(activity_id);
