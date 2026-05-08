-- Migration 00014: Transactions Earning Cycle Link
-- Link transactions to earning cycles for audit trail

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS earning_cycle_id uuid REFERENCES public.earning_cycles(id) ON DELETE SET NULL;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_cycle_initiator boolean DEFAULT false;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transactions_earning_cycle_id ON public.transactions(earning_cycle_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type_initiator ON public.transactions(user_id, type, is_cycle_initiator);
