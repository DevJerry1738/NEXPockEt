-- Migration 00010: Earning Cycles System
-- Creates the earning_cycles table for 21-day earning cycle tracking

CREATE TABLE IF NOT EXISTS public.earning_cycles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deposit_transaction_id bigint REFERENCES public.transactions(id),
  initial_balance decimal(10, 2) NOT NULL,
  current_balance decimal(10, 2) NOT NULL,
  start_date date,
  end_date date,
  last_task_completion_date date,
  days_completed integer DEFAULT 0,
  status text DEFAULT 'prepared' CHECK (status IN ('prepared', 'active', 'completed', 'paused')),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_earning_cycles_user_id ON public.earning_cycles(user_id);
CREATE INDEX idx_earning_cycles_status ON public.earning_cycles(status);
CREATE INDEX idx_earning_cycles_user_status ON public.earning_cycles(user_id, status) WHERE status = 'active';

-- Enable RLS
ALTER TABLE public.earning_cycles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own earning cycles" ON public.earning_cycles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own earning cycles" ON public.earning_cycles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all earning cycles" ON public.earning_cycles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
