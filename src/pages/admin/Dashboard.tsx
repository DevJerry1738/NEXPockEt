import { useEffect, useState } from 'react';
import { adminApi } from '@/api/api';
import { toast } from 'sonner';
import {
  Users, DollarSign, Clock, ShieldCheck, ListChecks, TrendingUp, Gift, BarChart3
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.dashboard().then((res) => {
      if (res.success) setStats(res.stats);
      setLoading(false);
    }).catch((err) => { toast.error(err.message); setLoading(false); });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F6FF2E]" /></div>;

  const cards = [
    { label: 'Total Users', value: stats.total_users || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Active Users', value: stats.active_users || 0, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Total Earnings', value: `$${(stats.total_earnings || 0).toFixed(2)}`, icon: DollarSign, color: 'text-[#F6FF2E]', bg: 'bg-[#F6FF2E]/10' },
    { label: 'Pending Deposits', value: stats.pending_deposits || 0, icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Pending Withdrawals', value: stats.pending_withdrawals || 0, icon: Clock, color: 'text-red-400', bg: 'bg-red-400/10' },
    { label: 'Pending KYC', value: stats.pending_kyc || 0, icon: ShieldCheck, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Active Tasks', value: stats.active_tasks || 0, icon: ListChecks, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    { label: 'Bonus Tasks', value: stats.active_bonus_tasks || 0, icon: Gift, color: 'text-pink-400', bg: 'bg-pink-400/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Platform overview and statistics</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-[#14192A] rounded-xl p-4 border border-white/5">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${c.bg} mb-3`}>
              <c.icon className={`w-5 h-5 ${c.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{c.value}</p>
            <p className="text-gray-400 text-xs mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#14192A] rounded-xl p-6 border border-white/5">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Manage Users', desc: 'View & edit users', href: '/admin/users' },
            { label: 'Review KYC', desc: `${stats.pending_kyc || 0} pending`, href: '/admin/kyc' },
            { label: 'Transactions', desc: 'Review deposits & withdrawals', href: '/admin/transactions' },
            { label: 'Settings', desc: 'Configure platform', href: '/admin/settings' },
          ].map((a) => (
            <a key={a.label} href={a.href} className="bg-[#0A0C10] rounded-lg p-4 border border-white/5 hover:border-[#F6FF2E]/30 transition-all">
              <p className="text-sm font-medium text-white">{a.label}</p>
              <p className="text-xs text-gray-500 mt-1">{a.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
