import { useState } from 'react';
import { notificationApi } from '@/api/api';
import { toast } from 'sonner';
import { Bell, Send, Users, Mail, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminNotifications() {
  const [tab, setTab] = useState('broadcast');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  const [sending, setSending] = useState(false);

  const handleBroadcast = async () => {
    if (!title || !message) { toast.error('Title and message required'); return; }
    setSending(true);
    try {
      await notificationApi.broadcast({ title, message, type: 'info', send_email: sendEmail });
      toast.success('Broadcast sent'); setTitle(''); setMessage('');
    } catch (err: any) { toast.error(err.message); }
    setSending(false);
  };

  const handleSendToUser = async () => {
    if (!userId || !title || !message) { toast.error('User ID, title and message required'); return; }
    setSending(true);
    try {
      await notificationApi.sendToUser({ user_id: parseInt(userId), title, message, type: 'info', send_email: sendEmail });
      toast.success('Notification sent'); setUserId(''); setTitle(''); setMessage('');
    } catch (err: any) { toast.error(err.message); }
    setSending(false);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Bell className="w-6 h-6" /> Notifications</h1>
        <p className="text-gray-400 text-sm">Send notifications to users</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-[#14192A]">
          <TabsTrigger value="broadcast" className="data-[state=active]:bg-[#F6FF2E] data-[state=active]:text-[#0A0C10]"><Users className="w-4 h-4 mr-1" /> Broadcast</TabsTrigger>
          <TabsTrigger value="single" className="data-[state=active]:bg-[#F6FF2E] data-[state=active]:text-[#0A0C10]"><MessageSquare className="w-4 h-4 mr-1" /> Single User</TabsTrigger>
        </TabsList>

        <TabsContent value="broadcast">
          <div className="bg-[#14192A] rounded-xl p-6 border border-white/5 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-400/10 flex items-center justify-center"><Send className="w-5 h-5 text-blue-400" /></div>
              <div><h3 className="font-semibold text-white">Broadcast Message</h3><p className="text-xs text-gray-400">Send to all active users</p></div>
            </div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title" className="bg-[#0A0C10] border-white/10 text-white" />
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message content" rows={4} className="w-full rounded-md bg-[#0A0C10] border border-white/10 text-white p-3 text-sm" />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-400 flex items-center gap-1"><Mail className="w-4 h-4" /> Also send via email</span>
            </label>
            <Button onClick={handleBroadcast} disabled={sending} className="w-full bg-[#F6FF2E] text-[#0A0C10]">
              <Send className="w-4 h-4 mr-2" /> {sending ? 'Sending...' : 'Broadcast to All Users'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="single">
          <div className="bg-[#14192A] rounded-xl p-6 border border-white/5 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-400/10 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-purple-400" /></div>
              <div><h3 className="font-semibold text-white">Send to User</h3><p className="text-xs text-gray-400">Target a specific user</p></div>
            </div>
            <Input type="number" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User ID" className="bg-[#0A0C10] border-white/10 text-white" />
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title" className="bg-[#0A0C10] border-white/10 text-white" />
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message content" rows={4} className="w-full rounded-md bg-[#0A0C10] border border-white/10 text-white p-3 text-sm" />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-400 flex items-center gap-1"><Mail className="w-4 h-4" /> Also send via email</span>
            </label>
            <Button onClick={handleSendToUser} disabled={sending} className="w-full bg-[#F6FF2E] text-[#0A0C10]">
              <Send className="w-4 h-4 mr-2" /> {sending ? 'Sending...' : 'Send Notification'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
