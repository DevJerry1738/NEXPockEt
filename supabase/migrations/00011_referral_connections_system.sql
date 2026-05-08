-- Migration 00011: Referral Connections System
-- Tracks referrer→referred user relationships and deposit verification

CREATE TABLE IF NOT EXISTS public.referral_connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_deposit_transaction_id bigint REFERENCES public.transactions(id),
  is_valid boolean DEFAULT false,
  connection_verified_at timestamp,
  created_at timestamp DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_referral_connections_referrer_id ON public.referral_connections(referrer_id);
CREATE INDEX idx_referral_connections_referred_user_id ON public.referral_connections(referred_user_id);
CREATE INDEX idx_referral_connections_referrer_valid ON public.referral_connections(referrer_id, is_valid);

-- Enable RLS
ALTER TABLE public.referral_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own referrals" ON public.referral_connections
  FOR SELECT USING (
    auth.uid() = referrer_id OR auth.uid() = referred_user_id
  );

CREATE POLICY "Admins can manage all referrals" ON public.referral_connections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
