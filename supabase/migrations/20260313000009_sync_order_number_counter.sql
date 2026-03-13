-- Sync order_number_counters to be at least as high as the max existing order number.
-- Prevents duplicate key errors when the counter gets out of sync.

UPDATE order_number_counters
SET last_number = GREATEST(
  last_number,
  (SELECT COALESCE(MAX(NULLIF(regexp_replace(order_number, '[^0-9]', '', 'g'), '')::bigint), 0) FROM sales)
)
WHERE id = 1;
