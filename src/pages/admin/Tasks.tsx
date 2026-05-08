import { useEffect, useState } from 'react';
import { taskApi } from '@/api/api';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ListChecks, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function AdminTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', description: '', type: 'click', reward: '0', url: '', duration: '30', max_completions: '1000', min_tier: '1' });

  const fetchTasks = async () => {
    try {
      const res = await taskApi.adminList();
      setTasks(res.tasks || []);
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleSubmit = async () => {
    if (!form.title) { toast.error('Title required'); return; }
    try {
      const data = { ...form, reward: parseFloat(form.reward) || 0, duration: parseInt(form.duration), max_completions: parseInt(form.max_completions), min_tier: parseInt(form.min_tier) };
      if (editing) {
        await taskApi.update(editing.id, data);
        toast.success('Task updated');
      } else {
        await taskApi.create(data);
        toast.success('Task created');
      }
      setDialogOpen(false); setEditing(null);
      setForm({ title: '', description: '', type: 'click', reward: '0', url: '', duration: '30', max_completions: '1000', min_tier: '1' });
      fetchTasks();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this task?')) return;
    try { await taskApi.delete(id); toast.success('Task deleted'); fetchTasks(); }
    catch (err: any) { toast.error(err.message); }
  };

  const openEdit = (task: any) => {
    setEditing(task);
    setForm({
      title: task.title, description: task.description || '', type: task.platform || 'click',
      reward: (task.reward || 0).toString(), url: task.url || '', duration: (task.duration || 30).toString(),
      max_completions: (task.max_completions || 1000).toString(),
      min_tier: (task.min_tier || 1).toString(),
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><ListChecks className="w-6 h-6" /> Tasks</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); setForm({ title: '', description: '', type: 'click', reward: '0', url: '', duration: '30', max_completions: '1000', min_tier: '1' }); }}
              className="bg-[#F6FF2E] text-[#0A0C10] hover:bg-[#e5ef2a]">
              <Plus className="w-4 h-4 mr-1" /> Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#14192A] border-white/10 text-white max-w-lg">
            <DialogHeader><DialogTitle>{editing ? 'Edit Task' : 'Create Task'}</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-4">
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Task title" className="bg-[#0A0C10] border-white/10 text-white" />
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="bg-[#0A0C10] border-white/10 text-white" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="h-10 rounded-md bg-[#0A0C10] border border-white/10 text-white px-3 text-sm">
                  <option value="click">Click</option><option value="survey">Survey</option><option value="signup">Signup</option>
                  <option value="social">Social</option><option value="video">Video</option><option value="app">App</option>
                </select>
                <div className="flex items-center gap-2 bg-[#0A0C10] border border-white/10 rounded-md px-3 text-sm">
                  <span className="text-gray-400">Min Tier:</span>
                  <select value={form.min_tier} onChange={(e) => setForm({ ...form, min_tier: e.target.value })} className="bg-transparent text-white outline-none w-full">
                    <option value="1">1 (Starter)</option><option value="2">2 (Basic)</option>
                    <option value="3">3 (Premium)</option><option value="4">4 (Elite)</option>
                  </select>
                </div>
              </div>
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="URL (optional)" className="bg-[#0A0C10] border-white/10 text-white" />
              <Button onClick={handleSubmit} className="w-full bg-[#F6FF2E] text-[#0A0C10] mt-2">{editing ? 'Update' : 'Create'}</Button>
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
                <th className="text-left p-3 text-xs font-medium text-gray-400">Platform/Type</th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">Min Tier</th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">Status</th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02]">
                    <td className="p-3 text-sm text-white">{t.title}</td>
                    <td className="p-3 text-xs text-gray-400 capitalize">{t.platform || t.type}</td>
                    <td className="p-3 text-sm font-medium text-[#F6FF2E]">Tier {t.min_tier || 1}</td>
                    <td className="p-3"><span className={`text-xs capitalize ${t.status === 'active' ? 'text-green-400' : 'text-gray-400'}`}>{t.status}</span></td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {t.url && t.url !== '#' && <a href={t.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4 text-blue-400" /></a>}
                        <Button size="sm" variant="ghost" onClick={() => openEdit(t)} className="h-7 px-2 text-amber-400"><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(t.id)} className="h-7 px-2 text-red-400"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tasks.length === 0 && <p className="p-6 text-center text-gray-500 text-sm">No tasks</p>}
          </div>
        }
      </div>
    </div>
  );
}
