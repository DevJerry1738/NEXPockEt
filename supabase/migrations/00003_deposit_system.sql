-- Deposit System Schema Upgrades
-- Run this in your Supabase SQL Editor

-- 1. Upgrade payment_methods table
ALTER TABLE public.payment_methods
  ALTER COLUMN details DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'both' CHECK (type IN ('deposit', 'withdrawal', 'both')),
  ADD COLUMN IF NOT EXISTS fields JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS min_amount NUMERIC(12,2) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_amount NUMERIC(12,2) DEFAULT 100000;

-- 2. Add rejection_reason to transactions
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. Storage RLS for payment-proofs bucket
-- First create the bucket in the Supabase Dashboard (Storage → New Bucket → name: payment-proofs, Private)
-- Then run these policies:

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Users can upload their own proof files
CREATE POLICY "Users can upload own proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can view their own proof files
CREATE POLICY "Users can view own proofs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can view all proof files
CREATE POLICY "Admins can view all proofs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-proofs' AND public.get_my_role() = 'admin');
