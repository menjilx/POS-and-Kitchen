DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_adjustment_type') THEN
    CREATE TYPE stock_adjustment_type AS ENUM ('purchase', 'sale', 'waste', 'stocktake', 'adjustment');
  END IF;
END;
$$;
