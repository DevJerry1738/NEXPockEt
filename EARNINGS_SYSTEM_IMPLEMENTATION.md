# NEXPocket Earnings System - Implementation Summary

## 🎯 Overview

This document provides a high-level summary of the earnings system redesign from plan-based ROI to deposit-triggered 21-day earning cycles.

---

## 📦 What's New

### Core System Changes

1. **Deposit-Based Entry** → $50 minimum deposit triggers earning cycle creation (status=prepared)
2. **21-Day Cycles** → Fixed cycle duration instead of variable plan durations
3. **Fixed 5% Daily Earning** → 5% of current cycle balance per day (no plan-based ROI variation)
4. **Task-Gated Earning** → Earning accrues only on daily task completion (max 1x per calendar day)
5. **Withdrawal Gating** → Three criteria: balance ≥$50, no active cycle, ≥5 referrals
6. **Tiered Referral Bonuses** → Admin-configurable tiers (5→unlock, 10→$50, 15→$100)
7. **User-Initiated Cycles** → Users manually click "Start Earning Cycle", not automatic

---

## 🗄️ Database Schema Changes

### New Tables

| Table | Purpose | Key Columns |
|-------|---------|------------|
| `earning_cycles` | 21-day earning cycle tracking | id, user_id, initial_balance, current_balance, start_date, end_date, last_task_completion_date, days_completed, status (prepared\|active\|completed\|paused) |
| `referral_connections` | Referrer→Referred relationships | id, referrer_id, referred_user_id, referred_deposit_transaction_id, is_valid, connection_verified_at |
| `referral_bonus_tiers` | Admin-configurable bonus structure | id, min_connections, max_connections, bonus_amount, bonus_type (fixed\|percentage), is_active |

### Modified Tables

| Table | Changes |
|-------|---------|
| `profiles` | Added: `active_earning_cycle_id` (FK), `connection_count` (INT), `referred_by` (UUID) |
| `transactions` | Added: `earning_cycle_id` (FK), `is_cycle_initiator` (BOOLEAN) |

### Trigger Updates

| Trigger | Change |
|---------|--------|
| `handle_new_user` | Now generates unique `referral_code` (format: REF + UUID substring + 4-digit random) and resolves `referred_by` from auth metadata |

---

## 🔌 Backend API

### Edge Functions (Deno)

1. **`process-transaction`** (Updated)
   - Creates `earning_cycles` record (status=prepared) for deposits ≥$50
   - Validates minimum deposit amount
   - Creates `referral_connections` if user was referred
   - Increments referrer's `connection_count`
   - Links transaction to earning_cycle_id

2. **`complete-task`** (Completely Rewritten)
   - Validates active earning cycle exists (required)
   - Calculates 5% of cycle balance
   - Checks daily earning limit (max 1x per calendar day)
   - Updates cycle and profile balances
   - Returns: rewardAmount, walletNewBalance, cycleBalance

3. **`initiate-earning-cycle`** (New)
   - Activates prepared earning cycle
   - Sets status=active, calculates end_date (+21 days)
   - Updates `profiles.active_earning_cycle_id`
   - Returns cycle details and days remaining

### REST API Endpoints (src/api/api.ts)

**Earning Cycles:**
```typescript
earningCycleApi.current()          // Get active cycle or null
earningCycleApi.initiate()         // Activate prepared cycle
earningCycleApi.prepared()         // Get prepared cycle
```

**Referrals:**
```typescript
referralApi.myCode()               // Get referral code & connection count
referralApi.myConnections()        // List all referrals with status
referralApi.bonusEligibility()     // Check applicable bonus tier
```

**Admin Tier Management:**
```typescript
referralBonusTiersApi.list()       // Get active tiers only
referralBonusTiersApi.adminList()  // Get all tiers
referralBonusTiersApi.create()     // Create tier
referralBonusTiersApi.update()     // Update tier
referralBonusTiersApi.delete()     // Delete tier
```

**Updated Endpoints:**
```typescript
taskApi.available()                // Now checks for active cycle, returns dailyEarning
taskApi.complete(taskId)           // Returns rewardAmount, walletNewBalance
transactionApi.withdraw(data)      // Pre-validates all 3 withdrawal criteria
```

---

## 🎨 Frontend Pages

### User Pages

| Page | Status | Changes |
|------|--------|---------|
| [Register.tsx](src/pages/Register.tsx) | ✅ Updated | Added referral code input, success modal with referral info |
| [Dashboard.tsx](src/pages/user/Dashboard.tsx) | ✅ Rewritten | Shows earning cycle card, "Start Cycle" button, referral summary, quick actions |
| [Tasks.tsx](src/pages/user/Tasks.tsx) | ✅ Rewritten | Removed plan gating, added cycle requirement, daily earning card, once-per-day limit |
| [Referrals.tsx](src/pages/user/Referrals.tsx) | ✅ Created | Referral code display, connections list, bonus tiers, eligibility status |
| [Wallet.tsx](src/pages/user/Wallet.tsx) | ⏳ To Update | Add withdrawal eligibility checklist (validation already in API) |

### Admin Pages

| Page | Status | Changes |
|------|--------|---------|
| [ReferralBonusTiers.tsx](src/pages/admin/ReferralBonusTiers.tsx) | ✅ Created | Manage referral bonus tiers (create, edit, delete, toggle active) |

---

## 🔑 Key Features

### 1. Earning Cycle Lifecycle

```
Prepared (after deposit approval)
    ↓
User clicks "Start Cycle"
    ↓
Active (status=active, 21-day timer)
    ↓
User completes task daily → Earns 5% of current balance
    ↓
Day 21 reached → Completed (can restart immediately)
```

### 2. Daily 5% Earning Mechanism

- **Trigger:** Task completion (1x per calendar day max)
- **Calculation:** 5% of `earning_cycles.current_balance`
- **Updates:** 
  - `profiles.balance` += earned amount
  - `earning_cycles.current_balance` -= earned amount (locked in cycle)
  - `profiles.total_earned` += earned amount
- **Gating:** No earning if already earned today (checked via `last_task_completion_date`)

### 3. Withdrawal Three-Criteria Gate

Before transaction creation, verify:
1. **Balance** ≥ $50: `profiles.balance >= 50`
2. **No Active Cycle**: `profiles.active_earning_cycle_id IS NULL` OR cycle status ≠ 'active'
3. **Referral Connections** ≥ 5: `COUNT(referral_connections WHERE is_valid=true) >= 5`

If any fail → Return error message, don't create transaction

### 4. Referral Bonus Tiers

Default Configuration:
- **Tier 1:** 5 connections → Unlocks withdrawals (bonus_amount=0)
- **Tier 2:** 10 connections → $50 bonus (bonus_type=fixed)
- **Tier 3:** 15+ connections → $100 bonus (bonus_type=fixed)

Admin can:
- Create custom tiers with connection ranges
- Set fixed ($) or percentage (%) bonuses
- Activate/deactivate tiers dynamically

User sees:
- Highest applicable tier highlighted
- Connection progress bar
- Bonus amount if eligible

### 5. Referral System

**On Signup:**
- User provides optional referral code (e.g., "REF123abc1234")
- AuthContext resolves code to `referred_by` UUID
- Stored in auth metadata → trigger sets `profiles.referred_by`

**On Deposit Approval:**
- `process-transaction` creates `referral_connections` record
- Sets `is_valid=true` (connection verified)
- Increments referrer's `connection_count`
- Referrer can now withdraw if count ≥ 5

---

## ⚙️ Configuration & Defaults

### Database Seeding

After migration `00012`, these default tiers are created:

```sql
INSERT INTO referral_bonus_tiers VALUES
  (gen_random_uuid(), 5, 9, 0, 'fixed', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 10, 14, 50, 'fixed', true, NULL, NOW(), NOW()),
  (gen_random_uuid(), 15, NULL, 100, 'fixed', true, NULL, NOW(), NOW());
```

**Meaning:**
- 5-9 connections: Unlocks withdrawals (0 bonus, placeholder)
- 10-14 connections: $50 bonus
- 15+ connections: $100 bonus

### Constants & Limits

| Parameter | Value | Notes |
|-----------|-------|-------|
| Min Deposit | $50 | Enforced in process-transaction function |
| Earning % | 5% | Of current cycle balance per day |
| Cycle Duration | 21 days | end_date = start_date + 21 days |
| Daily Earning Limit | 1x per calendar day | Checked via last_task_completion_date |
| Min Referrals for Withdrawal | 5 valid connections | Tiered bonus unlocks at this threshold |
| Min Withdrawal Amount | $50 | Standard withdrawal minimum |

---

## 🚀 Deployment Steps

1. **Apply Migrations** (in order):
   - `00010_earning_cycles_system.sql`
   - `00011_referral_connections_system.sql`
   - `00012_referral_bonus_tiers.sql`
   - `00013_profiles_earning_cycle_adjustments.sql`
   - `00014_transactions_earning_cycle_link.sql`
   - `00015_referral_signup_enhancement.sql`

2. **Deploy Edge Functions:**
   - Update: `supabase/functions/process-transaction/index.ts`
   - Update: `supabase/functions/complete-task/index.ts`
   - Create: `supabase/functions/initiate-earning-cycle/index.ts`

3. **Build & Deploy Frontend:**
   ```bash
   npm run build
   # Deploy built artifacts to hosting
   ```

4. **Verify:**
   - Test deposit → cycle creation
   - Test task completion → 5% earning
   - Test referral code flow
   - Test withdrawal gating
   - Test admin tier management

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

- Daily active earning cycles (status=active count)
- Average cycle balance retention (current/initial)
- Daily task completion rate
- Referral connection creation rate
- Withdrawal success rate (by criteria failure reason)
- Admin tier configuration changes

### Audit Logs

All transaction approvals/rejections logged in:
- `audit_logs` table (via admin dashboard)
- `email_notifications_log` (user notifications)

### Potential Issues to Watch

1. **Task Earning Timing:** Ensure timezone handling correct for calendar day boundary
2. **Connection Count Accuracy:** Monitor for mismatches between connection records and profile count
3. **Cycle Auto-Completion:** Implement scheduled check for cycles reaching end_date
4. **Referral Bonus Calculation:** Verify tiers applied correctly when multiple overlapping ranges

---

## 🔄 Future Enhancements

Potential features not in MVP:

1. **Auto-Claim Referral Bonuses:** Instead of manual claim, auto-apply on meeting tier
2. **Cycle Pause Feature:** Allow users to temporarily pause earning without losing progress
3. **Partial Withdrawal:** Allow mid-cycle withdrawal with penalty (e.g., 10% fee)
4. **Performance Bonuses:** Extra earning for streak (e.g., +1% for 7-day task streak)
5. **Referral Commission for Admin:** Revenue share on referred user earnings
6. **Mobile App:** Native iOS/Android with push notifications
7. **Analytics Dashboard:** User stats on earnings, referrals, task performance

---

## 📞 Support & Troubleshooting

See [EARNINGS_SYSTEM_TESTING_GUIDE.md](EARNINGS_SYSTEM_TESTING_GUIDE.md) for:
- Complete testing checklist
- End-to-end scenarios
- Troubleshooting guide
- FAQ & common issues

---

**Version:** 1.0  
**Status:** ✅ Complete (Phase 1-5)  
**Testing:** 🚧 Phase 6 (In Progress)  
**Deployment Ready:** May 7, 2026
