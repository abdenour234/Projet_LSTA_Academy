-- Align students.date_of_birth type with Student JPA entity (LocalDate)

-- V1 created date_of_birth as TIMESTAMP WITH TIME ZONE, but the entity maps it as DATE.
ALTER TABLE public.students
  ALTER COLUMN date_of_birth TYPE DATE
  USING date_of_birth::date;
