-- Add item_type column to menu_items table
ALTER TABLE menu_items ADD COLUMN item_type TEXT DEFAULT 'standard';

-- Ensure existing items are standard
UPDATE menu_items SET item_type = 'standard' WHERE item_type IS NULL;

-- Add check constraint
ALTER TABLE menu_items ADD CONSTRAINT check_item_type CHECK (item_type IN ('standard', 'simple'));
