-- Migration: Add unit_price and unit_cost columns to products
-- Date: 2025-02-28

-- Add unit_price column (for selling price)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10, 2);

-- Add unit_cost column (for buying price) if not exists
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(10, 2);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_unit_price ON public.products(unit_price);
CREATE INDEX IF NOT EXISTS idx_products_unit_cost ON public.products(unit_cost);