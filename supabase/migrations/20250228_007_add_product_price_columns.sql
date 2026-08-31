-- Migration: Add missing price columns to products table
-- Date: 2025-02-28

-- Add buying_price column if it doesn't exist
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS buying_price DECIMAL(10, 2) DEFAULT 0.00 CHECK (buying_price >= 0);

-- Add selling_price column if it doesn't exist (might already exist)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10, 2) DEFAULT 0.00 CHECK (selling_price >= 0);

-- Add reorder_level column if it doesn't exist
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 5 CHECK (reorder_level >= 0);

-- Add description column if it doesn't exist
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing NULL values to 0
UPDATE public.products SET buying_price = 0.00 WHERE buying_price IS NULL;
UPDATE public.products SET selling_price = 0.00 WHERE selling_price IS NULL;
UPDATE public.products SET reorder_level = 5 WHERE reorder_level IS NULL;

-- Create index for price-based queries
CREATE INDEX IF NOT EXISTS idx_products_buying_price ON public.products(buying_price);
CREATE INDEX IF NOT EXISTS idx_products_selling_price ON public.products(selling_price);