# NEXPocket Earnings System - Documentation & Testing Guide

## 📋 System Overview

NEXPocket has been redesigned from a **plan-based ROI system** to a **deposit-triggered 21-day earning cycle system** where users earn **5% daily (only on task completion)** with comprehensive referral bonuses.

### Key Differences from Old System
| Aspect | Old System | New System |
|--------|-----------|-----------|
| **Entry** | Purchase plan ($0-$150) | Deposit minimum ($50) |
| **Earning Model** | Daily ROI % varies by plan | Fixed 5% of cycle balance per day |
| **Earning Trigger** | Automatic based on plan tier | Must complete ≥1 task daily |
| **Lock Period** | Plan expires (30 days) | 21-day cycle lock |
| **Withdrawal Lock** | Immediate after earning | Locked during active cycle |
| **Referral Bonus** | Fixed $5 per referral | Tiered: 5→unlock, 10→$50, 15→$100 |
| **Bonus Gating** | None | Requires 5+ valid connections |

---

## 🎯 User Workflows

### Workflow 1: New User Registration & Deposit

**Steps:**
1. User registers with optional referral code
2. User completes KYC verification
3. User makes deposit ($50+)
4. Admin approves deposit
5. User's profile gets earning cycle (status=prepared)
6. User clicks "Start Earning Cycle"
7. Cycle activates (status=active), 21-day timer begins

**Expected Behavior:**
- ✅ Referral code stored in profile if provided
- ✅ Referral connection created on deposit approval (if referred_by exists)
- ✅ Cycle created with status="prepared"
- ✅ Button appears on Dashboard to activate cycle
- ✅ Tasks dashboard shows "Make a deposit first" message until cycle starts

**Test Data:**
- Referrer: Create user with referral code "REF12345678"
- Referred: Register using that code
- Both should see connection after deposit approval

---

### Workflow 2: Daily Task Completion & 5% Earning

**Steps:**
1. User has active earning cycle
2. User completes first task of the day
3. System calculates 5% of current cycle balance
4. Reward applied to user balance & cycle balance
5. User cannot earn again until tomorrow

**Expected Behavior:**
- ✅ Tasks unavailable if no active cycle ("No active earning cycle")
- ✅ Task completion returns: `rewardAmount`, `walletNewBalance`, `cycleBalance`
- ✅ Toast shows: "Earned $X.XX!"
- ✅ Second task same day shows: "Already earned 5% today"
- ✅ Next calendar day: Can earn again

**Test Data:**
- Cycle balance: $1000
- First task completion: Should earn $50 (5% × $1000)
- If $50 earned and spent elsewhere, earning $25 tomorrow (5% × $500 remaining)

**Edge Case Tests:**
- Complete task at 23:59, then at 00:01 next day → Should earn twice
- Complete task, wait 1 hour, try again → Should show "Already earned" error
- Complete task with $10 balance → Earn $0.50

---

### Workflow 3: Referral Bonus Eligibility

**Steps:**
1. User builds 5 valid connections (referred users deposit + approve)
2. System auto-qualifies for unlock referral bonus tier
3. User can view bonus in Referrals page
4. When cycle completes, bonus can be claimed or auto-applied

**Expected Behavior:**
- ✅ Connection count incremented on referred user's deposit approval
- ✅ Referrals page shows connection count with progress bar
- ✅ Bonus tier table shows: "(5 connections) → Unlocks Withdrawals"
- ✅ At 10 connections: Shows "$50 bonus available"
- ✅ At 15+ connections: Shows "$100 bonus available"

**Test Data:**
- Create user A
- Create 5 users (B-F) referring A
- Approve all 5 deposits
- User A should see: "5/5 connections" + "Unlocks Withdrawals" badge
- Create user G referring A, approve deposit
- User A should see: "6/5 connections" + "$50 bonus available" badge

---

### Workflow 4: Withdrawal Eligibility & Gate

**Steps:**
1. User attempts withdrawal
2. System checks 3 criteria:
   - Balance ≥ $50
   - No active earning cycle
   - Valid connections ≥ 5
3. If all pass → Create withdrawal transaction
4. If any fails → Show friendly error message

**Expected Behavior:**
- ✅ Error: "Minimum withdrawal balance is $50"
- ✅ Error: "Cannot withdraw while earning cycle is active"
- ✅ Error: "You need at least 5 valid connections. You have {count}/5."
- ✅ Success: Transaction created with status="pending"
- ✅ Wallet page shows eligibility checklist

**Test Data:**
- User with $30 balance → "Minimum $50" error
- User with $100, active cycle → "Active cycle" error
- User with $100, 3 connections → "Need 5 connections" error
- User with $100, 5 connections, no cycle → Success

---

### Workflow 5: Cycle Completion & Restart

**Steps:**
1. User in active cycle (day 21)
2. Cycle auto-completes (status → completed)
3. User sees completion message
4. User can start new cycle immediately
5. New cycle created, old one archived

**Expected Behavior:**
- ✅ Cycle ends exactly on day 21 (end_date = start_date + 21 days)
- ✅ Dashboard shows "Cycle Complete! Ready to start new cycle?"
- ✅ Button available to initiate new prepared cycle
- ✅ Old cycle remains in DB for audit trail
- ✅ New cycle starts fresh with current balance

**Test Data:**
- Create cycle with start_date = 21 days ago
- System should detect completion
- New cycle available for initiation

---

### Workflow 6: Admin Referral Bonus Tier Management

**Steps:**
1. Admin navigates to /admin/referral-bonus-tiers
2. Admin views current tiers (5, 10, 15 defaults)
3. Admin creates new tier: 20 connections → $150 bonus
4. Admin edits existing tier: 10→$75
5. Admin deactivates tier
6. Changes immediately visible to users

**Expected Behavior:**
- ✅ Table shows all tiers with actions (Edit, Delete)
- ✅ Form validates: min_connections < max_connections (if both set)
- ✅ Form validates: bonus_amount > 0
- ✅ Bonus type selectable: Fixed ($) or Percentage (%)
- ✅ Active/Inactive toggle works
- ✅ Changes propagate to user Referrals page instantly

**Test Data:**
- Create tier: min=25, max=null, amount=200, type=fixed, active=true
- Edit tier: min=10, max=14, amount=100, type=fixed, active=true
- Delete tier: Should warn "Users may not qualify for bonuses"

---

## 🧪 Testing Checklist

### Unit Tests (Database)

- [ ] `earning_cycles` RLS: Users can read/update own, admins manage all
- [ ] `referral_connections` RLS: Verified correctly on deposit approval
- [ ] `referral_bonus_tiers` seeding: 3 default tiers present and active
- [ ] Trigger `handle_new_user`: Generates unique `referral_code` format "REF{UUID}{4-digit}"
- [ ] Trigger `handle_new_user`: Resolves `referred_by` from metadata correctly

### Integration Tests (Edge Functions)

- [ ] **process-transaction**:
  - ✅ Creates earning_cycle (status=prepared) for deposits ≥$50
  - ✅ Rejects deposits <$50
  - ✅ Creates referral_connections if profile.referred_by exists
  - ✅ Increments referrer's connection_count
  - ✅ Links transaction to earning_cycle_id

- [ ] **complete-task**:
  - ✅ Returns error if no active earning cycle
  - ✅ Calculates 5% of current_balance correctly
  - ✅ Only awards once per calendar day
  - ✅ Updates earning_cycle.last_task_completion_date to today
  - ✅ Returns rewardAmount, walletNewBalance, cycleBalance
  - ✅ Returns "Already earned 5% today" on second attempt

- [ ] **initiate-earning-cycle**:
  - ✅ Activates prepared cycle (status → active)
  - ✅ Sets end_date = today + 21 days
  - ✅ Updates profiles.active_earning_cycle_id
  - ✅ Returns cycle id, dates, initialBalance, daysRemaining=21
  - ✅ Errors if no prepared cycle exists
  - ✅ Errors if active cycle already exists

### API Tests (src/api/api.ts)

- [ ] **earningCycleApi.current()**: Returns active cycle or null
- [ ] **earningCycleApi.initiate()**: Calls edge function, updates state
- [ ] **earningCycleApi.prepared()**: Returns prepared cycle
- [ ] **referralApi.myCode()**: Returns referral_code & connection count
- [ ] **referralApi.myConnections()**: Returns verified/pending referrals
- [ ] **referralApi.bonusEligibility()**: Returns applicable tier
- [ ] **referralBonusTiersApi.list()**: Returns active tiers only
- [ ] **referralBonusTiersApi.adminList()**: Returns all tiers
- [ ] **referralBonusTiersApi.create()**: Creates new tier
- [ ] **referralBonusTiersApi.update()**: Updates tier
- [ ] **referralBonusTiersApi.delete()**: Deletes tier
- [ ] **taskApi.available()**: Shows error if no cycle, correct dailyEarning calc
- [ ] **taskApi.complete()**: Handles reward and daily limit
- [ ] **transactionApi.withdraw()**: Validates all 3 criteria before creating tx

### Frontend Tests (User Pages)

**Register.tsx:**
- [ ] Referral code input appears and is optional
- [ ] Code validated before signup
- [ ] Success modal shows referral code info
- [ ] Auto-redirect to login after 5 seconds

**Dashboard.tsx:**
- [ ] Shows earning cycle card if active (balance, days remaining, daily earning)
- [ ] Shows "Start Your Earning Cycle" button if prepared cycle exists
- [ ] Shows "Make deposit first" alert if no cycle
- [ ] Quick action buttons: Tasks (disabled if no cycle), Wallet, Referrals
- [ ] Referral summary shows connection count & progress bar
- [ ] Recent transactions display working

**Tasks.tsx:**
- [ ] "No active earning cycle" message if no cycle, link to wallet
- [ ] "Complete any task to earn $X" card shows 5% of cycle balance
- [ ] After task completion: "Already earned 5% today"
- [ ] Task buttons disabled after daily earning
- [ ] Bonus tasks section shows separately
- [ ] Toast shows reward amount on completion

**Referrals.tsx:**
- [ ] Your referral code displayed with copy button
- [ ] Share button works (navigator.share or clipboard fallback)
- [ ] Referrals list shows: name, date, Verified/Pending status
- [ ] Bonus tiers table shows all active tiers
- [ ] Connection count with progress bar (X/5)
- [ ] Eligible bonus highlighted in green
- [ ] Not eligible bonus shown in amber with "Need X more"

**Wallet.tsx:**
- [ ] Withdrawal eligibility checklist shows 3 criteria
- [ ] Button disabled if any criteria unmet
- [ ] Error messages match API responses
- [ ] Transaction history displays correctly

### Frontend Tests (Admin Pages)

**AdminReferralBonusTiers.tsx:**
- [ ] Table displays all tiers
- [ ] Create button opens dialog with empty form
- [ ] Edit button populates form with tier data
- [ ] Form validates: min_connections required
- [ ] Form validates: bonus_amount required
- [ ] Bonus type selector works (Fixed/Percentage)
- [ ] Active toggle works
- [ ] Delete confirms before removing
- [ ] Changes persist after page reload

---

## 🚀 End-to-End Test Scenarios

### Scenario A: Complete User Lifecycle (No Referrals)

**Duration:** ~30 minutes

1. **Register User A** (no referral code)
   - Go to /register
   - Fill form (name, email, password)
   - Click Register
   - Verify: Redirected to login, success modal shown

2. **Login as User A**
   - Go to /login
   - Enter credentials
   - Click Login
   - Verify: Dashboard loaded, "KYC Required" alert shown

3. **Complete KYC**
   - Click "Verify Now"
   - Upload documents
   - Admin approves
   - Verify: "KYC Verified" badge appears

4. **Make Deposit**
   - Click Wallet → Deposit
   - Select payment method
   - Enter $100
   - Submit
   - Admin approves
   - Verify: Balance shows $100, "Start Earning Cycle" button appears

5. **Activate Cycle**
   - Click "Start Earning Cycle" button
   - Verify: Dashboard now shows earning cycle card with:
     - Initial: $100
     - Current: $100
     - Daily Earning: $5.00 (if completed)
     - Days Remaining: 21

6. **Complete Task**
   - Click Tasks button
   - Select any task
   - Click Complete
   - Verify: Toast shows "Earned $5.00!"
   - Balance is now $105
   - Cycle balance is now $95
   - Button shows "Already Completed Today"

7. **Next Day Test** (simulate by time-shifting if possible)
   - Try to complete another task
   - Verify: Can earn again, second daily earning appears

8. **Wait for Cycle to Complete** (21 days)
   - After 21 days
   - Verify: Dashboard shows "Cycle Complete"
   - New cycle can be initiated

9. **Withdrawal Test**
   - Click Wallet → Withdraw
   - Verify: Success (no referral gating needed for solo test, or need to check business logic)
   - Enter $50
   - Verify: Transaction created and visible in history

---

### Scenario B: Referral System Complete Flow

**Duration:** ~45 minutes

1. **Create User A (Referrer)**
   - Register User A (email: alice@test.com)
   - Complete KYC
   - Deposit $100
   - Activate earning cycle

2. **Get User A's Referral Code**
   - Go to Referrals page
   - Copy referral code (e.g., "REF123abc1234")

3. **Create Users B, C, D, E, F (Referred)**
   - For each user (i=1 to 5):
     - Register with referral code from User A
     - Complete KYC
     - Deposit $50+
     - Admin approves each deposit

4. **Verify Connections**
   - User A's Dashboard:
     - Referral Summary: "5/5 connections"
     - Progress bar at 100%
     - Bonus: "Unlocks Withdrawal" (green badge)
   - User A Referrals page:
     - All 5 referrals listed with "Verified" badge
     - 0 pending

5. **Test Withdrawal Gating**
   - User A: Balance $100, 5 connections, no active cycle
   - Try withdrawal: Should succeed
   - Verify: Transaction created

6. **Create 6th Referral (User G)**
   - Register User G with User A's code
   - Complete KYC
   - Deposit $50
   - Admin approves
   - User A now has 6 connections

7. **Verify Bonus Eligibility**
   - User A Referrals page:
     - Connection count: "6/5"
     - Bonus status: "$50 bonus available" (green card)

8. **Test Admin Tier Configuration**
   - Admin goes to /admin/referral-bonus-tiers
   - Create new tier: min=20, bonus=$500, type=fixed, active=true
   - Edit tier: min=10, change bonus from $50 to $75
   - Create Users H-O (total 8 new users) referring User A
   - User A now has 14 connections
   - Verify User A Referrals page shows: "$75 bonus available" (updated amount)

---

### Scenario C: Edge Cases & Error Handling

**Duration:** ~20 minutes

1. **Insufficient Balance for Withdrawal**
   - New user deposits $30
   - Try to withdraw $50
   - Verify: Error "Minimum withdrawal balance is $50"

2. **Active Cycle Prevents Withdrawal**
   - User in active cycle, $100 balance, 5 connections
   - Try to withdraw $50
   - Verify: Error "Cannot withdraw while earning cycle is active"

3. **Insufficient Connections for Withdrawal**
   - User with completed cycle, $100 balance, 3 connections
   - Try to withdraw $50
   - Verify: Error "You need at least 5 valid connections. You have 3/5."

4. **Daily Earning Limit**
   - Complete task at 23:55
   - Try to complete another task at 23:57
   - Verify: Error "Already earned 5% today"
   - Wait until next day (00:01)
   - Try again
   - Verify: Can earn again

5. **No Active Cycle for Task**
   - New user without deposit
   - Try to view tasks
   - Verify: "No active earning cycle" error
   - Try to access /tasks directly
   - Verify: Same error or redirect to dashboard

6. **Referral Code Validation**
   - Register with invalid code "BADCODE"
   - Verify: Error "Referral code not found"
   - Register with valid code
   - Verify: Success, connection created after deposit approval

7. **Multiple Deposits by Same User**
   - User makes deposit $50 (cycle created)
   - User makes another deposit $50 while cycle prepared
   - Verify: First cycle remains in prepared state, new deposit creates separate transaction
   - After initiating first cycle, second deposit should not auto-create cycle (only on first approval)

8. **Tier Deletion During Active Bonuses**
   - User has 10 connections, eligible for $50 bonus
   - Admin deletes the tier
   - Verify: User Referrals page updates, bonus no longer shown
   - Admin re-creates tier
   - Verify: Bonus reappears

---

## 📊 Data Validation Tests

### Database Integrity

- [ ] earning_cycles.initial_balance = initial deposit amount
- [ ] earning_cycles.current_balance ≤ initial_balance (only decreases via withdrawals)
- [ ] earning_cycles.current_balance increases via task rewards
- [ ] earning_cycles.last_task_completion_date is today's date after task completion
- [ ] earning_cycles.end_date = start_date + 21 days (exactly)
- [ ] referral_connections.is_valid = true only after referred user's deposit approved
- [ ] profiles.connection_count = COUNT(referral_connections WHERE is_valid=true AND referrer_id=user_id)
- [ ] profiles.active_earning_cycle_id points to active cycle or is NULL
- [ ] transactions.earning_cycle_id populated for deposit/withdrawal txs
- [ ] transactions.is_cycle_initiator = true only for initial deposit that creates cycle

### Calculation Verification

- [ ] Daily earning = cycle.current_balance × 0.05 (correctly calculated to 2 decimals)
- [ ] User balance updated: new_balance = old_balance + daily_earning
- [ ] Cycle balance updated: new_balance = old_balance - daily_earning (locked funds)
- [ ] Cycle days remaining = (end_date - today).days
- [ ] Bonus eligibility: Lowest min_connections tier where user.connection_count >= min

### Time-Based Tests

- [ ] Task completion at 23:59 Dec 31 → Next earning at 00:01 Jan 1
- [ ] Cycle end detection: end_date < today triggers completion
- [ ] Cycle age: (today - start_date).days shows in UI

---

## 📝 Deployment Checklist

Before going live, verify:

- [ ] All 6 database migrations applied to production
- [ ] Edge functions deployed and tested
- [ ] API endpoints wired and responding
- [ ] Frontend builds without errors
- [ ] Admin referral bonus tier page is accessible
- [ ] All UI pages render correctly
- [ ] No console errors in browser dev tools
- [ ] Mobile responsiveness tested (Tasks, Referrals, Wallet on mobile)
- [ ] KYC verification flow works end-to-end
- [ ] Email notifications sent on deposit approval
- [ ] Admin dashboard shows transaction approvals
- [ ] Referral code generation creates unique codes
- [ ] No broken links in navigation

---

## 🐛 Troubleshooting Guide

### "No active earning cycle" error when trying to complete tasks

**Diagnosis:**
- User deposited but didn't activate cycle, OR
- Cycle was completed (status=completed) and not restarted

**Fix:**
- Guide user to Wallet to make deposit if needed
- Guide user to Dashboard to click "Start Earning Cycle" button
- If cycle completed, user can initiate new cycle immediately

### Referral connections not creating on deposit approval

**Diagnosis:**
- process-transaction function not called, OR
- profiles.referred_by is NULL, OR
- RLS policy blocking connection insert

**Fix:**
- Verify admin is using proper deposit approval flow
- Check that referred user's referral code was resolved during signup
- Verify RLS policy: CREATE on referral_connections requires user to be referrer or admin

### Withdrawal always fails with "5 connections" error

**Diagnosis:**
- connection_count calculation wrong, OR
- Only counting unverified connections, OR
- Multiple connections not aggregated

**Fix:**
- Check: `SELECT COUNT(*) FROM referral_connections WHERE referrer_id=user_id AND is_valid=true`
- Verify each referred user has one VALID connection
- Ensure is_valid is set to true after deposit approval

### User can earn 5% twice in same day

**Diagnosis:**
- last_task_completion_date not updated to today, OR
- Date comparison is wrong (storing timestamp instead of date)

**Fix:**
- Verify complete-task function sets: `last_task_completion_date = NOW()::date`
- Check that comparison is: `last_task_completion_date = today()` not `≠ today()`

### Admin tier changes not visible to users

**Diagnosis:**
- referralBonusTiersApi.list() caching old results, OR
- is_active filter not working, OR
- User page not refreshing API data

**Fix:**
- Clear browser cache or hard refresh (Ctrl+Shift+R)
- Verify is_active = true in database for tier
- Try navigating away from Referrals page and back
- Check browser console for API errors

---

## 📞 Support Notes

### Common Questions

**Q: Can a user start a new earning cycle immediately after the previous one completes?**
A: Yes. After 21 days, cycle status → completed, but user can immediately click "Start New Cycle" button on Dashboard. This creates a new prepared cycle.

**Q: If a user doesn't complete any tasks, does 5% still earn?**
A: No. Earning accrues only on task completion. Inactivity = no earnings that day (but no penalty either).

**Q: Can referral bonuses be claimed mid-cycle?**
A: Current design: Bonuses are viewable but typically claimed after cycle completion or on-demand. (Can be enhanced later to auto-apply.)

**Q: What happens if a user's balance drops below $50 mid-cycle?**
A: Cycle continues, but withdrawal is blocked until balance ≥ $50 again (via more task earnings).

**Q: If a referred user's deposit is rejected, is the connection created?**
A: No. Connection is created only when deposit status → approved. If rejected, connection is never created.

---

**Version:** 1.0  
**Last Updated:** May 7, 2026  
**System:** NEXPocket Earnings System v2.0
