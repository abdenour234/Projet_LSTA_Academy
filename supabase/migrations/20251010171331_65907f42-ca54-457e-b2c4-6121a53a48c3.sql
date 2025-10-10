-- Add storage policies for school-logos bucket to allow anyone to upload
CREATE POLICY "Anyone can upload school logos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'school-logos');

-- Allow anyone to update school logos
CREATE POLICY "Anyone can update school logos"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'school-logos');

-- Allow anyone to delete school logos
CREATE POLICY "Anyone can delete school logos"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'school-logos');