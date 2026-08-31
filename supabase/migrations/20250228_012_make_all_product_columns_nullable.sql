-- Migration: Make all NOT NULL product columns nullable
-- Date: 2025-02-28
-- Reason: Allow flexible product creation with optional fields

-- Make unit_cost nullable
ALTER TABLE public.products 
ALTER COLUMN unit_cost DROP NOT NULL;
ALTER TABLE public.products 
ALTER COLUMN unit_cost SET DEFAULT NULL;

-- Make unit_price nullable (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'unit_price'
  ) THEN
    ALTER TABLE public.products ALTER COLUMN unit_price DROP NOT NULL;
    ALTER TABLE public.products ALTER COLUMN unit_price SET DEFAULT NULL;
  END IF;
END $$;

-- Make supplier_id nullable (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'supplier_id'
  ) THEN
    ALTER TABLE public.products ALTER COLUMN supplier_id DROP NOT NULL;
    ALTER TABLE public.products ALTER COLUMN supplier_id SET DEFAULT NULL;
  END IF;
END $$;