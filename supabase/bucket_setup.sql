-- 1. Create the 'images' bucket (if it doesn't already exist) and make it public
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Grant public access to SELECT (view) images
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'images');

-- 3. Grant public access to INSERT (upload) images
CREATE POLICY "Public Insert" 
ON storage.objects FOR INSERT 
TO public 
WITH CHECK (bucket_id = 'images');

-- 4. Grant public access to UPDATE images
CREATE POLICY "Public Update" 
ON storage.objects FOR UPDATE 
TO public 
USING (bucket_id = 'images');

-- 5. Grant public access to DELETE images
CREATE POLICY "Public Delete" 
ON storage.objects FOR DELETE
TO public 
USING (bucket_id = 'images');
