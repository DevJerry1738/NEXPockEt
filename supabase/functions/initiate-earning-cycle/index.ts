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

    // 1. Check for any active earning cycle
    const { data: activeC, error: activeError } = await supabaseAdmin
      .from('profiles')
      .select('active_earning_cycle_id')
      .eq('id', user.id)
      .single()

    if (activeError) throw new Error('Failed to check active cycle')
    if (activeC?.active_earning_cycle_id) {
      throw new Error('You already have an active earning cycle')
    }

    // 2. Get prepared earning cycle (not yet started)
    const { data: preparedCycle, error: prepError } = await supabaseAdmin
      .from('earning_cycles')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'prepared')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (prepError || !preparedCycle) {
      throw new Error('No prepared earning cycle found. Please make a deposit first.')
    }

    // 3. Activate the cycle
    const cycleStartDate = new Date()
    const cycleEndDate = new Date(cycleStartDate.getTime() + 21 * 24 * 60 * 60 * 1000)

    const { data: activatedCycle, error: updateError } = await supabaseAdmin
      .from('earning_cycles')
      .update({
        status: 'active',
        start_date: cycleStartDate.toISOString(),
        end_date: cycleEndDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', preparedCycle.id)
      .select()
      .single()

    if (updateError) throw new Error('Failed to activate earning cycle')

    // 4. Update user profile to set active cycle
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        active_earning_cycle_id: preparedCycle.id
      })
      .eq('id', user.id)

    if (profileError) throw new Error('Failed to set active earning cycle on profile')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Earning cycle activated successfully',
        cycle: {
          id: activatedCycle.id,
          startDate: cycleStartDate.toISOString(),
          endDate: cycleEndDate.toISOString(),
          initialBalance: activatedCycle.initial_balance,
          daysRemaining: 21
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    const isValidationError = error.message.includes('No prepared')
    const status = isValidationError ? 422 : 400
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
    )
  }
})
