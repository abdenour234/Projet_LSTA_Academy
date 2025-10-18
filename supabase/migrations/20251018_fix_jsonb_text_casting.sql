-- Fix: Change layout_data from JSONB to TEXT for Hibernate compatibility
-- Hibernate sends JSON as String, PostgreSQL JSONB requires explicit casting
-- Using TEXT allows seamless string storage while maintaining JSON validation

-- Convert JSONB column to TEXT
ALTER TABLE activities ALTER COLUMN layout_data TYPE TEXT;

-- Add CHECK constraint to ensure valid JSON format
ALTER TABLE activities ADD CONSTRAINT activities_layout_data_json_check 
    CHECK (layout_data::jsonb IS NOT NULL);

-- Add a comment
COMMENT ON COLUMN activities.layout_data IS 'JSON string (stored as TEXT) containing activity layout elements';
