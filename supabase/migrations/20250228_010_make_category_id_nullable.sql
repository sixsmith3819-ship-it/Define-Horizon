-- Migration: Make category_id nullable in products table
-- Date: 2025-02-28
-- Reason: Allow products to use text category instead of category_id foreign key

-- Make category_id nullable
ALTER TABLE public.products 
ALTER COLUMN category_id DROP NOT NULL;

-- Set default to NULL
ALTER TABLE public.products 
ALTER COLUMN category_id SET DEFAULT NULL;