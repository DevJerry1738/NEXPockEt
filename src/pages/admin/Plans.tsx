import { useEffect, useState } from 'react';
import { planApi } from '@/api/api';
import { toast } from 'sonner';
import { Plus, BarChart3, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function AdminPlans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', daily_task_limit: '', daily_earning_cap: '', duration: '30', duration_unit: 'days', features: '', color: '#F6FF2E' });

  const fetchPlans = async () => {
    try { const res = await planApi.adminList(); setPlans(res.plans || []); }
    catch (err: any) { toast.error(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleSubmit = async () => {
    if (!form.name) { toast.error('Name required'); return; }
    try {
      const data = { ...form, price: parseFloat(form.price) || 0, daily_task_limit: parseInt(form.daily_task_limit) || 0, daily_earning_cap: parseFloat(form.daily_earning_cap) || 0, duration: parseInt(form.duration) || 30, features: form.features.split('\n') };
      if (editing) { await planApi.update(editing.id, data); toast.success('Updated'); }
      else { await planApi.create(data); toast.success('Created'); }
      setDialogOpen(false); setEditing(null); fetchPlans();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this plan?')) return;
    try { await planApi.delete(id); toast.success('Deleted'); fetchPlans(); }
    catch (err: any) { toast.error(err.message); }
  };

  const openEdit = (plan: any) => {
    setEditing(plan);
    setForm({ name: plan.name, description: plan.description || '', price: plan.price.toString(), daily_task_limit: plan.daily_task_limit.toString(), daily_earning_cap: plan.daily_earning_cap.toString(), duration: plan.duration.toString(), duration_unit: plan.duration_unit, features: Array.isArray(plan.features) ? plan.features.join('\n') : plan.features || '', color: plan.color || '#F6FF2E' });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><BarChart3 className="w-6 h-6" /> Plans</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); setForm({ name: '', description: '', price: '', daily_task_limit: '', daily_earning_cap: '', duration: '30', duration_unit: 'days', features: '', color: '#F6FF2E' }); }}
              className="bg-[#F6FF2E] text-[#0A0C10] hover:bg-[#e5ef2a]"><Plus className="w-4 h-4 mr-1" /> Add Plan</Button>
          </DialogTrigger>
          <DialogContent className="bg-[#14192A] border-white/10 text-white max-w-lg">
            <DialogHeader><DialogTitle>{editing ? 'Edit Plan' : 'Create Plan'}</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-4">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Plan name" className="bg-[#0A0C10] border-white/10 text-white" />
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="bg-[#0A0C10] border-white/10 text-white" />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Price ($)" className="bg-[#0A0C10] border-white/10 text-white" />
                <Input type="number" value={form.daily_task_limit} onChange={(e) => setForm({ ...form, daily_task_limit: e.target.value })} placeholder="Daily tasks" className="bg-[#0A0C10] border-white/10 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" value={form.daily_earning_cap} onChange={(e) => setForm({ ...form, daily_earning_cap: e.target.value })} placeholder="Daily cap ($)" className="bg-[#0A0C10] border-white/10 text-white" />
                <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="Duration" className="bg-[#0A0C10] border-white/10 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.duration_unit} onChange={(e) => setForm({ ...form, duration_unit: e.target.value })} className="h-10 rounded-md bg-[#0A0C10] border border-white/10 text-white px-3 text-sm">
                  <option value="days">Days</option><option value="months">Months</option>
                </select>
                <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Color (#hex)" className="bg-[#0A0C10] border-white/10 text-white" />
              </div>
              <textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="Features (one per line)" rows={3} className="w-full rounded-md bg-[#0A0C10] border border-white/10 text-white p-3 text-sm" />
              <Button onClick={handleSubmit} className="w-full bg-[#F6FF2E] text-[#0A0C10]">{editing ? 'Update' : 'Create'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-[#14192A] rounded-xl p-5 border border-white/5 hover:border-white/10 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: plan.color + '20' }}>
                <BarChart3 className="w-5 h-5" style={{ color: plan.color }} />
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => openEdit(plan)} className="h-7 px-2 text-amber-400"><Pencil className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(plan.id)} className="h-7 px-2 text-red-400"><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-white">{plan.name}</h3>
            <p className="text-sm text-gray-400 mt-1">{plan.description}</p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-400">Price</span><span className="text-white font-medium">${parseFloat(plan.price).toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Daily Tasks</span><span className="text-white">{plan.daily_task_limit}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Daily Cap</span><span className="text-white">${parseFloat(plan.daily_earning_cap).toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Duration</span><span className="text-white">{plan.duration} {plan.duration_unit}</span></div>
            </div>
            {Array.isArray(plan.features) && plan.features.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5">
                {plan.features.map((f: string, i: number) => (
                  <p key={i} className="text-xs text-gray-400 flex items-center gap-1"><span style={{ color: plan.color }}>*</span> {f}</p>
                ))}
              </div>
            )}
          </div>
        ))}
        {plans.length === 0 && <p className="col-span-full text-center text-gray-500 py-10">No plans created</p>}
      </div>
    </div>
  );
}
