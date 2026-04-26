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

    const [tasksRes, planRes, progressRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('status', 'active').eq('is_bonus', false),
      supabase.from('user_plans').select('*, plans(*)').eq('user_id', userId).eq('is_active', true).maybeSingle(),
      supabase.rpc('get_daily_tasks_completed', { p_user_id: userId })
    ]);

    return {
      success: true,
      tasks: tasksRes.data || [],
      plan: planRes.data || null,
      progress: {
        completed: progressRes.data || 0,
        total: planRes.data?.plans?.daily_tasks || 0
      }
    };
  },
  adminList: () => handleResponse(supabase.from('tasks').select('*').eq('is_bonus', false), 'tasks'),
  complete: async (taskId: number) => {
    const { data, error } = await supabase.functions.invoke('complete-task', {
      body: { task_id: taskId }
    });
    if (error) return { success: false, message: error.message };
    return data;
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

export const planApi = {
  list: () => handleResponse(supabase.from('plans').select('*').eq('is_active', true).order('price'), 'plans'),
  adminList: () => handleResponse(supabase.from('plans').select('*').order('price'), 'plans'),
  my: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return handleResponse(supabase.from('user_plans').select('*, plans(*)').eq('user_id', session?.user.id).eq('is_active', true).maybeSingle(), 'plan');
  },
  buy: async (planId: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    const { data: plan } = await supabase.from('plans').select('*').eq('id', planId).single();
    
    // Deactivate old plans
    await supabase.from('user_plans').update({ is_active: false }).eq('user_id', session?.user.id);
    
    return handleResponse(supabase.from('user_plans').insert({
      user_id: session?.user.id,
      plan_id: planId,
      expires_at: new Date(Date.now() + (plan.duration_days * 24 * 60 * 60 * 1000)).toISOString()
    }).select().single(), 'plan');
  },
  create: (data: any) => handleResponse(supabase.from('plans').insert(data).select().single(), 'plan'),
  update: (id: number, data: any) => handleResponse(supabase.from('plans').update(data).eq('id', id).select().single(), 'plan'),
  delete: (id: number) => handleResponse(supabase.from('plans').delete().eq('id', id), 'plan'),
};

export const transactionApi = {
  my: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return handleResponse(supabase.from('transactions').select('*').eq('user_id', session?.user.id).order('created_at', { ascending: false }), 'transactions');
  },
  deposit: async (data: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    return handleResponse(supabase.from('transactions').insert({ ...data, type: 'deposit', user_id: session?.user.id }).select().single(), 'transaction');
  },
  withdraw: async (data: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    return handleResponse(supabase.from('transactions').insert({ ...data, type: 'withdraw', user_id: session?.user.id }).select().single(), 'transaction');
  },
  adminList: () => handleResponse(supabase.from('transactions').select(`*, profiles(name, email)`).order('created_at', { ascending: false }), 'transactions'),
  approve: async (id: number) => {
     const { data, error } = await supabase.functions.invoke('process-transaction', {
       body: { transaction_id: id, status: 'approved' }
     });
     if (error) return { success: false, message: error.message };
     return data;
  },
  reject: async (id: number, reason: string) => {
     const { data, error } = await supabase.functions.invoke('process-transaction', {
       body: { transaction_id: id, status: 'rejected', rejection_reason: reason }
     });
     if (error) return { success: false, message: error.message };
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
    return handleResponse(supabase.from('kyc_documents').select('*').eq('user_id', session?.user.id).single(), 'kyc');
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
  unreadCount: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).or(`user_id.eq.${session?.user.id},user_id.is.null`).eq('is_read', false);
    return { success: true, count: count || 0 };
  },
  markRead: (id?: number) => id ? handleResponse(supabase.from('notifications').update({ is_read: true }).eq('id', id), 'notification') : handleResponse(supabase.from('notifications').update({ is_read: true }).eq('is_read', false), 'notifications'),
  delete: (id: number) => handleResponse(supabase.from('notifications').delete().eq('id', id), 'notification'),
  sendToUser: (data: any) => handleResponse(supabase.from('notifications').insert(data), 'notification'),
  broadcast: (data: any) => handleResponse(supabase.from('notifications').insert({ ...data, user_id: null }), 'notification'),
  emailLogs: () => ({ success: false, message: 'Not applicable with Supabase Auth' }),
};

// Deprecated export api
export const api = {
  setToken: () => {},
};
