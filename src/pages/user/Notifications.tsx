import { useEffect, useState } from 'react';
import { notificationApi } from '@/api/api';
import { toast } from 'sonner';
import { Bell, Check, Trash2, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const typeIcons: any = { info: Info, success: CheckCircle, warning: AlertTriangle, error: XCircle };
const typeColors: any = { info: 'text-blue-400 bg-blue-400/10', success: 'text-green-400 bg-green-400/10', warning: 'text-amber-400 bg-amber-400/10', error: 'text-red-400 bg-red-400/10' };

export default function UserNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.my();
      setNotifications(res.notifications || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id?: number) => {
    try {
      await notificationApi.markRead(id);
      fetchNotifications();
    } catch { /* ignore */ }
  };

  const deleteNotif = async (id: number) => {
    try {
      await notificationApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch { /* ignore */ }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F6FF2E]" /></div>;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-gray-400 text-sm mt-1">{notifications.filter((n) => !n.is_read).length} unread</p>
        </div>
        {notifications.some((n) => !n.is_read) && (
          <Button onClick={() => markRead()} variant="outline" size="sm" className="border-white/10 hover:bg-white/5">
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
        return (
          <div key={notif.id} className={`bg-[#14192A] rounded-xl p-4 border transition-all ${notif.is_read ? 'border-white/5 opacity-70' : 'border-white/10'}`}>
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColors[notif.type] || typeColors.info}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{notif.title}</p>
                <p className="text-sm text-gray-400 mt-0.5">{notif.message}</p>
                <p className="text-xs text-gray-600 mt-2">{new Date(notif.created_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1">
                {!notif.is_read && (
                  <Button onClick={() => markRead(notif.id)} size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-[#F6FF2E]">
                    <Check className="w-4 h-4" />
                  </Button>
                )}
                <Button onClick={() => deleteNotif(notif.id)} size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-red-400">
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
