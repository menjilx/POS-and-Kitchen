-- Add status column to ingredient_categories
ALTER TABLE ingredient_categories 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived'));

-- Update existing records to have 'active' status (not strictly needed due to DEFAULT, but good for clarity)
UPDATE ingredient_categories SET status = 'active' WHERE status IS NULL;
