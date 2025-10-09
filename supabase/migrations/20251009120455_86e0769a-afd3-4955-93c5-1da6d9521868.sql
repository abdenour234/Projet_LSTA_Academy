-- Create storage bucket for activity files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'activity-files',
  'activity-files',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
);

-- Storage policies for activity files
CREATE POLICY "Admins can upload activity files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'activity-files' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update activity files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'activity-files' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete activity files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'activity-files' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can view activity files from their school"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'activity-files' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
  )
);

-- Update activities table to store layout and content structure
ALTER TABLE activities ADD COLUMN IF NOT EXISTS layout_data JSONB DEFAULT '{"elements": []}'::jsonb;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- Add comment to describe the layout_data structure
COMMENT ON COLUMN activities.layout_data IS 'Stores the visual layout and content elements: {elements: [{id, type, content, position, style}]}';