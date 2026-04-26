// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Not logged in')

    const { task_id } = await req.json()
    if (!task_id) throw new Error('Task ID is required')

    // 1. Get user's active plan
    const { data: userPlan, error: planError } = await supabaseAdmin
      .from('user_plans')
      .select('id, plan_id, total_earned, plans(*)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (planError || !userPlan) throw new Error('No active plan found. Please purchase a plan first.')
    const plan = userPlan.plans;

    // 2. Check daily task count
    const startOfDay = new Date();
    startOfDay.setUTCHours(0,0,0,0);
    
    const { count: tasksDoneToday } = await supabaseAdmin
      .from('user_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('completed_at', startOfDay.toISOString())

    if (tasksDoneToday >= plan.daily_tasks) {
      throw new Error(`Daily limit reached. Your plan allows ${plan.daily_tasks} tasks per day.`)
    }

    // 3. Check if THIS specific task was already done today
    const { data: existingTask } = await supabaseAdmin
      .from('user_tasks')
      .select('id')
      .eq('user_id', user.id)
      .eq('task_id', task_id)
      .gte('completed_at', startOfDay.toISOString())
      .single()

    if (existingTask) throw new Error('You have already completed this task today.')

    // 4. Calculate Dynamic Reward
    // Reward = (Price * Daily ROI %) / Tasks Per Day
    const dailyPotential = (Number(plan.price) * Number(plan.daily_roi_pct)) / 100;
    const taskReward = dailyPotential / plan.daily_tasks;

    // 5. Record task completion
    const { error: insertError } = await supabaseAdmin
      .from('user_tasks')
      .insert({ user_id: user.id, task_id })

    if (insertError) throw new Error('Failed to record task completion')

    // 6. Update Profile Balance & Plan Progress
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('balance, total_earned')
      .eq('id', user.id)
      .single()

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        balance: Number(profile.balance) + taskReward,
        total_earned: Number(profile.total_earned) + taskReward 
      })
      .eq('id', user.id)

    if (updateError) throw new Error('Failed to update balance')

    await supabaseAdmin
      .from('user_plans')
      .update({ total_earned: Number(userPlan.total_earned) + taskReward })
      .eq('id', userPlan.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Task completed successfully', 
        reward: taskReward,
        progress: `${tasksDoneToday + 1}/${plan.daily_tasks}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
