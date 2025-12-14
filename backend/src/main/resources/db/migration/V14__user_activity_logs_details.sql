-- Align `user_activity_logs` table with JPA entity `UserActivityLog`
-- Hibernate validation reported missing column: details

ALTER TABLE IF EXISTS user_activity_logs
    ADD COLUMN IF NOT EXISTS details TEXT;
