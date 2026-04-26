import { useEffect, useState } from 'react';
import { bonusTaskApi } from '@/api/api';
import { toast } from 'sonner';
import { Plus, Gift, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function AdminBonusTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', reward: '', start_time: '', end_time: '', max_completions: '100' });

  const fetchTasks = async () => {
    try { const res = await bonusTaskApi.adminList(); setTasks(res.bonus_tasks || []); }
    catch (err: any) { toast.error(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.reward) { toast.error('Title and reward required'); return; }
    try {
      await bonusTaskApi.create({
        title: form.title, description: form.description,
        reward: parseFloat(form.reward), max_completions: parseInt(form.max_completions),
        start_time: form.start_time || new Date().toISOString(),
        end_time: form.end_time || new Date(Date.now() + 86400000).toISOString(),
      });
      toast.success('Bonus task created and users notified');
      setDialogOpen(false);
      setForm({ title: '', description: '', reward: '', start_time: '', end_time: '', max_completions: '100' });
      fetchTasks();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleToggle = async (id: number, current: string) => {
    try {
      await bonusTaskApi.toggle(id, current === 'active' ? 'inactive' : 'active');
      toast.success('Status updated'); fetchTasks();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this bonus task?')) return;
    try { await bonusTaskApi.delete(id); toast.success('Deleted'); fetchTasks(); }
    catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Gift className="w-6 h-6 text-[#F6FF2E]" /> Bonus Tasks</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#F6FF2E] text-[#0A0C10] hover:bg-[#e5ef2a]"><Plus className="w-4 h-4 mr-1" /> Create Bonus</Button>
          </DialogTrigger>
          <DialogContent className="bg-[#14192A] border-white/10 text-white">
            <DialogHeader><DialogTitle>Create Bonus Task</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-4">
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="bg-[#0A0C10] border-white/10 text-white" />
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="bg-[#0A0C10] border-white/10 text-white" />
              <Input type="number" value={form.reward} onChange={(e) => setForm({ ...form, reward: e.target.value })} placeholder="Reward ($)" className="bg-[#0A0C10] border-white/10 text-white" />
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-400">Start</label><Input type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="bg-[#0A0C10] border-white/10 text-white" /></div>
                <div><label className="text-xs text-gray-400">End</label><Input type="datetime-local" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="bg-[#0A0C10] border-white/10 text-white" /></div>
              </div>
              <Input type="number" value={form.max_completions} onChange={(e) => setForm({ ...form, max_completions: e.target.value })} placeholder="Max completions" className="bg-[#0A0C10] border-white/10 text-white" />
              <Button onClick={handleCreate} className="w-full bg-[#F6FF2E] text-[#0A0C10]">Create & Notify Users</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-[#14192A] rounded-xl border border-white/5 overflow-hidden">
        {loading ? <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F6FF2E]" /></div> :
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/5">
                <th className="text-left p-3 text-xs font-medium text-gray-400">Title</th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">Reward</th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">Window</th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">Progress</th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">Status</th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02]">
                    <td className="p-3 text-sm text-white">{t.title}</td>
                    <td className="p-3 text-sm font-medium text-[#F6FF2E]">${parseFloat(t.reward).toFixed(2)}</td>
                    <td className="p-3 text-xs text-gray-400">
                      {new Date(t.start_time).toLocaleDateString()} - {new Date(t.end_time).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-xs text-gray-400">{t.current_completions}/{t.max_completions}</td>
                    <td className="p-3">
                      <button onClick={() => handleToggle(t.id, t.status)}>
                        {t.status === 'active' ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                      </button>
                    </td>
                    <td className="p-3">
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(t.id)} className="h-7 px-2 text-red-400"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tasks.length === 0 && <p className="p-6 text-center text-gray-500 text-sm">No bonus tasks</p>}
          </div>
        }
      </div>
    </div>
  );
}
