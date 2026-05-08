-- Add RLS policy to allow anonymous users to lookup referral codes during signup
-- This allows unauthenticated users to query profiles.id where referral_code matches
-- NOTE: Comprehensive RLS policies are set in migration 00017

-- Recreate the validate_referral_code function with proper implementation
-- Using SECURITY DEFINER ensures it runs with postgres role privileges
-- which allows it to access profiles table regardless of RLS
CREATE OR REPLACE FUNCTION public.validate_referral_code(p_referral_code TEXT)
RETURNS UUID AS $$
DECLARE
  v_referrer_id UUID;
BEGIN
  -- Input validation
  IF p_referral_code IS NULL OR TRIM(p_referral_code) = '' THEN
    RETURN NULL;
  END IF;
  
  -- Query profiles table with case-insensitive matching
  -- SECURITY DEFINER with proper grants ensures RLS is not blocking this
  -- TRIM handles any whitespace in the input
  -- UPPER ensures case-insensitive matching
  SELECT id INTO v_referrer_id 
  FROM public.profiles 
  WHERE UPPER(TRIM(referral_code)) = UPPER(TRIM(p_referral_code))
    AND referral_code IS NOT NULL
  LIMIT 1;
  
  RETURN v_referrer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;
