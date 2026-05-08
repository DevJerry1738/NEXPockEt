Plan: Earnings System Redesign — Deposit-Based Cycles with Referral Gating
TL;DR: Replace plan-based system with deposit-triggered 21-day earning cycles. Users earn 5% daily only when completing daily tasks (not automatic). No withdrawals during cycle. Withdraw requires 5+ valid referrals AND $50+ balance. Referral bonuses are tiered (5 unlock withdrawals, 10→$50, 15→$100) and admin-configurable. Plans system completely removed.

Steps
Phase 1: Database Foundation (5 migrations)
Create earning_cycles table (track user's 21-day earning periods, initial & current balance, days completed, last task completion date)
Create referral_connections table (link referrer → referred user, mark valid only after referred user's deposit approved)
Create referral_bonus_tiers table (admin-configurable: min/max connections, bonus amount; seed with defaults: 5→unlock, 10→$50, 15→$100)
Modify profiles table (add active_earning_cycle_id, connection_count for fast queries)
Extend transactions table (link to earning_cycle_id, mark if cycle-initiator)
Verification: Run migrations, verify schema.

Phase 2: Backend Business Logic (5 functions + API updates)
Parallel where independent:

Update process-transaction edge function: On deposit approval, create earning_cycle record (status=prepared, not yet active). Link transaction to it.
Create initiate-earning-cycle function: User calls to activate a prepared cycle. Validates no existing active cycle. Sets profiles.active_earning_cycle_id.
Update complete-task function:
Require active earning cycle (new validation)
Only earn 5% once per calendar day (check last_task_completion_date)
Calculate: new_balance = current_balance + (5% of current earning_cycle balance)
Remove all plan-based ROI logic + tier gating
Create cycle-completion checker: Daily job to mark cycles as completed when 21 days end. Auto-clear active_cycle_id.
Create referral-verification logic: When deposit approved, create referral_connections record, increment referrer's connection_count, check bonus tier eligibility.
Update API endpoints: Add /earning-cycles/initiate, /earning-cycles/current, /referral-connections, /referral-bonus-tiers (admin).
Verification: Test calculations (e.g., $50 + 5% daily × 21 = $102.50), referral bonus tier logic, daily earnings limits.

Phase 3: Frontend Registration & Dashboard (depends on Phase 1-2)
Parallel:

Update Register.tsx: Add optional "Referral Code" input. On signup, auto-generate unique referral_code for new user. Store referred_by.
Update Dashboard.tsx:
If no active cycle: Show "Start New Earning Cycle" button (calls /earning-cycles/initiate), referral summary (X/5 connections)
If cycle active: Show days remaining, initial/current balance, daily earning amount ($X), warning "Locked for withdrawal", today's task status
If cycle completed: Show final balance & earnings, "Start New Earning Cycle" button
Create src/pages/user/Referrals.tsx: Display user's referral code (copy button), list all referrals with name/date/deposit status/amount, connection count progress bar, bonus tier eligibility.
Phase 4: Frontend Tasks & Withdrawals (depends on Phase 3)
Parallel:

Update src/pages/user/Tasks.tsx: Remove tier filtering (all users see same tasks). Show "Complete any task today to earn 5% ($X) of wallet". Highlight if already completed today. Show toast on success: "Earned 5%! Return tomorrow for another 5%."
Update Wallet.tsx: Withdrawal eligibility checklist (✓ Balance >= $50, ✓ Connections >= 5, ✓ No active cycle). Disable withdraw button if any check fails; explain reason.
Phase 5: Admin Features & Cleanup
Parallel:

Admin Referral Bonus Configuration: Add section to admin settings/dashboard to view/add/edit referral bonus tiers. Real-time validation (e.g., "If user has 12 connections, eligible for $50").
Remove Plans System: Delete Plans.tsx and Plans.tsx. Remove Plans navigation links. Remove plan-related API calls from api.ts.
Phase 6: Documentation & Launch
Create EARNINGS_EXPLAINED.md: How earning cycles work, daily task → 5% earn, referral requirements, withdrawal flow.
Update README.md with system overview.
Add frontend tooltips/help text on Dashboard & Referrals pages.
Full end-to-end test: Signup → deposit → cycle start → task completion (verify 5%) → referral tracking → withdrawal eligibility.
Relevant Files
Migrations: supabase/migrations/00010_earning_cycles_system.sql, 00011_referral_connections_system.sql, 00012_referral_bonus_tiers.sql, 00013_profiles_earning_cycle_adjustments.sql, 00014_transactions_earning_cycle_link.sql
Edge Functions: index.ts, index.ts, supabase/functions/initiate-earning-cycle/index.ts (new), supabase/functions/verify-referral-connection/index.ts (new)
API: api.ts — add earning-cycles, referral-connections, referral-bonus-tiers endpoints
Pages: Register.tsx, Dashboard.tsx, Tasks.tsx, Wallet.tsx, Referrals.tsx (new), Plans.tsx (DELETE), Plans.tsx (DELETE)
Verification
Earning Calculation: Deposit $50, complete task daily for 21 days → Final balance = $102.50 (50 initial + 2.50 × 21 days)
Daily Limit: Complete 2+ tasks same day → Only 5% earned once (subsequent tasks don't earn)
Referral Validation: Sign up with referral code, deposit approved → Referrer sees 1 valid connection; after 5 valid connections, can withdraw
Bonus Tier: 10 valid referrals → $50 bonus available to claim
Withdrawal Gating: 3 checks (balance, connections, no active cycle) all enforced; disable button if any fail
New Cycle: After cycle 1 completes, user can initiate cycle 2 (user-triggered, not automatic)
Cycle Completion Auto-Check: After 21 days, cycle status changes to completed automatically
Decisions & Key Assumptions
Plans removed entirely: All UI pages, database tables, RPC functions deleted (not archived)
Daily earning is task-gated: 5% only accrues if user completes ≥1 task per calendar day; no auto-earning
All funds locked during cycle: Users cannot withdraw initial or earned funds until cycle ends
Referral bonus claim flow: Manual claim (not auto-applied) for transparency; appear claimable once tier met
New cycle is user-initiated: Button on dashboard after cycle completion; no automatic restart
Referral bonus is admin-configurable: Tiers can be added/edited/deleted via admin panel anytime
Daily limit resets per calendar day (not earning cycle day)
Further Considerations
Bonus Tier Auto-Claim vs. Manual: Should $50 bonus auto-add to balance when user reaches 10 connections, or require manual "Claim Bonus" button? Recommendation: Manual claim (more user control + transparent; users see bonus pending and choose when to receive).

Early Withdrawal / Pause Cycle: Can user pause or cancel an active earning cycle mid-way? Recommendation: Not in MVP (keep simple); user can just stop completing tasks to stop earning.

Email Notifications: Should users get emails on cycle start, daily reminder, cycle completion, referral bonus earned? Recommendation: Yes, especially cycle start/end to help user track timeline.

