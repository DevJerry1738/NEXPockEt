import { useEffect, useState } from 'react';
import { adminApi } from '@/api/api';
import { toast } from 'sonner';
import {
  Users, Search, Lock, Ban, CheckCircle, ToggleLeft, ToggleRight, UserCheck, UserX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      const res = await adminApi.users(`?${params.toString()}`);
      setUsers(res.users || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [status]);

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await adminApi.updateUser(id, { status: newStatus });
      toast.success(`User ${newStatus}`);
      fetchUsers();
    } catch (err: any) { toast.error(err.message); }
  };

  const toggleWithdrawal = async (id: number, enabled: boolean) => {
    try {
      await adminApi.toggleWithdrawal(id, !enabled);
      toast.success(`Withdrawal ${!enabled ? 'enabled' : 'disabled'}`);
      fetchUsers();
    } catch (err: any) { toast.error(err.message); }
  };

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { toast.error('Password must be 6+ characters'); return; }
    try {
      await adminApi.resetPassword(selectedUser.id, newPassword);
      toast.success('Password reset successfully');
      setNewPassword(''); setSelectedUser(null);
    } catch (err: any) { toast.error(err.message); }
  };

  const statusIcons: any = {
    active: <CheckCircle className="w-4 h-4 text-green-400" />,
    suspended: <UserX className="w-4 h-4 text-amber-400" />,
    banned: <Ban className="w-4 h-4 text-red-400" />,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Users className="w-6 h-6" /> Users</h1>
          <p className="text-gray-400 text-sm">{users.length} total users</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            placeholder="Search by name or email..." className="pl-10 bg-[#14192A] border-white/10 text-white" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-md bg-[#14192A] border border-white/10 text-white px-3 text-sm">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      <div className="bg-[#14192A] rounded-xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F6FF2E]" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left p-3 text-xs font-medium text-gray-400">User</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-400">Plan</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-400">Balance</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-400">Status</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-400">KYC</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-400">Withdraw</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="p-3">
                      <div>
                        <p className="text-sm font-medium text-white">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-400">{u.plan_name || 'Free'}</td>
                    <td className="p-3 text-sm font-medium text-white">${parseFloat(u.balance).toFixed(2)}</td>
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-xs">
                        {statusIcons[u.status]} <span className="capitalize text-gray-300">{u.status}</span>
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs capitalize ${u.kyc_status === 'verified' ? 'text-green-400' : u.kyc_status === 'pending' ? 'text-amber-400' : 'text-gray-400'}`}>
                        {u.kyc_status}
                      </span>
                    </td>
                    <td className="p-3">
                      <button onClick={() => toggleWithdrawal(u.id, u.withdrawal_enabled)} className="flex items-center gap-1">
                        {u.withdrawal_enabled ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5 text-red-400" />}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {u.status === 'active' ? (
                          <Button size="sm" variant="ghost" onClick={() => updateStatus(u.id, 'suspended')} className="h-7 px-2 text-amber-400 hover:text-amber-300">
                            <UserX className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => updateStatus(u.id, 'active')} className="h-7 px-2 text-green-400 hover:text-green-300">
                            <UserCheck className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost" onClick={() => setSelectedUser(u)} className="h-7 px-2 text-blue-400 hover:text-blue-300">
                              <Lock className="w-3.5 h-3.5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-[#14192A] border-white/10 text-white">
                            <DialogHeader><DialogTitle>Reset Password for {selectedUser?.name}</DialogTitle></DialogHeader>
                            <div className="space-y-4 pt-4">
                              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="New password (min 6 chars)" className="bg-[#0A0C10] border-white/10 text-white" />
                              <Button onClick={resetPassword} className="w-full bg-[#F6FF2E] text-[#0A0C10]">Reset Password</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <p className="p-6 text-center text-gray-500 text-sm">No users found</p>}
          </div>
        )}
      </div>
    </div>
  );
}
