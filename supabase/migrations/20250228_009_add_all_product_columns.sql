-- Migration: Add all required columns to products table
-- Date: 2025-02-28

-- Add category column
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Add name column
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS name VARCHAR(255) NOT NULL DEFAULT 'Unnamed Product';

-- Add sku column
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sku VARCHAR(100) UNIQUE;

-- Add quantity column
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0 CHECK (quantity >= 0);

-- Add status column
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);