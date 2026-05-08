-- Create a secure RPC function to handle plan purchases
CREATE OR REPLACE FUNCTION public.purchase_plan(p_plan_id INTEGER)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_plan_price NUMERIC(12, 2);
    v_duration_days INTEGER;
    v_user_balance NUMERIC(12, 2);
    v_new_plan_id INTEGER;
BEGIN
    -- 1. Get current authenticated user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Get plan details
    SELECT price, duration_days INTO v_plan_price, v_duration_days
    FROM public.plans
    WHERE id = p_plan_id AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Plan not found or inactive';
    END IF;

    -- 3. Check user balance
    SELECT balance INTO v_user_balance
    FROM public.profiles
    WHERE id = v_user_id
    FOR UPDATE; -- Lock the row to prevent race conditions

    IF v_user_balance < v_plan_price THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- 4. Deduct balance
    UPDATE public.profiles
    SET balance = balance - v_plan_price
    WHERE id = v_user_id;

    -- 5. Record transaction
    INSERT INTO public.transactions (user_id, type, amount, status, details)
    VALUES (v_user_id, 'plan_purchase', v_plan_price, 'approved', 'Purchased plan ID ' || p_plan_id);

    -- 6. Deactivate old plans
    UPDATE public.user_plans
    SET is_active = false
    WHERE user_id = v_user_id AND is_active = true;

    -- 7. Insert new plan
    INSERT INTO public.user_plans (user_id, plan_id, expires_at, is_active)
    VALUES (
        v_user_id, 
        p_plan_id, 
        CURRENT_TIMESTAMP + (v_duration_days || ' days')::INTERVAL, 
        true
    ) RETURNING id INTO v_new_plan_id;

    RETURN jsonb_build_object('success', true, 'user_plan_id', v_new_plan_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
