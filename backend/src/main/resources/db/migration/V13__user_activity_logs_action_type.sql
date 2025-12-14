-- Align `user_activity_logs` table with JPA entity `UserActivityLog`
-- Hibernate validation reported missing column: action_type

ALTER TABLE IF EXISTS user_activity_logs
    ADD COLUMN IF NOT EXISTS action_type VARCHAR(255);
