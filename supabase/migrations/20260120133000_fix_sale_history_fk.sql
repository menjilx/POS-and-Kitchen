ALTER TABLE sale_history DROP CONSTRAINT IF EXISTS sale_history_sale_id_fkey;

ALTER TABLE sale_history
  ALTER COLUMN sale_id DROP NOT NULL;

ALTER TABLE sale_history
  ADD CONSTRAINT sale_history_sale_id_fkey
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL;
