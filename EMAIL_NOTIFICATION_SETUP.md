# Email Notification Implementation - Setup & Deployment Guide

## Files Created

### 1. Email Templates
- **`supabase/functions/email-templates.ts`** ✅
  - Templates for admin notifications (deposit & withdrawal)
  - Templates for user confirmations (approval & rejection)
  - Simple, clean HTML email designs
  - Supports custom branding via environment variables

### 2. Edge Functions
- **`supabase/functions/send-admin-notification/index.ts`** ✅
  - Triggered when user submits deposit/withdrawal
  - Sends admin notification with transaction details and dashboard link
  - Graceful error handling (logs failures but doesn't block transaction)

- **`supabase/functions/send-user-notification/index.ts`** ✅
  - Triggered when admin approves or rejects transaction
  - Sends approval or rejection confirmation to user
  - Includes rejection reason if provided
  - Graceful error handling

### 3. Database Migration
- **`supabase/migrations/00009_email_notifications_log.sql`** ✅
  - Email notifications log table for tracking delivery
  - Indexes for efficient querying
  - RLS policies (admins can view, service role can insert/update)

### 4. Modified Files
- **`src/api/api.ts`** ✅
  - Updated `transactionApi.deposit()` - calls `send-admin-notification` after creation
  - Updated `transactionApi.withdraw()` - calls `send-admin-notification` after creation
  - Both wrapped in try-catch for graceful error handling

- **`supabase/functions/process-transaction/index.ts`** ✅
  - Added user notification logic after transaction status update
  - Calls `send-user-notification` on approval/rejection
  - Graceful error handling

---

## Setup Instructions

### Step 1: Configure Resend

1. Go to [resend.com](https://resend.com) and create an account
2. Verify your custom domain (recommended) or use default
3. Generate API key from dashboard
4. Note the sending email address (e.g., `noreply@yourdomain.com`)

### Step 2: Add Supabase Secrets

Configure these environment variables in your Supabase project:

#### Via Supabase Dashboard:
1. Go to Project Settings → Secrets
2. Add these secrets:
   - **`RESEND_API_KEY`** = Your Resend API key
   - **`ADMIN_EMAIL_ADDRESS`** = Admin email (e.g., `admin@example.com`)
   - **`RESEND_FROM_EMAIL`** = Sending email (e.g., `noreply@yourdomain.com`)
   - **`ADMIN_DASHBOARD_URL`** = Admin dashboard URL (e.g., `https://app.yoursite.com/admin`)
   - **`APP_URL`** = App URL (e.g., `https://app.yoursite.com`)

#### Via Supabase CLI:
```bash
supabase secrets set RESEND_API_KEY "your_resend_api_key"
supabase secrets set ADMIN_EMAIL_ADDRESS "admin@example.com"
supabase secrets set RESEND_FROM_EMAIL "noreply@yourdomain.com"
supabase secrets set ADMIN_DASHBOARD_URL "https://app.yoursite.com/admin"
supabase secrets set APP_URL "https://app.yoursite.com"
```

### Step 3: Deploy Database Migration

```bash
# Navigate to project root
cd c:\Users\jerem\Downloads\OKComputer_NEXPOCKET_MVP说明\app

# Push migration to Supabase
supabase db push
```

This creates the email_notifications_log table for tracking email delivery.

### Step 4: Deploy Edge Functions

```bash
# Deploy both email functions to Supabase
supabase functions deploy send-admin-notification --project-id your-project-id
supabase functions deploy send-user-notification --project-id your-project-id
```

Or deploy all functions:
```bash
supabase functions deploy --project-id your-project-id
```

---

## Testing Checklist

### Local Testing (Optional - with Supabase Emulator)
```bash
# Start Supabase local development
supabase start

# Serve functions locally
supabase functions serve

# Test deposit/withdrawal flow in browser dev tools console
# Monitor Deno output for logs
```

### Production Testing

- [ ] **Setup Verification**
  - Verify secrets are set: `supabase secrets list`
  - Verify Resend API key is active in Resend dashboard
  - Verify custom domain is verified in Resend (if using custom domain)

- [ ] **Admin Notification Test**
  - User creates deposit request in Wallet page
  - Check admin email within 30 seconds
  - Verify email contains:
    - Transaction ID
    - Amount
    - User name and email
    - Payment method
    - Link to admin dashboard
  - Verify email displays correctly (no rendering issues)

- [ ] **User Approval Notification Test**
  - Admin approves the transaction
  - Check user email within 30 seconds
  - Verify email contains:
    - "Request Approved" confirmation
    - Amount
    - Balance update message (for deposits)
    - Link to dashboard

- [ ] **User Rejection Notification Test**
  - Create another deposit/withdrawal request
  - Admin rejects with reason (e.g., "Invalid payment method")
  - Check user email within 30 seconds
  - Verify email contains:
    - "Request Could Not Be Processed" message
    - Amount
    - Rejection reason displayed

- [ ] **Error Handling Test**
  - Temporarily disable RESEND_API_KEY secret
  - User creates transaction → should succeed (email fails silently)
  - Check admin logs for email error
  - Re-enable secret and verify emails work again

---

## Monitoring

### View Email Logs
Query the email_notifications_log table:
```sql
-- View recent email sends
SELECT * FROM public.email_notifications_log 
ORDER BY created_at DESC 
LIMIT 20;

-- View failed emails
SELECT * FROM public.email_notifications_log 
WHERE status = 'failed' 
ORDER BY created_at DESC;

-- View by recipient
SELECT recipient_email, COUNT(*), 
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_count,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count
FROM public.email_notifications_log
GROUP BY recipient_email;
```

### Check Resend Dashboard
- Go to [resend.com/emails](https://resend.com/emails)
- View email delivery status
- Check bounce rates and spam complaints
- Verify domain authentication

### Logs in Supabase
- Edge function logs: Project → Logs → Functions
- Look for console.error() messages in send-admin-notification and send-user-notification

---

## Environment Variables Reference

| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| `RESEND_API_KEY` | ✅ Yes | `re_abc123...` | Resend API authentication |
| `ADMIN_EMAIL_ADDRESS` | ✅ Yes | `admin@company.com` | Recipient for admin notifications |
| `RESEND_FROM_EMAIL` | ✅ Yes | `noreply@yourdomain.com` | Sending email address |
| `ADMIN_DASHBOARD_URL` | ✅ Yes | `https://app.example.com/admin` | Link in admin emails |
| `APP_URL` | ✅ Yes | `https://app.example.com` | Link in user emails |

---

## Troubleshooting

### Issue: "RESEND_API_KEY not configured"
- **Solution:** Verify secret is set in Supabase: `supabase secrets list`
- Redeploy functions after adding secret: `supabase functions deploy`

### Issue: Emails not received by admin
- **Solution:** 
  - Verify `ADMIN_EMAIL_ADDRESS` is correct and exists
  - Check Resend dashboard for bounces/failures
  - Verify custom domain is verified (if using custom domain)
  - Check admin spam/promotions folder

### Issue: User emails not received
- **Solution:**
  - Verify user email in profiles table is correct
  - Check Resend dashboard for bounce rates
  - Verify from email address is verified

### Issue: Edge function errors in logs
- **Solution:**
  - Check Supabase function logs: Project → Logs → Functions
  - Look for console.error messages
  - Verify all required environment variables are set

### Issue: Transaction appears to fail when email fails
- **Solution:**
  - This should NOT happen (email failures are graceful)
  - Check that edge functions are wrapped in try-catch
  - Verify error handling in `send-admin-notification` and `send-user-notification`

---

## Future Enhancements

1. **Email Delivery Logging:**
   - Implement logging to `email_notifications_log` table in edge functions
   - Track which emails succeeded/failed

2. **Email Template Customization:**
   - Add admin settings to customize email branding (logo, colors)
   - Allow admins to add footer text/disclaimers

3. **Email Preferences:**
   - Allow users to toggle email notifications on/off
   - Store preferences in database

4. **Bulk Operations:**
   - Admin bulk approval/rejection with single email to user
   - Batch notifications for efficiency

5. **Email Analytics:**
   - Dashboard widget showing email stats
   - Track open rates via Resend webhook

6. **Scheduled Emails:**
   - Daily/weekly email digests to admin
   - Monthly transaction summaries to users

---

## Quick Start Checklist

- [ ] Create Resend account and generate API key
- [ ] Verify custom domain in Resend (optional but recommended)
- [ ] Set Supabase secrets (RESEND_API_KEY, ADMIN_EMAIL_ADDRESS, etc.)
- [ ] Run: `supabase db push` (deploy migration)
- [ ] Run: `supabase functions deploy` (deploy edge functions)
- [ ] Test admin notification (create deposit/withdrawal)
- [ ] Test user approval notification (admin approves)
- [ ] Test user rejection notification (admin rejects with reason)
- [ ] Monitor Resend dashboard for delivery status
- [ ] Done! 🎉

---

## Support & Questions

For issues:
1. Check the Troubleshooting section above
2. Review Supabase function logs: Project → Logs → Functions
3. Check Resend dashboard for email delivery status
4. Review error messages in browser console (F12)
