-- Migration: Add direction field to transactions table
-- Purpose: Track whether money is inbound or outbound

-- Add direction column if it doesn't exist
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS direction VARCHAR(10) DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound'));

-- Create index on direction for faster filtering
CREATE INDEX IF NOT EXISTS idx_transactions_direction ON public.transactions(direction);

-- Create index on recorded_by for faster employee queries
CREATE INDEX IF NOT EXISTS idx_transactions_recorded_by ON public.transactions(recorded_by);