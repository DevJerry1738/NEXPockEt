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
      .select('balance, total_withdrawn')
      .eq('id', transaction.user_id)
      .single()

    if (!profile) throw new Error('User not found')

    let newBalance = Number(profile.balance)
    let newTotalWithdrawn = Number(profile.total_withdrawn)

    // 3. Process Balance Changes if Approved
    if (status === 'approved') {
      if (transaction.type === 'deposit') {
        newBalance += Number(transaction.amount)
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

    const { error: txUpdateError } = await supabaseAdmin
      .from('transactions')
      .update(txUpdate)
      .eq('id', transaction_id)

    if (txUpdateError) throw new Error('Failed to update transaction status')

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
