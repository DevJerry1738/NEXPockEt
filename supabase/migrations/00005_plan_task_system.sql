-- 1. Update Plans Table
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS daily_roi_pct NUMERIC(5,2) DEFAULT 0.50,
  ADD COLUMN IF NOT EXISTS total_roi_pct NUMERIC(10,2) DEFAULT 115.00,
  ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 30,
  DROP COLUMN IF EXISTS earning_rate;

-- 2. Update User Plans Table
ALTER TABLE public.user_plans
  ADD COLUMN IF NOT EXISTS total_earned NUMERIC(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled'));

-- 3. Seed Initial Tiered Plans
TRUNCATE public.plans CASCADE;
INSERT INTO public.plans (name, price, daily_tasks, daily_roi_pct, total_roi_pct, duration_days, description) VALUES
  ('Starter', 100.00, 1, 0.50, 115.00, 30, 'Perfect for beginners. Earn 0.5% daily with 1 simple task.'),
  ('Basic', 500.00, 2, 0.60, 118.00, 30, 'Scale your earnings. 2 tasks per day at 0.6% ROI.'),
  ('Premium', 1000.00, 5, 0.80, 124.00, 30, 'Professional tier. 5 tasks per day at 0.8% ROI.'),
  ('Elite', 5000.00, 10, 1.00, 130.00, 30, 'Maximum returns. 10 tasks per day at 1.0% ROI.');

-- 4. Create function to check daily task completion
CREATE OR REPLACE FUNCTION public.get_daily_tasks_completed(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM public.user_tasks 
    WHERE user_id = p_user_id 
    AND completed_at >= CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
