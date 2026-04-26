import { useState, useEffect } from 'react';
import { paymentApi } from '@/api/api';
import { toast } from 'sonner';
import { CreditCard, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type PaymentField = { label: string; value: string };

const emptyForm = { name: '', type: 'both', min_amount: '1', max_amount: '100000', fields: [] as PaymentField[] };

export default function AdminPayments() {
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<typeof emptyForm>({ ...emptyForm });

  const fetchMethods = async () => {
    try {
      const res = await paymentApi.adminList();
      setMethods(res.methods || []);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMethods(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, fields: [] });
    setDialogOpen(true);
  };

  const openEdit = (m: any) => {
    setEditing(m);
    setForm({
      name: m.name,
      type: m.type || 'both',
      min_amount: String(m.min_amount || '1'),
      max_amount: String(m.max_amount || '100000'),
      fields: Array.isArray(m.fields) ? m.fields : [],
    });
    setDialogOpen(true);
  };

  const addField = () => setForm((f) => ({ ...f, fields: [...f.fields, { label: '', value: '' }] }));

  const removeField = (i: number) =>
    setForm((f) => ({ ...f, fields: f.fields.filter((_, idx) => idx !== i) }));

  const updateField = (i: number, key: 'label' | 'value', val: string) =>
    setForm((f) => {
      const fields = [...f.fields];
      fields[i] = { ...fields[i], [key]: val };
      return { ...f, fields };
    });

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Method name required'); return; }
    const payload = {
      name: form.name.trim(),
      type: form.type,
      min_amount: parseFloat(form.min_amount) || 1,
      max_amount: parseFloat(form.max_amount) || 100000,
      fields: form.fields.filter((f) => f.label.trim() && f.value.trim()),
      is_active: true,
    };
    try {
      if (editing) {
        await paymentApi.update(editing.id, payload);
        toast.success('Payment method updated');
      } else {
        await paymentApi.create(payload);
        toast.success('Payment method created');
      }
      setDialogOpen(false);
      fetchMethods();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleToggle = async (id: number, currentActive: boolean) => {
    try {
      await paymentApi.toggle(id, !currentActive);
      toast.success(currentActive ? 'Disabled' : 'Enabled');
      fetchMethods();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this payment method?')) return;
    try { await paymentApi.delete(id); toast.success('Deleted'); fetchMethods(); }
    catch (err: any) { toast.error(err.message); }
  };

  const typeLabel: Record<string, string> = { deposit: 'Deposit only', withdrawal: 'Withdrawal only', both: 'Deposit & Withdrawal' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><CreditCard className="w-6 h-6" /> Payment Methods</h1>
          <p className="text-gray-400 text-sm mt-1">Configure deposit and withdrawal methods</p>
        </div>
        <Button onClick={openCreate} className="bg-[#F6FF2E] text-[#0A0C10] hover:bg-[#e5ef2a]">
          <Plus className="w-4 h-4 mr-1" /> Add Method
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F6FF2E]" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {methods.map((m) => (
            <div key={m.id} className="bg-[#14192A] rounded-xl p-5 border border-white/5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{m.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${m.type === 'deposit' ? 'bg-green-500/10 text-green-400' : m.type === 'withdrawal' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                    {typeLabel[m.type] || m.type}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleToggle(m.id, m.is_active)} title={m.is_active ? 'Disable' : 'Enable'}>
                    {m.is_active ? <ToggleRight className="w-6 h-6 text-green-400" /> : <ToggleLeft className="w-6 h-6 text-gray-500" />}
                  </button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(m)} className="h-7 px-2 text-amber-400 hover:text-amber-300"><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(m.id)} className="h-7 px-2 text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              <div className="flex gap-4 text-xs text-gray-500 mb-3">
                <span>Min: <span className="text-white">${m.min_amount}</span></span>
                <span>Max: <span className="text-white">${m.max_amount}</span></span>
              </div>
              {Array.isArray(m.fields) && m.fields.length > 0 && (
                <div className="space-y-1.5">
                  {m.fields.map((f: PaymentField, i: number) => (
                    <div key={i} className="flex justify-between text-xs bg-[#0A0C10] rounded px-3 py-2">
                      <span className="text-gray-400">{f.label}</span>
                      <span className="text-white font-mono truncate ml-2 max-w-[160px]">{f.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {methods.length === 0 && <p className="col-span-full text-center text-gray-500 py-16">No payment methods yet. Click "Add Method" to create one.</p>}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#14192A] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Create'} Payment Method</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Method Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Crypto, CashApp, PayPal, Bank Transfer" className="bg-[#0A0C10] border-white/10 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full h-10 rounded-md bg-[#0A0C10] border border-white/10 text-white px-3 text-sm">
                  <option value="deposit">Deposit only</option>
                  <option value="withdrawal">Withdrawal only</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Min Amount ($)</label>
                <Input type="number" value={form.min_amount} onChange={(e) => setForm({ ...form, min_amount: e.target.value })}
                  className="bg-[#0A0C10] border-white/10 text-white" />
              </div>
            </div>

            {/* Dynamic Fields Builder */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-400">Payment Details (shown to users)</label>
                <Button size="sm" onClick={addField} variant="outline" className="h-7 text-xs border-white/10 text-gray-300 hover:bg-white/5">
                  <Plus className="w-3 h-3 mr-1" /> Add Field
                </Button>
              </div>
              <div className="space-y-2">
                {form.fields.length === 0 && (
                  <p className="text-xs text-gray-600 text-center py-3 border border-dashed border-white/10 rounded-lg">
                    No fields yet. Add fields like "Wallet Address", "Network", "Email", etc.
                  </p>
                )}
                {form.fields.map((field, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input value={field.label} onChange={(e) => updateField(i, 'label', e.target.value)}
                      placeholder="Label (e.g. Wallet Address)" className="bg-[#0A0C10] border-white/10 text-white text-xs flex-1" />
                    <Input value={field.value} onChange={(e) => updateField(i, 'value', e.target.value)}
                      placeholder="Value (e.g. 0xABC...)" className="bg-[#0A0C10] border-white/10 text-white text-xs flex-1" />
                    <button onClick={() => removeField(i)} className="text-red-400 hover:text-red-300 shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleSubmit} className="w-full bg-[#F6FF2E] text-[#0A0C10] hover:bg-[#e5ef2a] font-semibold">
              {editing ? 'Update Method' : 'Create Method'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
