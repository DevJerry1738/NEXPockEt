/**
 * NEXPockEt Mock API
 * Simulates backend responses for demo purposes
 * Remove this file and its usage when connecting to real backend
 */

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const DEMO_ADMIN = {
  id: 1,
  name: 'System Admin',
  email: 'admin@nexpocket.com',
  role: 'admin',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
  balance: 0,
  total_earned: 0,
  total_withdrawn: 0,
  kyc_status: 'verified',
  referral_code: 'REFADMIN',
  plan_id: 1,
  withdrawal_enabled: true,
  status: 'active',
};

const DEMO_USER = {
  id: 2,
  name: 'John Demo',
  email: 'user@demo.com',
  role: 'user',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  balance: 125.5,
  total_earned: 350.75,
  total_withdrawn: 225.25,
  kyc_status: 'verified',
  referral_code: 'REFDEMO1',
  plan_id: 2,
  withdrawal_enabled: true,
  status: 'active',
};

let currentUser: any = null;
let mockToken = '';

const users = [
  { id: 1, name: 'Alice Smith', email: 'alice@test.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', role: 'user', status: 'active', balance: 85.0, total_earned: 150.0, total_withdrawn: 65.0, kyc_status: 'verified', withdrawal_enabled: true, referral_code: 'REF0001', plan_name: 'Bronze', created_at: '2026-04-01' },
  { id: 2, name: 'Bob Johnson', email: 'bob@test.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob', role: 'user', status: 'active', balance: 42.5, total_earned: 80.0, total_withdrawn: 37.5, kyc_status: 'pending', withdrawal_enabled: true, referral_code: 'REF0002', plan_name: 'Free Starter', created_at: '2026-04-05' },
  { id: 3, name: 'Carol White', email: 'carol@test.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol', role: 'user', status: 'suspended', balance: 0, total_earned: 25.0, total_withdrawn: 25.0, kyc_status: 'rejected', withdrawal_enabled: false, referral_code: 'REF0003', plan_name: 'Free Starter', created_at: '2026-04-08' },
  { id: 4, name: 'David Lee', email: 'david@test.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David', role: 'user', status: 'active', balance: 200.0, total_earned: 500.0, total_withdrawn: 300.0, kyc_status: 'verified', withdrawal_enabled: true, referral_code: 'REF0004', plan_name: 'Silver', created_at: '2026-04-10' },
  { id: 5, name: 'Emma Brown', email: 'emma@test.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma', role: 'user', status: 'banned', balance: 5.0, total_earned: 10.0, total_withdrawn: 5.0, kyc_status: 'not_submitted', withdrawal_enabled: false, referral_code: 'REF0005', plan_name: 'Free Starter', created_at: '2026-04-12' },
];

const tasks = [
  { id: 1, title: 'Visit TechCrunch', description: 'Visit the TechCrunch homepage and browse for 30 seconds', type: 'click', reward: 0.50, url: 'https://techcrunch.com', duration: 30, max_completions: 500, completions: 124, status: 'active', created_at: '2026-04-01' },
  { id: 2, title: 'Sign Up for Newsletter', description: 'Subscribe to our partner newsletter for tech updates', type: 'signup', reward: 2.00, url: '#', duration: 60, max_completions: 200, completions: 89, status: 'active', created_at: '2026-04-02' },
  { id: 3, title: 'Watch Product Review', description: 'Watch the product review video on YouTube', type: 'video', reward: 1.50, url: '#', duration: 120, max_completions: 300, completions: 201, status: 'active', created_at: '2026-04-03' },
  { id: 4, title: 'Follow on Twitter', description: 'Follow our partner on Twitter/X', type: 'social', reward: 0.75, url: '#', duration: 15, max_completions: 400, completions: 350, status: 'active', created_at: '2026-04-04' },
  { id: 5, title: 'Complete Survey', description: 'Complete a short consumer preference survey', type: 'survey', reward: 3.00, url: '#', duration: 180, max_completions: 150, completions: 45, status: 'active', created_at: '2026-04-05' },
  { id: 6, title: 'Download App', description: 'Download and install the partner mobile app', type: 'app', reward: 5.00, url: '#', duration: 300, max_completions: 100, completions: 67, status: 'active', created_at: '2026-04-06' },
  { id: 7, title: 'Visit ProductHunt', description: 'Browse trending products on ProductHunt', type: 'click', reward: 0.40, url: 'https://producthunt.com', duration: 20, max_completions: 600, completions: 412, status: 'inactive', created_at: '2026-04-07' },
];

const bonusTasks = [
  { id: 1, title: 'Weekend Bonus', description: 'Complete this special weekend task for extra rewards', reward: 10.00, start_time: '2026-04-18T00:00:00', end_time: '2026-04-20T23:59:59', max_completions: 50, current_completions: 23, status: 'active', created_at: '2026-04-18' },
  { id: 2, title: 'Flash Bonus', description: 'Limited time flash bonus - act fast', reward: 25.00, start_time: '2026-04-19T12:00:00', end_time: '2026-04-19T18:00:00', max_completions: 20, current_completions: 18, status: 'active', created_at: '2026-04-19' },
];

const transactions = [
  { id: 1, user_id: 1, user_name: 'Alice Smith', user_email: 'alice@test.com', type: 'deposit', amount: 100.00, status: 'approved', method: 'Bank Transfer', details: 'Deposit via Bank Transfer', created_at: '2026-04-15T10:00:00' },
  { id: 2, user_id: 2, user_name: 'Bob Johnson', user_email: 'bob@test.com', type: 'withdrawal', amount: 50.00, status: 'pending', method: 'PayPal', details: 'PayPal: bob@paypal.com', created_at: '2026-04-19T14:30:00' },
  { id: 3, user_id: 3, user_name: 'Carol White', user_email: 'carol@test.com', type: 'deposit', amount: 25.00, status: 'pending', method: 'Crypto', details: 'USDT deposit', created_at: '2026-04-19T16:00:00' },
  { id: 4, user_id: 4, user_name: 'David Lee', user_email: 'david@test.com', type: 'task_reward', amount: 5.00, status: 'approved', method: 'System', details: 'Completed: Download App', created_at: '2026-04-19T09:00:00' },
  { id: 5, user_id: 1, user_name: 'Alice Smith', user_email: 'alice@test.com', type: 'withdrawal', amount: 30.00, status: 'pending', method: 'Payoneer', details: 'Payoneer: alice@payoneer.com', created_at: '2026-04-20T08:00:00' },
  { id: 6, user_id: 2, user_name: 'Bob Johnson', user_email: 'bob@test.com', type: 'task_reward', amount: 0.50, status: 'approved', method: 'System', details: 'Completed: Visit TechCrunch', created_at: '2026-04-20T11:00:00' },
];

const kycList = [
  { id: 1, user_id: 2, name: 'Bob Johnson', email: 'bob@test.com', id_type: 'passport', id_number: 'P123456789', id_front_image: '', id_back_image: '', selfie_image: '', status: 'pending', rejection_reason: null, submitted_at: '2026-04-18T10:00:00', reviewed_at: null, reviewed_by: null },
  { id: 2, user_id: 3, name: 'Carol White', email: 'carol@test.com', id_type: 'drivers_license', id_number: 'DL987654321', id_front_image: '', id_back_image: '', selfie_image: '', status: 'rejected', rejection_reason: 'Blurry image, please resubmit with clearer photo', submitted_at: '2026-04-15T14:00:00', reviewed_at: '2026-04-16T09:00:00', reviewed_by: 1 },
  { id: 3, user_id: 4, name: 'David Lee', email: 'david@test.com', id_type: 'national_id', id_number: 'NID456789123', id_front_image: '', id_back_image: '', selfie_image: '', status: 'verified', rejection_reason: null, submitted_at: '2026-04-10T08:00:00', reviewed_at: '2026-04-11T10:00:00', reviewed_by: 1 },
];

const plans = [
  { id: 1, name: 'Free Starter', description: 'Begin your earning journey', price: 0.00, daily_task_limit: 3, daily_earning_cap: 5.00, duration: 999, duration_unit: 'days', features: ['3 daily tasks', '$5 daily earning cap', 'Basic task types', 'Community support'], color: '#94A3B8', icon: 'Zap', status: 'active' },
  { id: 2, name: 'Bronze', description: 'Unlock more earning potential', price: 25.00, daily_task_limit: 10, daily_earning_cap: 25.00, duration: 30, duration_unit: 'days', features: ['10 daily tasks', '$25 daily earning cap', 'All task types', 'Priority support', 'Referral bonuses'], color: '#CD7F32', icon: 'Award', status: 'active' },
  { id: 3, name: 'Silver', description: 'Maximum earnings for serious users', price: 75.00, daily_task_limit: 25, daily_earning_cap: 75.00, duration: 30, duration_unit: 'days', features: ['25 daily tasks', '$75 daily earning cap', 'All task types + bonuses', 'VIP support', 'Higher referral rate', 'Instant withdrawals'], color: '#C0C0C0', icon: 'Crown', status: 'active' },
  { id: 4, name: 'Gold', description: 'Elite tier with unlimited potential', price: 150.00, daily_task_limit: 50, daily_earning_cap: 200.00, duration: 30, duration_unit: 'days', features: ['50 daily tasks', '$200 daily earning cap', 'All premium tasks', 'Dedicated support', 'Maximum referral rate', 'Instant withdrawals', 'Exclusive bonuses'], color: '#FFD700', icon: 'Star', status: 'active' },
];

const paymentMethods = [
  { id: 1, name: 'Bank Transfer', type: 'deposit', currency: 'USD', min_amount: 10.00, max_amount: 10000.00, instructions: 'Transfer to the provided account number and upload proof', account_details: 'Account: 000123456789\nBank: NEXPockEt Bank', icon: 'Landmark', sort_order: 1, status: 'active' },
  { id: 2, name: 'PayPal', type: 'withdrawal', currency: 'USD', min_amount: 20.00, max_amount: 5000.00, instructions: 'Enter your PayPal email address', account_details: 'Send to user provided PayPal email', icon: 'Wallet', sort_order: 2, status: 'active' },
  { id: 3, name: 'Crypto (USDT)', type: 'both', currency: 'USDT', min_amount: 10.00, max_amount: 50000.00, instructions: 'Send USDT to TRC20 address. Min 10 USDT', account_details: 'TRC20: TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', icon: 'Bitcoin', sort_order: 3, status: 'active' },
  { id: 4, name: 'Payoneer', type: 'withdrawal', currency: 'USD', min_amount: 50.00, max_amount: 10000.00, instructions: 'Enter your Payoneer email', account_details: 'Send to user provided Payoneer email', icon: 'CreditCard', sort_order: 4, status: 'active' },
];

const notifications = [
  { id: 1, title: 'Welcome to NEXPockEt!', message: 'Complete your first task to start earning.', type: 'info', is_read: 0, created_at: '2026-04-20T10:00:00' },
  { id: 2, title: 'Bonus Task Available!', message: 'New bonus task: Weekend Bonus - Earn $10.00!', type: 'success', is_read: 0, created_at: '2026-04-19T12:00:00' },
  { id: 3, title: 'Deposit Approved', message: 'Your deposit of $100.00 has been approved and credited.', type: 'success', is_read: 1, created_at: '2026-04-15T11:00:00' },
];

const auditLogs = [
  { id: 1, action: 'user_update', details: 'Updated user #2', admin_id: 1, ip_address: '192.168.1.1', created_at: '2026-04-20T14:00:00' },
  { id: 2, action: 'password_reset', details: 'Reset password for user #3', admin_id: 1, ip_address: '192.168.1.1', created_at: '2026-04-19T10:30:00' },
  { id: 3, action: 'kyc_verify', details: 'Verified KYC for user #4', admin_id: 1, ip_address: '192.168.1.1', created_at: '2026-04-18T09:00:00' },
  { id: 4, action: 'transaction_approve', details: 'Approved deposit #1', admin_id: 1, ip_address: '192.168.1.1', created_at: '2026-04-17T16:00:00' },
];

const settings = {
  site_name: 'NEXPockEt',
  currency: 'USD',
  min_deposit: 10.00,
  max_deposit: 10000.00,
  min_withdrawal: 20.00,
  max_withdrawal: 5000.00,
  withdrawal_fee_percent: 2.00,
  referral_bonus: 5.00,
  referral_commission_percent: 10.00,
  email_notifications: 1,
  withdrawals_enabled: 1,
  registration_enabled: 1,
  maintenance_mode: 0,
  smtp_host: '',
  smtp_port: 587,
  smtp_user: '',
  smtp_pass: '',
  smtp_encryption: 'tls',
  smtp_from: 'noreply@nexpocket.com',
  smtp_from_name: 'NEXPockEt',
};

// ============================================================================
// Mock API Handler
// ============================================================================

export async function mockRequest(endpoint: string, method: string, body?: any): Promise<any> {
  await delay(300 + Math.random() * 400);

  const token = localStorage.getItem('token');
  token; // referenced

  // ---- AUTH ----
  if (endpoint === 'auth/login' && method === 'POST') {
    const { email, password } = body || {};
    if (email === 'admin@nexpocket.com' && password === 'password') {
      currentUser = DEMO_ADMIN;
      mockToken = 'admin_jwt_token_123';
      localStorage.setItem('token', mockToken);
      return { success: true, token: mockToken, user: DEMO_ADMIN };
    }
    if (email === 'user@demo.com' && password === 'password') {
      currentUser = DEMO_USER;
      mockToken = 'user_jwt_token_456';
      localStorage.setItem('token', mockToken);
      return { success: true, token: mockToken, user: DEMO_USER };
    }
    return { success: false, message: 'Invalid email or password' };
  }

  if (endpoint === 'auth/register' && method === 'POST') {
    currentUser = { ...DEMO_USER, name: body?.name || 'New User', email: body?.email || 'new@demo.com' };
    mockToken = 'user_jwt_token_new';
    localStorage.setItem('token', mockToken);
    return { success: true, token: mockToken, user: currentUser };
  }

  if (endpoint === 'auth/me') {
    return { success: true, user: currentUser || DEMO_ADMIN };
  }

  if (endpoint === 'auth/forgot-password' && method === 'POST') {
    return { success: true, message: 'Password reset link sent' };
  }

  // ---- TASKS ----
  if (endpoint === 'tasks/available') {
    return {
      success: true,
      tasks: tasks.filter((t) => t.status === 'active'),
      plan: { daily_task_limit: 10, daily_earning_cap: 25, tasks_completed: 2, earnings_today: 4.5 },
    };
  }

  if (endpoint === 'tasks/complete' && method === 'POST') {
    const reward = 0.5;
    return { success: true, reward, new_balance: (currentUser?.balance || 0) + reward, message: `Earned $${reward}!` };
  }

  if (endpoint === 'tasks/admin') {
    return { success: true, tasks };
  }

  if (endpoint === 'tasks/create' && method === 'POST') {
    tasks.push({ ...body, id: tasks.length + 1, completions: 0, status: 'active', created_at: new Date().toISOString() });
    return { success: true, id: tasks.length, message: 'Task created' };
  }

  if (endpoint.startsWith('tasks/update/') && method === 'PATCH') {
    return { success: true, message: 'Task updated' };
  }

  if (endpoint.startsWith('tasks/delete/') && method === 'DELETE') {
    return { success: true, message: 'Task deleted' };
  }

  // ---- BONUS TASKS ----
  if (endpoint === 'bonus-tasks/available') {
    return { success: true, bonus_tasks: bonusTasks.filter((t) => t.status === 'active') };
  }

  if (endpoint === 'bonus-tasks/complete' && method === 'POST') {
    return { success: true, reward: 10, message: 'Bonus earned: $10!' };
  }

  if (endpoint === 'bonus-tasks/admin') {
    return { success: true, bonus_tasks: bonusTasks };
  }

  if (endpoint === 'bonus-tasks/create' && method === 'POST') {
    bonusTasks.push({ ...body, id: bonusTasks.length + 1, current_completions: 0, status: 'active', created_at: new Date().toISOString() });
    return { success: true, message: 'Bonus task created and users notified' };
  }

  if (endpoint.startsWith('bonus-tasks/toggle/') && method === 'PATCH') {
    return { success: true, message: 'Status updated' };
  }

  if (endpoint.startsWith('bonus-tasks/delete/') && method === 'DELETE') {
    return { success: true, message: 'Deleted' };
  }

  // ---- TRANSACTIONS ----
  if (endpoint === 'transactions/my') {
    return { success: true, transactions: transactions.filter((t) => t.user_id === (currentUser?.id || 2)) };
  }

  if (endpoint === 'transactions/admin') {
    return { success: true, transactions };
  }

  if (endpoint === 'transactions/deposit' && method === 'POST') {
    return { success: true, message: 'Deposit request submitted' };
  }

  if (endpoint === 'transactions/withdraw' && method === 'POST') {
    return { success: true, message: 'Withdrawal request submitted' };
  }

  if (endpoint.startsWith('transactions/approve/') && method === 'POST') {
    return { success: true, message: 'Transaction approved' };
  }

  if (endpoint.startsWith('transactions/reject/') && method === 'POST') {
    return { success: true, message: 'Transaction rejected' };
  }

  // ---- PLANS ----
  if (endpoint === 'plans') {
    return { success: true, plans };
  }

  if (endpoint === 'plans/admin') {
    return { success: true, plans };
  }

  if (endpoint === 'plans/activate' && method === 'POST') {
    return { success: true, message: 'Plan activated' };
  }

  if (endpoint === 'plans/create' && method === 'POST') {
    return { success: true, message: 'Plan created' };
  }

  if (endpoint.startsWith('plans/update/') && method === 'PATCH') {
    return { success: true, message: 'Plan updated' };
  }

  if (endpoint.startsWith('plans/delete/') && method === 'DELETE') {
    return { success: true, message: 'Plan deleted' };
  }

  // ---- KYC ----
  if (endpoint === 'kyc/my') {
    return { success: true, kyc: kycList.find((k) => k.user_id === (currentUser?.id || 2)) || null };
  }

  if (endpoint === 'kyc/submit' && method === 'POST') {
    return { success: true, message: 'KYC submitted for review' };
  }

  if (endpoint === 'kyc/admin') {
    return { success: true, kyc_list: kycList };
  }

  if (endpoint.startsWith('kyc/verify/') && method === 'POST') {
    return { success: true, message: 'KYC verified' };
  }

  if (endpoint.startsWith('kyc/reject/') && method === 'POST') {
    return { success: true, message: 'KYC rejected' };
  }

  // ---- PAYMENTS ----
  if (endpoint === 'payments/active') {
    return { success: true, methods: paymentMethods.filter((m) => m.status === 'active') };
  }

  if (endpoint === 'payments/admin') {
    return { success: true, methods: paymentMethods };
  }

  if (endpoint === 'payments/create' && method === 'POST') {
    return { success: true, message: 'Payment method created' };
  }

  if (endpoint.startsWith('payments/update/') && method === 'PATCH') {
    return { success: true, message: 'Payment method updated' };
  }

  if (endpoint.startsWith('payments/delete/') && method === 'DELETE') {
    return { success: true, message: 'Payment method deleted' };
  }

  if (endpoint.startsWith('payments/toggle/') && method === 'PATCH') {
    return { success: true, message: 'Payment method toggled' };
  }

  // ---- ADMIN ----
  if (endpoint === 'admin/dashboard') {
    return {
      success: true,
      stats: {
        total_users: users.length + 1,
        active_users: users.filter((u) => u.status === 'active').length,
        suspended_users: users.filter((u) => u.status === 'suspended').length,
        total_earnings: users.reduce((s, u) => s + u.total_earned, 0),
        pending_deposits: transactions.filter((t) => t.type === 'deposit' && t.status === 'pending').length,
        pending_withdrawals: transactions.filter((t) => t.type === 'withdrawal' && t.status === 'pending').length,
        pending_kyc: kycList.filter((k) => k.status === 'pending').length,
        active_tasks: tasks.filter((t) => t.status === 'active').length,
        today_completions: 45,
        total_withdrawn: users.reduce((s, u) => s + u.total_withdrawn, 0),
        active_bonus_tasks: bonusTasks.filter((t) => t.status === 'active').length,
      },
    };
  }

  if (endpoint === 'admin/users' || endpoint.startsWith('admin/users?')) {
    return { success: true, users: [DEMO_ADMIN, DEMO_USER, ...users] };
  }

  if (endpoint.startsWith('admin/user/') && method === 'PATCH') {
    return { success: true, message: 'User updated' };
  }

  if (endpoint.startsWith('admin/reset-password/') && method === 'POST') {
    return { success: true, message: 'Password reset' };
  }

  if (endpoint.startsWith('admin/toggle-withdrawal/') && method === 'POST') {
    return { success: true, message: 'Withdrawal toggled' };
  }

  if (endpoint === 'admin/toggle-global-withdrawal' && method === 'POST') {
    settings.withdrawals_enabled = body?.enabled ? 1 : 0;
    return { success: true, message: 'Global withdrawal toggled' };
  }

  if (endpoint === 'admin/audit-logs') {
    return { success: true, logs: auditLogs };
  }

  // ---- SETTINGS ----
  if (endpoint === 'settings/admin') {
    return { success: true, settings };
  }

  if (endpoint === 'settings') {
    return {
      success: true,
      settings: {
        site_name: settings.site_name,
        currency: settings.currency,
        min_deposit: settings.min_deposit,
        max_deposit: settings.max_deposit,
        min_withdrawal: settings.min_withdrawal,
        max_withdrawal: settings.max_withdrawal,
        referral_bonus: settings.referral_bonus,
        registration_enabled: settings.registration_enabled,
        maintenance_mode: settings.maintenance_mode,
        withdrawals_enabled: settings.withdrawals_enabled,
      },
    };
  }

  if (endpoint === 'settings' && method === 'PATCH') {
    Object.assign(settings, body);
    return { success: true, message: 'Settings updated' };
  }

  if (endpoint === 'settings/test-smtp' && method === 'POST') {
    return { success: true, message: 'Test email sent successfully' };
  }

  // ---- NOTIFICATIONS ----
  if (endpoint === 'notifications/my') {
    return { success: true, notifications };
  }

  if (endpoint === 'notifications/unread-count') {
    return { success: true, count: notifications.filter((n) => !n.is_read).length };
  }

  if (endpoint.startsWith('notifications/read') && method === 'PATCH') {
    return { success: true, message: 'Marked as read' };
  }

  if (endpoint.startsWith('notifications/delete/') && method === 'DELETE') {
    return { success: true, message: 'Deleted' };
  }

  if (endpoint === 'notifications/send-user' && method === 'POST') {
    return { success: true, message: 'Notification sent' };
  }

  if (endpoint === 'notifications/broadcast' && method === 'POST') {
    return { success: true, message: 'Broadcast sent to 5 users' };
  }

  if (endpoint === 'notifications/email-logs') {
    return { success: true, logs: [] };
  }

  // ---- HEALTH ----
  if (endpoint === 'health') {
    return { success: true, message: 'Demo mode active', time: new Date().toISOString() };
  }

  return { success: false, message: `Demo: endpoint "${endpoint}" not implemented` };
}
