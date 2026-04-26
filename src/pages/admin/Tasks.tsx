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
  const [form, setForm] = useState({ title: '', description: '', type: 'click', reward: '', url: '', duration: '30', max_completions: '1000' });

  const fetchTasks = async () => {
    try {
      const res = await taskApi.adminList();
      setTasks(res.tasks || []);
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleSubmit = async () => {
    if (!form.title || !form.reward) { toast.error('Title and reward required'); return; }
    try {
      const data = { ...form, reward: parseFloat(form.reward), duration: parseInt(form.duration), max_completions: parseInt(form.max_completions) };
      if (editing) {
        await taskApi.update(editing.id, data);
        toast.success('Task updated');
      } else {
        await taskApi.create(data);
        toast.success('Task created');
      }
      setDialogOpen(false); setEditing(null);
      setForm({ title: '', description: '', type: 'click', reward: '', url: '', duration: '30', max_completions: '1000' });
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
      title: task.title, description: task.description || '', type: task.type,
      reward: task.reward.toString(), url: task.url || '', duration: task.duration.toString(),
      max_completions: task.max_completions.toString(),
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><ListChecks className="w-6 h-6" /> Tasks</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); setForm({ title: '', description: '', type: 'click', reward: '', url: '', duration: '30', max_completions: '1000' }); }}
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
                <Input type="number" value={form.reward} onChange={(e) => setForm({ ...form, reward: e.target.value })} placeholder="Reward ($)" className="bg-[#0A0C10] border-white/10 text-white" />
              </div>
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="URL (optional)" className="bg-[#0A0C10] border-white/10 text-white" />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="Duration (sec)" className="bg-[#0A0C10] border-white/10 text-white" />
                <Input type="number" value={form.max_completions} onChange={(e) => setForm({ ...form, max_completions: e.target.value })} placeholder="Max completions" className="bg-[#0A0C10] border-white/10 text-white" />
              </div>
              <Button onClick={handleSubmit} className="w-full bg-[#F6FF2E] text-[#0A0C10]">{editing ? 'Update' : 'Create'}</Button>
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
                <th className="text-left p-3 text-xs font-medium text-gray-400">Type</th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">Reward</th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">Done</th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">Status</th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02]">
                    <td className="p-3 text-sm text-white">{t.title}</td>
                    <td className="p-3 text-xs text-gray-400 capitalize">{t.type}</td>
                    <td className="p-3 text-sm font-medium text-[#F6FF2E]">${parseFloat(t.reward).toFixed(2)}</td>
                    <td className="p-3 text-xs text-gray-400">{t.completions}/{t.max_completions}</td>
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
