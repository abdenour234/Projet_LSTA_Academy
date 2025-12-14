-- Align classes table with the Classe JPA entity (student_count)

ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS student_count INTEGER;

-- Backfill for existing rows (use legacy effectif when present)
UPDATE public.classes
SET student_count = COALESCE(student_count, effectif, 0)
WHERE student_count IS NULL;

-- Default for new rows
ALTER TABLE public.classes
  ALTER COLUMN student_count SET DEFAULT 0;
