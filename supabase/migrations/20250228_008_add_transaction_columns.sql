-- Migration: Add missing columns to transactions table
-- Date: 2025-02-28

-- Add description column if it doesn't exist
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add reference column if it doesn't exist
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS reference VARCHAR(100);

-- Add branch_id column if it doesn't exist (for multi-branch support)
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON public.transactions(reference);
CREATE INDEX IF NOT EXISTS idx_transactions_branch_id ON public.transactions(branch_id);