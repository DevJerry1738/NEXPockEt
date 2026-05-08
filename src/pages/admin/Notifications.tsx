import { useState, useEffect } from 'react';
import { notificationApi } from '@/api/api';
import { toast } from 'sonner';
import { Bell, Send, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const NOTIF_TYPES = [
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
];

export default function AdminNotifications() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [sending, setSending] = useState(false);

  const handleBroadcast = async () => {
    if (!title || !message) { toast.error('Title and message required'); return; }
    setSending(true);
    try {
      await notificationApi.broadcast({ title, message, type });
      toast.success('Broadcast sent'); setTitle(''); setMessage(''); setType('info');
    } catch (err: any) { toast.error(err.message); }
    setSending(false);
  };


  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number|null>(null);

  const fetchBroadcasts = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.broadcastList();
      setBroadcasts(res.broadcasts || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load broadcasts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBroadcasts(); }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this broadcast notification for all users?')) return;
    setDeletingId(id);
    try {
      await notificationApi.broadcastDelete(id);
      setBroadcasts(broadcasts => broadcasts.filter(b => b.id !== id));
      toast.success('Broadcast deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete broadcast');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Bell className="w-6 h-6" /> Notifications</h1>
        <p className="text-gray-400 text-sm">Send broadcast notifications to all users</p>
      </div>

      <div className="bg-[#14192A] rounded-xl p-6 border border-white/5 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-blue-400/10 flex items-center justify-center"><Send className="w-5 h-5 text-blue-400" /></div>
          <div><h3 className="font-semibold text-white">Broadcast Message</h3><p className="text-xs text-gray-400">Send to all active users</p></div>
        </div>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title" className="bg-[#0A0C10] border-white/10 text-white" />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message content" rows={4} className="w-full rounded-md bg-[#0A0C10] border border-white/10 text-white p-3 text-sm" />
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Type:</span>
          <select value={type} onChange={e => setType(e.target.value)} className="bg-[#0A0C10] border border-white/10 text-white rounded px-2 py-1">
            {NOTIF_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <Button onClick={handleBroadcast} disabled={sending} className="w-full bg-[#F6FF2E] text-[#0A0C10]">
          <Send className="w-4 h-4 mr-2" /> {sending ? 'Sending...' : 'Broadcast to All Users'}
        </Button>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-white mb-2">Broadcast Archive</h2>
        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : broadcasts.length === 0 ? (
          <div className="text-gray-400">No broadcasts sent yet.</div>
        ) : (
          <div className="space-y-3">
            {broadcasts.map(b => (
              <div key={b.id} className="bg-[#14192A] border border-white/10 rounded-lg p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium text-white">{b.title}</div>
                  <div className="text-gray-400 text-sm mt-1">{b.message}</div>
                  <div className="text-xs text-gray-500 mt-1">{new Date(b.created_at).toLocaleString()} &middot; <span className="capitalize">{b.type}</span></div>
                </div>
                <Button
                  onClick={() => handleDelete(b.id)}
                  disabled={deletingId === b.id}
                  variant="ghost"
                  className="text-red-400 hover:bg-red-400/10"
                >
                  {deletingId === b.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
