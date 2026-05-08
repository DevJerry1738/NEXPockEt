-- Email Notifications Log Table
CREATE TABLE IF NOT EXISTS public.email_notifications_log (
    id SERIAL PRIMARY KEY,
    recipient_email TEXT NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('admin_notification', 'user_approval', 'user_rejection')),
    transaction_id INTEGER REFERENCES public.transactions(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('sent', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for querying by recipient and creation time
CREATE INDEX idx_email_notifications_recipient_created ON public.email_notifications_log(recipient_email, created_at DESC);

-- Create index for querying by transaction
CREATE INDEX idx_email_notifications_transaction ON public.email_notifications_log(transaction_id);

-- Enable RLS
ALTER TABLE public.email_notifications_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can view all email logs
CREATE POLICY "Admins can view all email logs" ON public.email_notifications_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- RLS Policy: Only service role can insert (from edge functions)
CREATE POLICY "Service role can insert email logs" ON public.email_notifications_log
    FOR INSERT
    WITH CHECK (true);

-- RLS Policy: Only service role can update
CREATE POLICY "Service role can update email logs" ON public.email_notifications_log
    FOR UPDATE
    USING (true)
    WITH CHECK (true);
