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

    // Admin client for overriding RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify caller is Admin
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Not logged in')

    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminProfile?.role !== 'admin') {
       throw new Error('Unauthorized')
    }

    const { transaction_id, status, rejection_reason } = await req.json()
    if (!transaction_id || !status) throw new Error('Missing parameters')
    if (!['approved', 'rejected'].includes(status)) throw new Error('Invalid status')

    // 1. Get Transaction
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', transaction_id)
      .single()

    if (txError || !transaction) throw new Error('Transaction not found')
    if (transaction.status !== 'pending') throw new Error('Transaction already processed')

    // 2. Get User Profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('balance, total_withdrawn, referred_by')
      .eq('id', transaction.user_id)
      .single()

    if (!profile) throw new Error('User not found')

    let newBalance = Number(profile.balance)
    let newTotalWithdrawn = Number(profile.total_withdrawn)

    // 3. Process Balance Changes if Approved
    let earningCycleId = null;
    let referrerConnectionsUpdate = null;
    
    if (status === 'approved') {
      if (transaction.type === 'deposit') {
        // Validate minimum deposit amount
        if (Number(transaction.amount) < 50) {
          throw new Error('Minimum deposit amount is $50')
        }
        
        newBalance += Number(transaction.amount)
        
        // Create earning_cycle for deposit
        const cycleStartDate = new Date();
        const cycleEndDate = new Date(cycleStartDate.getTime() + 21 * 24 * 60 * 60 * 1000);
        
        const { data: newCycle, error: cycleError } = await supabaseAdmin
          .from('earning_cycles')
          .insert({
            user_id: transaction.user_id,
            deposit_transaction_id: transaction_id,
            initial_balance: Number(transaction.amount),
            current_balance: Number(transaction.amount),
            start_date: null, // Will be set when user initiates cycle
            end_date: null,
            status: 'prepared'
          })
          .select()
          .single()
        
        if (cycleError) {
          console.error('Failed to create earning cycle:', cycleError)
          throw new Error('Failed to create earning cycle')
        }
        
        earningCycleId = newCycle.id
        
        // Check if this is a referred deposit and verify connection
        if (profile.referred_by) {
          const { data: refConnection, error: refError } = await supabaseAdmin
            .from('referral_connections')
            .insert({
              referrer_id: profile.referred_by,
              referred_user_id: transaction.user_id,
              referred_deposit_transaction_id: transaction_id,
              is_valid: true,
              connection_verified_at: new Date().toISOString()
            })
            .select()
            .single()
          
          if (!refError && refConnection) {
            // Increment referrer's connection count
            const { data: referrer } = await supabaseAdmin
              .from('profiles')
              .select('connection_count')
              .eq('id', profile.referred_by)
              .single()
            
            const newConnectionCount = (referrer?.connection_count || 0) + 1
            referrerConnectionsUpdate = { connection_count: newConnectionCount }
            
            // Update referrer's connection count
            await supabaseAdmin
              .from('profiles')
              .update(referrerConnectionsUpdate)
              .eq('id', profile.referred_by)
          }
        }
      } else if (transaction.type === 'withdraw') {
        if (newBalance < Number(transaction.amount)) {
            throw new Error('Insufficient balance for withdrawal')
        }
        newBalance -= Number(transaction.amount)
        newTotalWithdrawn += Number(transaction.amount)
      }
    }

    // 4. Update Profile & Transaction
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ balance: newBalance, total_withdrawn: newTotalWithdrawn })
      .eq('id', transaction.user_id)

    if (profileUpdateError) throw new Error('Failed to update balance')

    const txUpdate: Record<string, any> = { status: status, updated_at: new Date().toISOString() }
    if (status === 'rejected' && rejection_reason) {
      txUpdate.rejection_reason = rejection_reason
    }
    if (earningCycleId) {
      txUpdate.earning_cycle_id = earningCycleId
      txUpdate.is_cycle_initiator = true
    }

    const { error: txUpdateError } = await supabaseAdmin
      .from('transactions')
      .update(txUpdate)
      .eq('id', transaction_id)

    if (txUpdateError) throw new Error('Failed to update transaction status')

    // 5. Send user notification email
    try {
      const { data: userProfile } = await supabaseAdmin
        .from('profiles')
        .select('name, email')
        .eq('id', transaction.user_id)
        .single()

      if (userProfile?.email) {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-user-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userEmail: userProfile.email,
            userName: userProfile.name || 'User',
            status: status,
            type: transaction.type,
            amount: `${transaction.amount}`,
            reason: rejection_reason || undefined
          })
        })
      }
    } catch (emailError: any) {
      console.error('Failed to send user notification:', emailError)
      // Don't fail the transaction if email fails - just log the error
    }

    return new Response(
      JSON.stringify({ success: true, message: `Transaction ${status}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
