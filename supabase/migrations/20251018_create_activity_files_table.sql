-- Create activity_files table for storing file metadata
-- Files themselves are stored in MinIO with 7-day TTL

CREATE TABLE IF NOT EXISTS activity_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    minio_key VARCHAR(255) NOT NULL UNIQUE,
    file_size BIGINT,
    mime_type VARCHAR(100),
    position INTEGER DEFAULT 0,
    element_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_activity_files_activity 
        FOREIGN KEY (activity_id) 
        REFERENCES activities(id) 
        ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_files_activity_id ON activity_files(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_files_minio_key ON activity_files(minio_key);
CREATE INDEX IF NOT EXISTS idx_activity_files_position ON activity_files(activity_id, position);

-- Add comments
COMMENT ON TABLE activity_files IS 'Stores metadata for files attached to activities. Actual files stored in MinIO.';
COMMENT ON COLUMN activity_files.minio_key IS 'Unique identifier for file in MinIO bucket (format: activity-files/{uuid})';
COMMENT ON COLUMN activity_files.file_type IS 'Type of file: pdf, image, video, text';
COMMENT ON COLUMN activity_files.position IS 'Display order within the activity';
COMMENT ON COLUMN activity_files.element_id IS 'Reference to element ID in activity layout_data JSON';
