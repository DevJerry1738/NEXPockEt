import { supabase } from '@/lib/supabase';

// Helper to format responses like the old API
const handleResponse = async <K extends string, T = any>(promise: PromiseLike<any>, dataKey: K): Promise<{ success: boolean; message?: string; [key: string]: any } & { [P in K]: T }> => {
  try {
    const { data, error } = await promise;
    if (error) throw error;
    return { success: true, [dataKey]: data } as any;
  } catch (err: any) {
    return { success: false, message: err.message || 'Request failed' } as any;
  }
};

// We don't use this anymore because auth is in AuthContext directly, but keeping it for compatibility
export const authApi = {
  me: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return { success: false };
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    return { success: true, user: data };
  },
};

export const taskApi = {
  available: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user.id;

    // 1. Check if user has active earning cycle
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_earning_cycle_id')
      .eq('id', userId)
      .single();

    if (!profile?.active_earning_cycle_id) {
      return {
        success: true,
        tasks: [],
        activeCycle: false,
        message: 'No active earning cycle. Please deposit and start an earning cycle first.'
      };
    }

    // 2. Get all active tasks (no tier gating)
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'active')
      .eq('is_bonus', false)
      .order('created_at', { ascending: false });

    if (tasksError) {
      return { success: false, message: tasksError.message, tasks: [] };
    }

    // 3. Get earning cycle details including start/end dates
    const { data: cycle } = await supabase
      .from('earning_cycles')
      .select('*')
      .eq('id', profile.active_earning_cycle_id)
      .single();

    if (!cycle) {
      return { success: false, message: 'Earning cycle not found', tasks: [] };
    }

    // ── LAZY COMPLETION ──────────────────────────────────────────────────────
    // If the cycle end_date has passed, complete it now and tell the UI.
    const nowCheck = new Date();
    const cycleEndCheck = cycle.end_date ? new Date(cycle.end_date) : null;
    if (cycle.status === 'active' && cycleEndCheck && nowCheck > cycleEndCheck) {
      await supabase
        .from('earning_cycles')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', cycle.id);
      await supabase
        .from('profiles')
        .update({ active_earning_cycle_id: null })
        .eq('id', userId);
      return {
        success: true,
        tasks: [],
        activeCycle: false,
        cycleJustCompleted: true,
        message: 'Your 21-day earning cycle is complete. Your funds are now available for withdrawal.',
      };
    }
    // ─────────────────────────────────────────────────────────────────────────

    // 4. Get tasks completed today
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const { data: doneTodayData } = await supabase
      .from('user_tasks')
      .select('task_id')
      .eq('user_id', userId)
      .gte('completed_at', startOfDay.toISOString());

    const doneTodayIds = (doneTodayData || []).map(t => t.task_id);
    const availableTasks = tasks?.filter(t => !doneTodayIds.includes(t.id)) || [];

    // 5. Get tasks completed during this entire cycle
    const { data: doneInCycleData } = await supabase
      .from('user_tasks')
      .select('task_id')
      .eq('user_id', userId)
      .gte('completed_at', cycle.start_date || '')
      .lte('completed_at', cycle.end_date || '');

    const doneInCycleIds = (doneInCycleData || []).map(t => t.task_id);
    const allTasksCompleted = tasks && doneInCycleIds.length === tasks.length && tasks.length > 0;

    const dailyEarning = Number(cycle.current_balance) * 0.05;

    return {
      success: true,
      tasks: availableTasks,
      activeCycle: true,
      dailyEarning: dailyEarning,
      completedToday: doneTodayIds.length > 0,
      totalTasks: tasks?.length || 0,
      completedInCycle: doneInCycleIds.length,
      allTasksCompleted: allTasksCompleted
    };
  },
  adminList: () => handleResponse(supabase.from('tasks').select('*').eq('is_bonus', false), 'tasks'),
  complete: async (taskId: number) => {
    const { data, error } = await supabase.functions.invoke('complete-task', {
      body: { task_id: taskId }
    });
    if (error) {
      console.error('Complete task error:', error);
      return { success: false, message: error.message || 'Failed to complete task' };
    }
    if (data && !data.success) {
      console.warn('Complete task returned error:', data.message);
      return { success: false, message: data.message || 'Failed to complete task' };
    }
    return data || { success: false, message: 'No response from server' };
  },
  create: (data: any) => handleResponse(supabase.from('tasks').insert({ ...data, is_bonus: false }).select().single(), 'task'),
  update: (id: number, data: any) => handleResponse(supabase.from('tasks').update(data).eq('id', id).select().single(), 'task'),
  delete: (id: number) => handleResponse(supabase.from('tasks').delete().eq('id', id), 'task'),
};

export const bonusTaskApi = {
  available: () => handleResponse(supabase.from('tasks').select('*').eq('status', 'active').eq('is_bonus', true), 'bonus_tasks'),
  adminList: () => handleResponse(supabase.from('tasks').select('*').eq('is_bonus', true), 'bonus_tasks'),
  complete: (bonusTaskId: number) => taskApi.complete(bonusTaskId), // Reuse the same logic
  create: (data: any) => handleResponse(supabase.from('tasks').insert({ ...data, is_bonus: true }).select().single(), 'task'),
  toggle: (id: number, status: string) => handleResponse(supabase.from('tasks').update({ status }).eq('id', id), 'task'),
  delete: (id: number) => handleResponse(supabase.from('tasks').delete().eq('id', id), 'task'),
};

export const transactionApi = {
  my: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return handleResponse(supabase.from('transactions').select('*').eq('user_id', session?.user.id).order('created_at', { ascending: false }), 'transactions');
  },
  deposit: async (data: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const result = await handleResponse(supabase.from('transactions').insert({ ...data, type: 'deposit', user_id: session?.user.id }).select().single(), 'transaction');
    
    // Send admin notification email
    if (result.success && result.transaction) {
      const transaction = result.transaction;
      const { data: userProfile } = await supabase.from('profiles').select('name, email').eq('id', session?.user.id).single();
      
      try {
        await supabase.functions.invoke('send-admin-notification', {
          body: {
            transactionId: transaction.id,
            type: 'deposit',
            amount: `${transaction.amount}`,
            userName: userProfile?.name || 'User',
            userEmail: userProfile?.email || '',
            paymentMethod: transaction.payment_method || 'Unknown'
          }
        });
      } catch (emailError) {
        console.error('Failed to send admin notification:', emailError);
        // Don't fail the transaction if email fails
      }
    }
    
    return result;
  },
  withdraw: async (data: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Validate withdrawal eligibility before creating transaction
    const { data: profile } = await supabase
      .from('profiles')
      .select('balance, active_earning_cycle_id, connection_count')
      .eq('id', session?.user.id)
      .single();

    if (!profile) return { success: false, message: 'User profile not found' };

    // Check balance
    if (Number(profile.balance) < 50) {
      return { success: false, message: 'Minimum withdrawal balance is $50' };
    }

    // Check for active earning cycle — lazy-complete if it has already expired
    if (profile.active_earning_cycle_id) {
      const { data: activeCycle } = await supabase
        .from('earning_cycles')
        .select('id, end_date, status')
        .eq('id', profile.active_earning_cycle_id)
        .single();

      const nowW = new Date();
      const cycleEndW = activeCycle?.end_date ? new Date(activeCycle.end_date) : null;

      if (activeCycle?.status === 'active' && cycleEndW && nowW > cycleEndW) {
        // Expired — lazy-complete it so the withdrawal can proceed
        await supabase
          .from('earning_cycles')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', activeCycle.id);
        await supabase
          .from('profiles')
          .update({ active_earning_cycle_id: null })
          .eq('id', session?.user.id);
        // Fall through — withdrawal is now allowed
      } else {
        return { success: false, message: 'Cannot withdraw while an earning cycle is active. Please wait for your cycle to complete.' };
      }
    }

    // Check referral connections
    if ((profile.connection_count || 0) < 5) {
      return { success: false, message: `You need at least 5 valid referral connections to withdraw. You have ${profile.connection_count || 0}/5.` };
    }

    const result = await handleResponse(supabase.from('transactions').insert({ ...data, type: 'withdraw', user_id: session?.user.id }).select().single(), 'transaction');
    
    // Send admin notification email
    if (result.success && result.transaction) {
      const transaction = result.transaction;
      const userProfile = await supabase.from('profiles').select('name, email').eq('id', session?.user.id).single();
      
      try {
        await supabase.functions.invoke('send-admin-notification', {
          body: {
            transactionId: transaction.id,
            type: 'withdraw',
            amount: `${transaction.amount}`,
            userName: userProfile?.data?.name || 'User',
            userEmail: userProfile?.data?.email || '',
            paymentMethod: transaction.payment_method || 'Unknown'
          }
        });
      } catch (emailError) {
        console.error('Failed to send admin notification:', emailError);
        // Don't fail the transaction if email fails
      }
    }
    
    return result;
  },
  adminList: () => handleResponse(supabase.from('transactions').select(`*, profiles(name, email)`).order('created_at', { ascending: false }), 'transactions'),
  approve: async (id: number) => {
     const { data, error } = await supabase.functions.invoke('process-transaction', {
       body: { transaction_id: id, status: 'approved' }
     });
     if (error) return { success: false, message: data?.message || error.message };
     return data;
  },
  reject: async (id: number, reason: string) => {
     const { data, error } = await supabase.functions.invoke('process-transaction', {
       body: { transaction_id: id, status: 'rejected', rejection_reason: reason }
     });
     if (error) return { success: false, message: data?.message || error.message };
     return data;
  },
};

export const kycApi = {
  submit: async (data: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    return handleResponse(
      supabase.from('kyc_documents').upsert(
        { 
          ...data, 
          user_id: session?.user.id, 
          status: 'pending', 
          submitted_at: new Date().toISOString(),
          rejection_reason: null,
          reviewed_at: null
        }, 
        { onConflict: 'user_id' }
      ).select().single(), 
      'kyc'
    );
  },
  my: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return handleResponse(supabase.from('kyc_documents').select('*').eq('user_id', session?.user.id).maybeSingle(), 'kyc');
  },
  adminList: () => handleResponse(supabase.from('kyc_documents').select('*, profiles(name, email)').order('submitted_at', { ascending: false }), 'kyc_list'),
  verify: (id: number) => handleResponse(supabase.from('kyc_documents').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', id), 'kyc'),
  reject: (id: number, reason: string) => handleResponse(supabase.from('kyc_documents').update({ status: 'rejected', rejection_reason: reason, reviewed_at: new Date().toISOString() }).eq('id', id), 'kyc'),
};

export const paymentApi = {
  // Filter by type: 'deposit', 'withdrawal', or 'both' (matches any that include the requested type)
  active: async (type?: string) => {
    let query = supabase.from('payment_methods').select('*').eq('is_active', true);
    if (type) query = query.or(`type.eq.${type},type.eq.both`);
    return handleResponse(query, 'methods');
  },
  adminList: () => handleResponse(supabase.from('payment_methods').select('*').order('created_at', { ascending: false }), 'methods'),
  create: (data: any) => handleResponse(supabase.from('payment_methods').insert(data).select().single(), 'method'),
  update: (id: number, data: any) => handleResponse(supabase.from('payment_methods').update(data).eq('id', id).select().single(), 'method'),
  delete: (id: number) => handleResponse(supabase.from('payment_methods').delete().eq('id', id), 'method'),
  toggle: (id: number, isActive: boolean) => handleResponse(supabase.from('payment_methods').update({ is_active: isActive }).eq('id', id), 'method'),
};

export const storageApi = {
  uploadProof: async (file: File, userId: string): Promise<{ success: boolean; url?: string; path?: string; message?: string }> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('payment-proofs').upload(path, file, { upsert: false });
    if (error) return { success: false, message: error.message };
    // Get a signed URL valid for 1 hour (bucket is private)
    const { data: signedData } = await supabase.storage.from('payment-proofs').createSignedUrl(path, 3600);
    return { success: true, url: signedData?.signedUrl, path };
  },
  getProofUrl: async (path: string): Promise<string | null> => {
    const { data } = await supabase.storage.from('payment-proofs').createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  },
  uploadKyc: async (file: File, userId: string, side: 'front' | 'back' | 'selfie'): Promise<{ success: boolean; path?: string; message?: string }> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${side}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('kyc').upload(path, file, { upsert: false });
    if (error) return { success: false, message: error.message };
    return { success: true, path };
  },
  getKycUrl: async (path: string): Promise<string | null> => {
    const { data } = await supabase.storage.from('kyc').createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  },
};

export const adminApi = {
  dashboard: async () => {
    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: pendingKyc },
      { count: pendingWithdrawals },
      { count: pendingDeposits },
      { count: activeTasks },
      { count: activeBonusTasks },
      { data: profiles }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('kyc_documents').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending').eq('type', 'withdraw'),
      supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending').eq('type', 'deposit'),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('is_bonus', true),
      supabase.from('profiles').select('balance')
    ]);

    const totalEarnings = profiles?.reduce((sum, p) => sum + Number(p.balance || 0), 0) || 0;
    
    return { 
      success: true, 
      stats: { 
        total_users: totalUsers || 0,
        active_users: activeUsers || 0,
        pending_kyc: pendingKyc || 0,
        pending_withdrawals: pendingWithdrawals || 0,
        pending_deposits: pendingDeposits || 0,
        total_earnings: totalEarnings,
        active_tasks: activeTasks || 0,
        active_bonus_tasks: activeBonusTasks || 0
      } 
    };
  },
  users: async (_params?: string) => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) return { success: false, message: error.message, users: [] };
    return { success: true, users: data || [] };
  },
  updateUser: (id: string | number, data: any) => handleResponse(supabase.from('profiles').update(data).eq('id', id), 'user'),
  resetPassword: async (_id: string | number, _password: string) => {
    // Requires Supabase Admin API for Auth
    return { success: false, message: 'Password reset requires edge function with admin role' };
  },
  toggleWithdrawal: (id: string | number, enabled: boolean) => handleResponse(supabase.from('profiles').update({ withdrawal_enabled: enabled }).eq('id', id), 'user'),
  toggleGlobalWithdrawal: (enabled: boolean) => handleResponse(supabase.from('system_settings').update({ value: enabled }).eq('key', 'global_withdrawal_enabled'), 'setting'),
  auditLogs: () => handleResponse(supabase.from('audit_logs').select('*').order('created_at', { ascending: false }), 'logs'),
};

export const settingsApi = {
  // Transforms [{key, value}] array from DB into a flat {key: value} object for UI
  get: async () => {
    const { data, error } = await supabase.from('system_settings').select('*');
    if (error) return { success: false, message: error.message, settings: {} };
    const flat = (data || []).reduce((acc: any, row: any) => { acc[row.key] = row.value; return acc; }, {});
    return { success: true, settings: flat };
  },
  public: async () => {
    const { data, error } = await supabase.from('system_settings').select('*');
    if (error) return { success: false, message: error.message, settings: {} };
    const flat = (data || []).reduce((acc: any, row: any) => { acc[row.key] = row.value; return acc; }, {});
    return { success: true, settings: flat };
  },
  // Accepts flat object, converts to [{key, value}] array for Supabase upsert
  update: async (data: any) => {
    const rows = Object.entries(data).map(([key, value]) => ({ key, value }));
    const { error } = await supabase.from('system_settings').upsert(rows, { onConflict: 'key' });
    if (error) return { success: false, message: error.message };
    return { success: true };
  },
  testSMTP: (_email?: string) => ({ success: false, message: 'SMTP test not implemented with Supabase default email' }),
};

export const notificationApi = {
  my: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return handleResponse(supabase.from('notifications').select('*').or(`user_id.eq.${session?.user.id},user_id.is.null`).order('created_at', { ascending: false }), 'notifications');
  },
  broadcastList: async () => {
    // Only fetch broadcasts (user_id is null)
    return handleResponse(
      supabase.from('notifications').select('*').is('user_id', null).order('created_at', { ascending: false }),
      'broadcasts'
    );
  },
  broadcastDelete: async (id: number) => {
    // Delete a broadcast notification by id
    return handleResponse(
      supabase.from('notifications').delete().eq('id', id).is('user_id', null),
      'notification'
    );
  },
  unreadCount: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).or(`user_id.eq.${session?.user.id},user_id.is.null`).eq('is_read', false);
    return { success: true, count: count || 0 };
  },
  markRead: async (id?: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (id) {
      // Mark a single personal notification read (broadcasts are handled client-side only)
      return handleResponse(
        supabase.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', userId),
        'notification'
      );
    }
    // Mark all personal notifications read — broadcasts handled client-side
    return handleResponse(
      supabase.from('notifications').update({ is_read: true }).eq('is_read', false).eq('user_id', userId),
      'notifications'
    );
  },
  delete: (id: number) => handleResponse(supabase.from('notifications').delete().eq('id', id), 'notification'),
  sendToUser: (data: any) => handleResponse(supabase.from('notifications').insert(data), 'notification'),
  broadcast: (data: any) => handleResponse(supabase.from('notifications').insert({ ...data, user_id: null }), 'notification'),
  emailLogs: () => ({ success: false, message: 'Not applicable with Supabase Auth' }),
};

export const earningCycleApi = {
  current: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user.id) return { success: false, cycle: null };

    const { data: profile } = await supabase
      .from('profiles')
      .select('active_earning_cycle_id')
      .eq('id', session.user.id)
      .single();

    if (!profile?.active_earning_cycle_id) {
      return { success: true, cycle: null };
    }

    const { data: cycle, error } = await supabase
      .from('earning_cycles')
      .select('*')
      .eq('id', profile.active_earning_cycle_id)
      .single();

    if (error) return { success: false, message: error.message };

    const now = new Date();
    const endDate = cycle?.end_date ? new Date(cycle.end_date) : null;
    const daysRemaining = endDate
      ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    // ── LAZY COMPLETION ──────────────────────────────────────────────────────
    // If the cycle's end_date has passed and it's still marked active,
    // complete it right now instead of waiting for a cron job.
    if (cycle && cycle.status === 'active' && endDate && now > endDate) {
      // 1. Mark cycle completed
      await supabase
        .from('earning_cycles')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', cycle.id);

      // 2. Remove the active cycle reference from the profile
      //    This unblocks withdrawals immediately.
      await supabase
        .from('profiles')
        .update({ active_earning_cycle_id: null })
        .eq('id', session.user.id);

      return {
        success: true,
        cycle: null,           // No active cycle anymore
        justCompleted: true,   // UI can show a congratulations message
        completedCycle: {
          initialBalance: Number(cycle.initial_balance),
          finalBalance: Number(cycle.current_balance),
          totalEarned: Number(cycle.current_balance) - Number(cycle.initial_balance),
        },
      };
    }
    // ─────────────────────────────────────────────────────────────────────────

    return {
      success: true,
      cycle: {
        id: cycle?.id,
        initialBalance: cycle?.initial_balance,
        currentBalance: cycle?.current_balance,
        startDate: cycle?.start_date,
        endDate: cycle?.end_date,
        status: cycle?.status,
        daysRemaining,
        lastTaskCompletionDate: cycle?.last_task_completion_date,
      },
    };
  },
  initiate: async () => {
    const { data, error } = await supabase.functions.invoke('initiate-earning-cycle', {
      body: {}
    });
    if (error) {
      // The edge function returns a JSON body with a human-readable message even on
      // error responses. Supabase SDK still sets `error` for non-2xx but also
      // populates `data` with the parsed body — prefer that over the generic SDK string.
      const friendlyMsg = data?.message || error.message;
      return { success: false, message: friendlyMsg };
    }
    return data || { success: false, message: 'No response from server' };
  },
  prepared: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user.id) return { success: false, cycle: null };

    const { data: cycle, error } = await supabase
      .from('earning_cycles')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'prepared')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { success: false, message: error.message };
    }

    return { success: true, cycle: cycle || null };
  }
};

export const referralApi = {
  myCode: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user.id) return { success: false, code: null };

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('referral_code, connection_count')
      .eq('id', session.user.id)
      .single();

    if (error) return { success: false, message: error.message };
    return {
      success: true,
      code: profile?.referral_code,
      validConnections: profile?.connection_count || 0
    };
  },
  myConnections: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user.id) return { success: false, connections: [] };

    // Fetch connections and their related profile data
    const { data: connections, error } = await supabase
      .from('referral_connections')
      .select('id, referred_user_id, is_valid, created_at, connection_verified_at')
      .eq('referrer_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) return { success: false, message: error.message };

    // Fetch profile data for referred users
    if (connections && connections.length > 0) {
      const referredUserIds = connections.map(c => c.referred_user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', referredUserIds);

      // Map profile data back to connections
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const enrichedConnections = connections.map(conn => ({
        ...conn,
        profiles: profileMap.get(conn.referred_user_id)
      }));

      return {
        success: true,
        connections: enrichedConnections
      };
    }

    return {
      success: true,
      connections: connections || []
    };
  },
  bonusEligibility: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user.id) return { success: false, eligibility: null };

    const { data: profile } = await supabase
      .from('profiles')
      .select('connection_count')
      .eq('id', session.user.id)
      .single();

    const connectionCount = profile?.connection_count || 0;

    // Get applicable bonus tier
    const { data: tiers, error: tierError } = await supabase
      .from('referral_bonus_tiers')
      .select('*')
      .eq('is_active', true)
      .order('min_connections', { ascending: false });

    if (tierError) return { success: false, message: tierError.message };

    let applicable = null;
    for (const tier of tiers || []) {
      if (connectionCount >= tier.min_connections) {
        if (!tier.max_connections || connectionCount <= tier.max_connections) {
          applicable = tier;
          break;
        }
      }
    }

    return {
      success: true,
      eligibility: {
        validConnections: connectionCount,
        applicableTier: applicable
      }
    };
  }
};

export const referralBonusTiersApi = {
  list: async () => {
    const { data, error } = await supabase
      .from('referral_bonus_tiers')
      .select('*')
      .eq('is_active', true)
      .order('min_connections');

    if (error) return { success: false, message: error.message, tiers: [] };
    return { success: true, tiers: data || [] };
  },
  adminList: () => handleResponse(
    supabase.from('referral_bonus_tiers').select('*').order('min_connections'),
    'tiers'
  ),
  create: (data: any) => handleResponse(
    supabase.from('referral_bonus_tiers').insert(data).select().single(),
    'tier'
  ),
  update: (id: string, data: any) => handleResponse(
    supabase.from('referral_bonus_tiers').update(data).eq('id', id).select().single(),
    'tier'
  ),
  delete: (id: string) => handleResponse(
    supabase.from('referral_bonus_tiers').delete().eq('id', id),
    'tier'
  )
};

// Deprecated export api
export const api = {
  setToken: () => {},
};
