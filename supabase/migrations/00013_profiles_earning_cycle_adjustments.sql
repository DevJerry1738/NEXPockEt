-- Migration 00013: Profiles Earning Cycle Adjustments
-- Add earning cycle linkage and connection count to profiles

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_earning_cycle_id uuid REFERENCES public.earning_cycles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS connection_count integer DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_active_earning_cycle_id ON public.profiles(active_earning_cycle_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);

-- Update modified_at trigger for profiles (if not exists)
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at_trigger ON public.profiles;

CREATE TRIGGER update_profiles_updated_at_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_profiles_updated_at();
