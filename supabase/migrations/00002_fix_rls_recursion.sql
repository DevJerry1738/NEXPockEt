-- Fix for infinite recursion in RLS policies
-- Run this in your Supabase SQL Editor

-- 1. Create a SECURITY DEFINER function to safely check the current user's role
-- This function bypasses RLS, preventing infinite recursion
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 2. Drop all recursive admin policies on profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- 3. Recreate them using the safe function
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.get_my_role() = 'admin');

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.get_my_role() = 'admin');

-- 4. Fix all other tables
DROP POLICY IF EXISTS "Admins can manage tasks" ON public.tasks;
CREATE POLICY "Admins can manage tasks" ON public.tasks FOR ALL
  USING (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Admins can manage plans" ON public.plans;
CREATE POLICY "Admins can manage plans" ON public.plans FOR ALL
  USING (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Admins can manage transactions" ON public.transactions;
CREATE POLICY "Admins can manage transactions" ON public.transactions FOR ALL
  USING (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Admins can manage kyc" ON public.kyc_documents;
CREATE POLICY "Admins can manage kyc" ON public.kyc_documents FOR ALL
  USING (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Admins can manage payment methods" ON public.payment_methods;
CREATE POLICY "Admins can manage payment methods" ON public.payment_methods FOR ALL
  USING (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL
  USING (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Admins can manage settings" ON public.system_settings;
CREATE POLICY "Admins can manage settings" ON public.system_settings FOR ALL
  USING (public.get_my_role() = 'admin');
