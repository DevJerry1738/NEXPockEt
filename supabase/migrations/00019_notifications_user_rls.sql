-- Allow users to delete their own personal notifications.
-- Broadcast notifications (user_id IS NULL) are admin-managed and cannot be
-- deleted by individual users — they are handled client-side (optimistic UI).
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);
