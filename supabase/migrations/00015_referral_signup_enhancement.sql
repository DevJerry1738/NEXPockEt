-- Update the handle_new_user trigger function to generate referral code and support referred_by
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  v_referral_code VARCHAR(50);
  v_referred_by_id UUID;
BEGIN
  -- Generate a unique referral code (using substring of UUID + random suffix)
  v_referral_code := 'REF' || SUBSTRING(new.id::TEXT, 1, 8) || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  
  -- Try to get referred_by from raw_user_meta_data if available
  v_referred_by_id := NULL;
  IF new.raw_user_meta_data->>'referred_by' IS NOT NULL THEN
    BEGIN
      v_referred_by_id := (new.raw_user_meta_data->>'referred_by')::UUID;
    EXCEPTION WHEN OTHERS THEN
      v_referred_by_id := NULL;
    END;
  END IF;
  
  INSERT INTO public.profiles (id, name, email, referral_code, referred_by)
  VALUES (
      new.id, 
      COALESCE(new.raw_user_meta_data->>'name', new.email),
      new.email,
      v_referral_code,
      v_referred_by_id
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate and set referred_by from referral code during signup
CREATE OR REPLACE FUNCTION public.validate_referral_code(p_referral_code TEXT)
RETURNS UUID AS $$
DECLARE
  v_referrer_id UUID;
BEGIN
  IF p_referral_code IS NULL OR TRIM(p_referral_code) = '' THEN
    RETURN NULL;
  END IF;
  
  -- Use UPPER and TRIM for case-insensitive, whitespace-tolerant matching
  SELECT id INTO v_referrer_id 
  FROM profiles 
  WHERE UPPER(TRIM(referral_code)) = UPPER(TRIM(p_referral_code))
    AND referral_code IS NOT NULL
  LIMIT 1;
  
  RETURN v_referrer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
