import { useEffect, useState } from 'react';
import { referralBonusTiersApi } from '@/api/api';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminReferralBonusTiers() {
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    min_connections: '',
    max_connections: '',
    bonus_amount: '',
    bonus_type: 'fixed',
    is_active: true,
  });

  const fetchTiers = async () => {
    try {
      const res = await referralBonusTiersApi.adminList();
      setTiers(res.tiers || []);
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTiers();
  }, []);

  const handleSubmit = async () => {
    if (!form.min_connections) {
      toast.error('Min connections required');
      return;
    }
    if (!form.bonus_amount) {
      toast.error('Bonus amount required');
      return;
    }

    try {
      const data = {
        min_connections: parseInt(form.min_connections),
        max_connections: form.max_connections ? parseInt(form.max_connections) : null,
        bonus_amount: parseFloat(form.bonus_amount),
        bonus_type: form.bonus_type,
        is_active: form.is_active,
      };

      if (editing) {
        await referralBonusTiersApi.update(editing.id, data);
        toast.success('Tier updated');
      } else {
        await referralBonusTiersApi.create(data);
        toast.success('Tier created');
      }
      setDialogOpen(false);
      setEditing(null);
      setForm({
        min_connections: '',
        max_connections: '',
        bonus_amount: '',
        bonus_type: 'fixed',
        is_active: true,
      });
      fetchTiers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tier? Users may not qualify for bonuses.')) return;
    try {
      await referralBonusTiersApi.delete(id);
      toast.success('Tier deleted');
      fetchTiers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openEdit = (tier: any) => {
    setEditing(tier);
    setForm({
      min_connections: tier.min_connections.toString(),
      max_connections: tier.max_connections?.toString() || '',
      bonus_amount: tier.bonus_amount.toString(),
      bonus_type: tier.bonus_type,
      is_active: tier.is_active,
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      min_connections: '',
      max_connections: '',
      bonus_amount: '',
      bonus_type: 'fixed',
      is_active: true,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gift className="w-8 h-8 text-[#F6FF2E]" />
          <div>
            <h1 className="text-3xl font-bold">Referral Bonus Tiers</h1>
            <p className="text-gray-400 mt-1">Configure bonus tiers based on referral connection count</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="gap-2 bg-[#F6FF2E] text-black hover:bg-[#F6FF2E]/90">
              <Plus className="w-4 h-4" />
              New Tier
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1f35] border-white/10">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Tier' : 'Create New Tier'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Minimum Connections *</Label>
                <Input
                  type="number"
                  value={form.min_connections}
                  onChange={(e) => setForm({ ...form, min_connections: e.target.value })}
                  placeholder="e.g., 5"
                  className="mt-1 bg-[#0A0C10] border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Maximum Connections (leave empty for unlimited)</Label>
                <Input
                  type="number"
                  value={form.max_connections}
                  onChange={(e) => setForm({ ...form, max_connections: e.target.value })}
                  placeholder="e.g., 9 (or leave blank)"
                  className="mt-1 bg-[#0A0C10] border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Bonus Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.bonus_amount}
                  onChange={(e) => setForm({ ...form, bonus_amount: e.target.value })}
                  placeholder="e.g., 50.00 or 10"
                  className="mt-1 bg-[#0A0C10] border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Bonus Type *</Label>
                <Select value={form.bonus_type} onValueChange={(value) => setForm({ ...form, bonus_type: value })}>
                  <SelectTrigger className="mt-1 bg-[#0A0C10] border-white/10 text-white">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1f35] border-white/10">
                    <SelectItem value="fixed" className="text-white">Fixed Amount ($)</SelectItem>
                    <SelectItem value="percentage" className="text-white">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300">Active</Label>
                <Select value={form.is_active ? 'yes' : 'no'} onValueChange={(value) => setForm({ ...form, is_active: value === 'yes' })}>
                  <SelectTrigger className="mt-1 bg-[#0A0C10] border-white/10 text-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1f35] border-white/10">
                    <SelectItem value="yes" className="text-white">Yes</SelectItem>
                    <SelectItem value="no" className="text-white">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmit} className="w-full gap-2 bg-[#F6FF2E] text-black hover:bg-[#F6FF2E]/90">
                {editing ? 'Update Tier' : 'Create Tier'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : tiers.length === 0 ? (
        <Card className="bg-[#1a1f35] border-white/10">
          <CardContent className="text-center py-12 text-gray-400">
            No bonus tiers configured. Create one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Min Connections</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Max Connections</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Bonus Amount</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Type</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Status</th>
                <th className="text-right py-3 px-4 text-gray-300 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier, index) => (
                <tr key={tier.id} className={`border-b border-white/5 ${index % 2 === 0 ? 'bg-white/2' : ''} hover:bg-white/5 transition-colors`}>
                  <td className="py-3 px-4 text-white font-medium">{tier.min_connections}</td>
                  <td className="py-3 px-4 text-gray-300">{tier.max_connections || '∞ (Unlimited)'}</td>
                  <td className="py-3 px-4 text-[#F6FF2E] font-semibold">
                    {tier.bonus_type === 'fixed' ? `$${tier.bonus_amount.toFixed(2)}` : `${tier.bonus_amount}%`}
                  </td>
                  <td className="py-3 px-4 text-gray-300">{tier.bonus_type === 'fixed' ? 'Fixed' : 'Percentage'}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${tier.is_active ? 'bg-green-400/20 text-green-300' : 'bg-gray-400/20 text-gray-300'}`}>
                      {tier.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(tier)}
                        className="p-2 hover:bg-blue-400/20 text-blue-300 rounded transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tier.id)}
                        className="p-2 hover:bg-red-400/20 text-red-300 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Card className="bg-[#1a1f35] border-white/10">
        <CardHeader>
          <CardTitle className="text-lg">How Bonus Tiers Work</CardTitle>
          <CardDescription>Information for administrators</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-300">
          <p>
            • <strong>Min Connections:</strong> The minimum number of valid referral connections required to qualify for this tier's bonus.
          </p>
          <p>
            • <strong>Max Connections:</strong> Leave blank for unlimited. If set, this tier applies only to users with referral count within the range.
          </p>
          <p>
            • <strong>Bonus Type:</strong> Fixed amount ($) or percentage of user's balance.
          </p>
          <p>
            • <strong>Active:</strong> Only active tiers are visible to users and applied to their accounts.
          </p>
          <p>
            • Users automatically qualify for the highest applicable tier based on their valid connection count.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
