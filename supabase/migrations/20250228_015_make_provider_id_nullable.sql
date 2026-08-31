-- Migration: Make provider_id nullable in transactions
-- Date: 2025-02-31

-- Make provider_id nullable (not all transactions need a provider)
ALTER TABLE public.transactions 
ALTER COLUMN provider_id DROP NOT NULL;

ALTER TABLE public.transactions 
ALTER COLUMN provider_id SET DEFAULT NULL;