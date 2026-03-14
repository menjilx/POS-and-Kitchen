-- Add app_subtitle setting row
INSERT INTO app_settings (id, key, value, value_type, description, category)
VALUES (
  gen_random_uuid(),
  'app_subtitle',
  'Kitchen System',
  'string',
  'Subtitle displayed below the app name in the sidebar',
  'general'
)
ON CONFLICT (key) DO NOTHING;
