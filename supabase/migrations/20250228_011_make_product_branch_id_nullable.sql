-- Migration: Make branch_id nullable in products table
-- Date: 2025-02-28

-- Make branch_id nullable
ALTER TABLE public.products 
ALTER COLUMN branch_id DROP NOT NULL;

-- Set default to NULL
ALTER TABLE public.products 
ALTER COLUMN branch_id SET DEFAULT NULL;