-- Align students table with Student JPA entity (parent_contact)

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS parent_contact TEXT;

-- Backfill from legacy column if present (older schema used phone)
UPDATE public.students
SET parent_contact = COALESCE(parent_contact, phone)
WHERE parent_contact IS NULL;
