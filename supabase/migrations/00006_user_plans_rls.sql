-- Add missing RLS policies for user_plans

-- Users can read their own plans
CREATE POLICY "Users can read own user_plans" ON public.user_plans 
FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own plans
CREATE POLICY "Users can insert own user_plans" ON public.user_plans 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own plans (e.g., to deactivate old plans)
CREATE POLICY "Users can update own user_plans" ON public.user_plans 
FOR UPDATE USING (auth.uid() = user_id);

-- Admins can manage all user_plans
CREATE POLICY "Admins can manage user_plans" ON public.user_plans 
FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
