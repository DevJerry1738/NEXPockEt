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
    if (!user) {
      throw new Error('Not logged in')
    }

    let task_id
    try {
      const body = await req.json()
      task_id = body.task_id
    } catch (e) {
      throw new Error('Invalid request body: missing or malformed JSON')
    }

    if (!task_id) {
      throw new Error('Task ID is required')
    }

    // 1. Check for active earning cycle
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('active_earning_cycle_id, balance, total_earned')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) throw new Error('User not found')
    if (!userProfile.active_earning_cycle_id) {
      throw new Error('No active earning cycle. Please deposit and start an earning cycle first.')
    }

    // 2. Get active earning cycle details
    const { data: cycle, error: cycleError } = await supabaseAdmin
      .from('earning_cycles')
      .select('*')
      .eq('id', userProfile.active_earning_cycle_id)
      .single()

    if (cycleError || !cycle) throw new Error('Active earning cycle not found')
    if (cycle.status !== 'active') throw new Error('Earning cycle is not active')

    // ── LAZY COMPLETION ──────────────────────────────────────────────────────
    // If the cycle's end_date has passed, complete it now rather than
    // awarding more rewards beyond the 21-day window.
    const cycleEndDate = cycle.end_date ? new Date(cycle.end_date) : null;
    if (cycleEndDate && new Date() > cycleEndDate) {
      // Mark cycle completed
      await supabaseAdmin
        .from('earning_cycles')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', cycle.id);

      // Clear active cycle from profile — this unblocks withdrawals
      await supabaseAdmin
        .from('profiles')
        .update({ active_earning_cycle_id: null })
        .eq('id', user.id);

      return new Response(
        JSON.stringify({
          success: false,
          cycleCompleted: true,
          message: 'Your 21-day earning cycle has completed! Your funds are now available for withdrawal.',
          finalBalance: Number(cycle.current_balance),
          totalEarned: Number(cycle.current_balance) - Number(cycle.initial_balance),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }
    // ─────────────────────────────────────────────────────────────────────────

    // 3. Check if task already completed TODAY in this cycle
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const { data: completedTaskToday } = await supabaseAdmin
      .from('user_tasks')
      .select('id')
      .eq('user_id', user.id)
      .gte('completed_at', today.toISOString())
      .limit(1)

    // If already completed a task today, check if 5% was already applied
    let alreadyEarnedToday = false
    if (completedTaskToday && completedTaskToday.length > 0) {
      if (cycle.last_task_completion_date) {
        const lastCompleteDate = new Date(cycle.last_task_completion_date)
        if (lastCompleteDate.toDateString() === today.toDateString()) {
          alreadyEarnedToday = true
        }
      }
    }

    const taskReward = alreadyEarnedToday ? 0 : (Number(cycle.current_balance) * 0.05)
    const newCycleBalance = Number(cycle.current_balance) + taskReward

    // 4. Record task completion
    const { error: insertError } = await supabaseAdmin
      .from('user_tasks')
      .insert({ user_id: user.id, task_id })

    if (insertError) throw new Error('Failed to record task completion')

    // 5. Update Profile Balance if earning today
    if (taskReward > 0) {
      const newBalance = Number(userProfile.balance) + taskReward
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          balance: newBalance,
          total_earned: Number(userProfile.total_earned) + taskReward
        })
        .eq('id', user.id)

      if (updateError) throw new Error('Failed to update balance')

      // 6. Update earning cycle balance and last completion date
      const { error: cycleUpdateError } = await supabaseAdmin
        .from('earning_cycles')
        .update({
          current_balance: newCycleBalance,
          last_task_completion_date: today.toISOString().split('T')[0]
        })
        .eq('id', cycle.id)

      if (cycleUpdateError) throw new Error('Failed to update earning cycle')
    }


    return new Response(
      JSON.stringify({ 
        success: true, 
        message: alreadyEarnedToday 
          ? 'Task completed! You already earned 5% today. Return tomorrow for another 5%.'
          : 'Task completed successfully! You earned 5% of your wallet balance.',
        rewardAmount: taskReward,
        walletNewBalance: Number(userProfile.balance) + taskReward,
        cycleBalance: newCycleBalance,
        earnedToday: alreadyEarnedToday ? 'Yes' : 'No',
        cycleId: userProfile.active_earning_cycle_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    console.error('Error in complete-task function:', error.message, error.stack)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'Unknown error occurred',
        error: error.message || 'Unknown error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
