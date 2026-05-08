# Quick Start Guide - NEXPocket Earnings System

## For Developers

### Setting Up Local Development

1. **Database Migrations**
   ```bash
   # Apply all earnings system migrations
   supabase db push
   ```
   Applies: 00010 → 00015 (in order)

2. **Edge Functions**
   ```bash
   # Deploy functions locally
   supabase functions deploy process-transaction
   supabase functions deploy complete-task
   supabase functions deploy initiate-earning-cycle
   ```

3. **Environment Variables**
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Install & Run**
   ```bash
   npm install
   npm run dev
   ```

---

## Test Data Setup (SQL)

### 1. Create Test Users

```sql
-- User A (Referrer)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, last_sign_in_at, created_at, updated_at)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'alice@test.com',
  -- Use your test password hash
  crypt('password', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  NOW()
);

-- Create profile for User A
INSERT INTO public.profiles (id, name, email, referral_code, role, created_at)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'Alice',
  'alice@test.com',
  'REF' || SUBSTRING(uuid_send(gen_random_uuid())::text, 1, 8) || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  'user',
  NOW()
);

-- User B (Referred by A)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'bob@test.com',
  crypt('password', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);

INSERT INTO public.profiles (id, name, email, referred_by, role, created_at)
VALUES (
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'Bob',
  'bob@test.com',
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'user',
  NOW()
);

-- Repeat for Users C, D, E, F (total 5 referred by A)
```

### 2. Create Deposits

```sql
-- User A deposits $100
INSERT INTO public.transactions (
  id, user_id, type, amount, currency, status, payment_method, 
  earning_cycle_id, is_cycle_initiator, created_at, approved_at
)
VALUES (
  gen_random_uuid(),
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'deposit',
  100.00,
  'USD',
  'approved',
  'bank_transfer',
  NULL, -- Will be set after cycle creation
  true,
  NOW(),
  NOW()
);

-- Admin approves → triggers process-transaction
-- This should create earning_cycles record and link transaction to it

-- Repeat for Users B-F with $50 each
```

### 3. Create Earning Cycles (after deposits approved)

```sql
-- Check for prepared cycles
SELECT * FROM public.earning_cycles WHERE status = 'prepared' LIMIT 5;

-- Update cycle to active for testing
UPDATE public.earning_cycles 
SET status = 'active', 
    start_date = NOW()::date,
    end_date = (NOW() + INTERVAL '21 days')::date
WHERE user_id = 'a0000000-0000-0000-0000-000000000001'::uuid;

-- Update profile to link active cycle
UPDATE public.profiles 
SET active_earning_cycle_id = (
  SELECT id FROM public.earning_cycles 
  WHERE user_id = 'a0000000-0000-0000-0000-000000000001'::uuid 
  AND status = 'active' 
  LIMIT 1
)
WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid;
```

### 4. Create Referral Connections

```sql
-- Create connection: A referred B
INSERT INTO public.referral_connections (
  id, referrer_id, referred_user_id, referred_deposit_transaction_id, 
  is_valid, connection_verified_at, created_at
)
VALUES (
  gen_random_uuid(),
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'b0000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.transactions 
   WHERE user_id = 'b0000000-0000-0000-0000-000000000001'::uuid 
   AND type = 'deposit' LIMIT 1),
  true,
  NOW(),
  NOW()
);

-- Update connection_count
UPDATE public.profiles 
SET connection_count = 1
WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid;

-- Repeat for C, D, E, F (total 5 connections)
```

### 5. Verify Setup

```sql
-- Check cycles
SELECT id, user_id, status, initial_balance, current_balance, start_date, end_date
FROM public.earning_cycles
WHERE user_id IN ('a0000000-0000-0000-0000-000000000001'::uuid)
LIMIT 1;

-- Check referrals
SELECT COUNT(*) as connection_count
FROM public.referral_connections
WHERE referrer_id = 'a0000000-0000-0000-0000-000000000001'::uuid
AND is_valid = true;

-- Check bonus eligibility
SELECT * FROM public.referral_bonus_tiers
WHERE is_active = true
ORDER BY min_connections;
```

---

## Common API Test Calls

### Test Earning Cycle API

```typescript
// In browser console or test file
import { earningCycleApi } from '@/api/api';

// Get current cycle
const cycle = await earningCycleApi.current();
console.log(cycle);
// Expected: { cycle: {...}, daysRemaining: 21, ... }

// Initiate prepared cycle
const initiated = await earningCycleApi.initiate();
console.log(initiated);
// Expected: { success: true, cycle: {...} }

// Get prepared cycle
const prepared = await earningCycleApi.prepared();
console.log(prepared);
// Expected: { cycle: {...} } or null if none
```

### Test Referral API

```typescript
import { referralApi, referralBonusTiersApi } from '@/api/api';

// Get my code and connections
const code = await referralApi.myCode();
console.log(code);
// Expected: { referralCode: 'REF...', validConnections: 5 }

// Get my connections
const connections = await referralApi.myConnections();
console.log(connections);
// Expected: [{ user: {...}, status: 'verified'|'pending' }, ...]

// Check bonus eligibility
const bonus = await referralApi.bonusEligibility();
console.log(bonus);
// Expected: { tier: {...}, bonusAmount: 50 } or null

// List active tiers
const tiers = await referralBonusTiersApi.list();
console.log(tiers);
// Expected: { tiers: [...] }
```

### Test Task API

```typescript
import { taskApi } from '@/api/api';

// Get available tasks
const tasks = await taskApi.available();
console.log(tasks);
// Expected: { tasks: [...], activeCycle: true, dailyEarning: 5.00, completedToday: false }

// Complete a task
const completed = await taskApi.complete(1);
console.log(completed);
// Expected: { success: true, rewardAmount: 5.00, walletNewBalance: 105.00, cycleBalance: 95.00 }

// Try second task same day
const second = await taskApi.complete(2);
console.log(second);
// Expected: { success: false, message: 'Already earned 5% today' }
```

### Test Withdrawal API

```typescript
import { transactionApi } from '@/api/api';

// Try withdrawal with insufficient connections
const result = await transactionApi.withdraw({
  amount: 50,
  payment_method: 'paypal'
});
console.log(result);
// Expected (if < 5 connections): { success: false, message: 'You need at least 5 valid connections. You have X/5.' }

// After getting 5 connections
const success = await transactionApi.withdraw({
  amount: 50,
  payment_method: 'paypal'
});
console.log(success);
// Expected: { success: true, transaction: {...} }
```

---

## Browser DevTools Checks

### 1. Verify Referral Code in Profile

```javascript
// In browser console after login
const { data } = await supabase.from('profiles').select('referral_code, connection_count').eq('id', (await supabase.auth.getUser()).data.user.id).single();
console.log(data);
// Should show: { referral_code: 'REF...', connection_count: N }
```

### 2. Check Active Cycle

```javascript
const { data } = await supabase.from('earning_cycles').select('*').eq('user_id', (await supabase.auth.getUser()).data.user.id).eq('status', 'active').single();
console.log(data);
// Should show cycle with start_date, end_date, current_balance, etc.
```

### 3. Verify Last Task Completion

```javascript
const { data } = await supabase.from('earning_cycles').select('last_task_completion_date').eq('user_id', (await supabase.auth.getUser()).data.user.id).eq('status', 'active').single();
console.log(data?.last_task_completion_date);
// Should show TODAY's date after task completion
```

---

## Troubleshooting Commands

### Reset User for Testing

```sql
-- Delete all cycles for user
DELETE FROM public.earning_cycles WHERE user_id = 'user_id_uuid'::uuid;

-- Reset balance
UPDATE public.profiles SET balance = 0, total_earned = 0 WHERE id = 'user_id_uuid'::uuid;

-- Delete transactions
DELETE FROM public.transactions WHERE user_id = 'user_id_uuid'::uuid;

-- Reset connections
DELETE FROM public.referral_connections WHERE referrer_id = 'user_id_uuid'::uuid;
UPDATE public.profiles SET connection_count = 0 WHERE id = 'user_id_uuid'::uuid;
```

### Check Function Logs

```bash
# View edge function logs
supabase functions list
supabase functions get process-transaction
supabase edge-runtime logs
```

### Verify RLS Policies

```sql
-- Check RLS is enabled
SELECT * FROM pg_tables WHERE tablename IN ('earning_cycles', 'referral_connections', 'referral_bonus_tiers');

-- View policies
SELECT * FROM pg_policies WHERE tablename = 'earning_cycles';
```

---

## Performance Testing

### Load Test Cycle Creation

```bash
# Using curl in loop
for i in {1..100}; do
  curl -X POST https://your_supabase_url/functions/v1/process-transaction \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"transaction_id":"test_'$i'","user_id":"test_user"}'
  sleep 0.1
done
```

### Monitor Database Connections

```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'postgres';
```

---

## Monitoring Queries

### Daily Active Cycles

```sql
SELECT COUNT(*) as active_cycles 
FROM public.earning_cycles 
WHERE status = 'active';
```

### Referral Connections Breakdown

```sql
SELECT 
  MIN(connection_count) as min_connections,
  MAX(connection_count) as max_connections,
  AVG(connection_count) as avg_connections,
  COUNT(*) as users_with_referrals
FROM public.profiles
WHERE connection_count > 0;
```

### Recent Task Completions

```sql
SELECT 
  DATE(ec.last_task_completion_date) as date,
  COUNT(*) as tasks_completed
FROM public.earning_cycles ec
WHERE ec.last_task_completion_date IS NOT NULL
GROUP BY DATE(ec.last_task_completion_date)
ORDER BY date DESC
LIMIT 7;
```

---

**Version:** 1.0  
**Last Updated:** May 7, 2026
