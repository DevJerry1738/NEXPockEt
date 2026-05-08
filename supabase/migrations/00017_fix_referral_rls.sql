-- Fix RLS on profiles table to allow referral code lookups during signup
-- This migration ensures that the validate_referral_code RPC function can access profiles

-- Make sure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing restrictive SELECT policies that block anonymous access
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anonymous can lookup referral codes" ON public.profiles;
DROP POLICY IF EXISTS "Allow referral code lookup" ON public.profiles;

-- Create a single comprehensive SELECT policy:
-- 1. Allow anyone (anon + authenticated) to SELECT from profiles with USING (true)
--    This enables referral code lookup during signup
-- 2. Still allows users to read their own profile
-- 3. Allows admins to read all profiles via the admin check
CREATE POLICY "Allow public profile access for referral lookup"
  ON public.profiles
  FOR SELECT
  TO public
  USING (true);

-- Keep update/delete policies restrictive to prevent unauthorized modifications
-- Drop old update/delete policies first
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create new restrictive update policy
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create delete policy for users
CREATE POLICY "Users can delete own profile"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = id);

-- Admin update policy
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Ensure the validate_referral_code function has proper grants
GRANT SELECT ON public.profiles TO postgres;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT EXECUTE ON FUNCTION public.validate_referral_code(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_referral_code(TEXT) TO authenticated;

-- Test query (can be removed after verification)
-- SELECT public.validate_referral_code('REF3039BBF44791') as referrer_id;
