-- Migration 00018: Fix referral_connections foreign keys for Supabase relations
-- Adds explicit foreign key from referred_user_id to profiles table
-- This allows the API to properly join and select profile data

-- Add foreign key constraint to profiles table
ALTER TABLE public.referral_connections
ADD CONSTRAINT fk_referral_connections_referred_user 
FOREIGN KEY (referred_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Also ensure referrer_id has proper FK to profiles
ALTER TABLE public.referral_connections
ADD CONSTRAINT fk_referral_connections_referrer_user 
FOREIGN KEY (referrer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
