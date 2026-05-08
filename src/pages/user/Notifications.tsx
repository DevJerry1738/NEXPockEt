import { useEffect, useState, useRef } from 'react';
import { notificationApi } from '@/api/api';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Bell, Check, Trash2, Info, CheckCircle, AlertTriangle, XCircle, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';

const typeIcons: any = { info: Info, success: CheckCircle, warning: AlertTriangle, error: XCircle };
const typeColors: any = {
  info: 'text-blue-400 bg-blue-400/10',
  success: 'text-green-400 bg-green-400/10',
  warning: 'text-amber-400 bg-amber-400/10',
  error: 'text-red-400 bg-red-400/10',
};

export default function UserNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<any>(null);

  const isBroadcast = (n: any) => n.user_id === null || n.user_id === undefined;

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.my();
      // Only show notifications that exist (not deleted)
      setNotifications((res.notifications || []).filter(n => n));
    } catch (err: any) {
      toast.error(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('user:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications();
      })
      .subscribe();
    channelRef.current = channel;
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  // Mark a single notification as read.
  // Personal → DB update. Broadcast → optimistic state only (shared row, can't update per-user).
  const markRead = async (notif: any) => {
    if (notif.is_read) return;
    // Optimistic update first
    setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, is_read: true } : n));
    if (!isBroadcast(notif)) {
      const res = await notificationApi.markRead(notif.id);
      if (!res.success) {
        // Rollback
        setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, is_read: false } : n));
        toast.error('Could not mark as read. Please try again.');
      }
    }
  };

  // Mark all unread as read.
  const markAllRead = async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    // DB: only personal notifications are updated (broadcasts are already handled client-side)
    const res = await notificationApi.markRead();
    if (!res.success) {
      // Re-fetch to restore true state
      fetchNotifications();
      toast.error('Could not mark all as read. Please try again.');
    }
  };

  // Delete a notification.
  // Personal → DB delete + optimistic remove. Broadcast → optimistic remove only.
  const deleteNotif = async (notif: any) => {
    // Optimistic remove immediately
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    if (!isBroadcast(notif)) {
      const res = await notificationApi.delete(notif.id);
      if (!res.success) {
        // Restore — re-fetch to get the real list back
        fetchNotifications();
        toast.error('Could not delete notification. Please try again.');
      }
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F6FF2E]" />
    </div>
  );

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-gray-400 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllRead} variant="outline" size="sm" className="border-white/10 hover:bg-white/5 text-gray-300">
            <Check className="w-4 h-4 mr-1" /> Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 && (
        <div className="bg-[#14192A] rounded-xl p-8 border border-white/5 text-center">
          <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No notifications yet</p>
        </div>
      )}

      {notifications.map((notif) => {
        const Icon = typeIcons[notif.type] || Info;
        const broadcast = isBroadcast(notif);
        return (
          <div
            key={notif.id}
            className={`bg-[#14192A] rounded-xl p-4 border transition-all ${
              notif.is_read ? 'border-white/5 opacity-60' : 'border-white/10'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColors[notif.type] || typeColors.info}`}>
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-white">{notif.title}</p>
                  {!notif.is_read && (
                    <span className="inline-block w-2 h-2 rounded-full bg-[#F6FF2E] flex-shrink-0" />
                  )}
                  {broadcast && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 bg-blue-400/10 rounded px-1.5 py-0.5">
                      <Radio className="w-2.5 h-2.5" /> Broadcast
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-0.5">{notif.message}</p>
                <p className="text-xs text-gray-600 mt-2">{new Date(notif.created_at).toLocaleString()}</p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {!notif.is_read && (
                  <Button
                    onClick={() => markRead(notif)}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-[#F6FF2E]"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  onClick={() => deleteNotif(notif)}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-400"
                  title={broadcast ? 'Dismiss' : 'Delete'}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
