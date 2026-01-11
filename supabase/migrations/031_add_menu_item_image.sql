-- Add image_url to menu_items
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for menu images
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for menu-images bucket
-- 1. Public Select
DROP POLICY IF EXISTS "menu_images_select_policy" ON storage.objects;
CREATE POLICY "menu_images_select_policy"
ON storage.objects FOR SELECT
USING ( bucket_id = 'menu-images' );

-- 2. Authenticated Insert
DROP POLICY IF EXISTS "menu_images_insert_policy" ON storage.objects;
CREATE POLICY "menu_images_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'menu-images' );

-- 3. Authenticated Update
DROP POLICY IF EXISTS "menu_images_update_policy" ON storage.objects;
CREATE POLICY "menu_images_update_policy"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'menu-images' );

-- 4. Authenticated Delete
DROP POLICY IF EXISTS "menu_images_delete_policy" ON storage.objects;
CREATE POLICY "menu_images_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'menu-images' );
