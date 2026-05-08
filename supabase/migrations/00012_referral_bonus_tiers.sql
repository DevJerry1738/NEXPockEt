-- Migration 00012: Referral Bonus Tiers
-- Admin-configurable bonus structure based on referral connection count

CREATE TABLE IF NOT EXISTS public.referral_bonus_tiers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  min_connections integer NOT NULL,
  max_connections integer,
  bonus_amount decimal(10, 2) NOT NULL,
  bonus_type text DEFAULT 'fixed' CHECK (bonus_type IN ('fixed', 'percentage')),
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_referral_bonus_tiers_min_connections ON public.referral_bonus_tiers(min_connections);
CREATE INDEX idx_referral_bonus_tiers_active ON public.referral_bonus_tiers(is_active);

-- Enable RLS
ALTER TABLE public.referral_bonus_tiers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can read active bonus tiers" ON public.referral_bonus_tiers
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can read all bonus tiers" ON public.referral_bonus_tiers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage bonus tiers" ON public.referral_bonus_tiers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Insert default bonus tiers
INSERT INTO public.referral_bonus_tiers (min_connections, max_connections, bonus_amount, bonus_type, is_active)
VALUES 
  (5, 9, 0, 'fixed', true),
  (10, 14, 50, 'fixed', true),
  (15, NULL, 100, 'fixed', true);
