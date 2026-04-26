import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { taskApi, transactionApi, planApi } from '@/api/api';
import { toast } from 'sonner';
import {
  Wallet, TrendingUp, TrendingDown, ListChecks,
  ArrowRight, Zap, Award, Clock, ShieldCheck, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function UserDashboard() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ tasksCompleted: 0, totalTasks: 0, earningsToday: 0, recentTx: [] as any[] });
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await refreshUser();
        const [tasksRes, txRes] = await Promise.all([
          taskApi.available(),
          transactionApi.my(),
        ]);
        
        const currentPlan = tasksRes.plan;
        const progress = tasksRes.progress;
        
        // Calculate earnings today based on progress and plan ROI
        let dailyEarnings = 0;
        if (currentPlan && currentPlan.plans) {
          const p = currentPlan.plans;
          const rewardPerTask = (p.price * p.daily_roi_pct / 100) / p.daily_tasks;
          dailyEarnings = progress.completed * rewardPerTask;
        }

        setPlan(currentPlan);
        setStats({
          tasksCompleted: progress.completed || 0,
          totalTasks: progress.total || 0,
          earningsToday: dailyEarnings,
          recentTx: (txRes.transactions || []).slice(0, 5),
        });
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F6FF2E]" /></div>;

  const statCards = [
    { label: 'Main Balance', value: `$${(user?.balance || 0).toFixed(2)}`, icon: Wallet, color: 'text-[#F6FF2E]', bg: 'bg-[#F6FF2E]/10' },
    { label: 'Earned Today', value: `$${stats.earningsToday.toFixed(2)}`, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Daily Tasks', value: `${stats.tasksCompleted}/${stats.totalTasks}`, icon: ListChecks, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Total Earned', value: `$${(user?.total_earned || 0).toFixed(2)}`, icon: Award, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Welcome back, {user?.name}</p>
        </div>
        {plan && (
          <div className="hidden md:flex items-center gap-2 bg-[#F6FF2E]/10 border border-[#F6FF2E]/20 px-3 py-1.5 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-[#F6FF2E]" />
            <span className="text-[#F6FF2E] text-xs font-bold uppercase tracking-wider">{plan.plans.name} Plan</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {user?.kyc_status !== 'verified' && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-4">
            <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-amber-200 text-sm font-medium">KYC Verification Required</p>
              <p className="text-amber-200/70 text-xs">Complete your KYC to enable withdrawals</p>
            </div>
            <Button size="sm" onClick={() => navigate('/kyc')} className="bg-amber-500 text-black hover:bg-amber-400">Verify Now</Button>
          </div>
        )}

        {!plan && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-4">
            <Zap className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-blue-200 text-sm font-medium">No Active Plan</p>
              <p className="text-blue-200/70 text-xs">Choose a plan to start earning daily ROI</p>
            </div>
            <Button size="sm" onClick={() => navigate('/plans')} className="bg-blue-500 text-white hover:bg-blue-400">Get a Plan</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-[#14192A] rounded-xl p-4 border border-white/5 shadow-sm">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${s.bg} mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-gray-400 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-[#14192A] rounded-xl border border-white/5">
            <div className="p-4 border-b border-white/5">
              <h2 className="font-semibold text-white text-sm uppercase tracking-wider opacity-70">Quick Actions</h2>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Tasks', icon: ListChecks, path: '/tasks', color: 'text-blue-400' },
                { label: 'Plans', icon: Zap, path: '/plans', color: 'text-[#F6FF2E]' },
                { label: 'Wallet', icon: Wallet, path: '/wallet', color: 'text-green-400' },
                { label: 'Referrals', icon: Award, path: '/referrals', color: 'text-purple-400' },
              ].map((a) => (
                <button key={a.label} onClick={() => navigate(a.path)} 
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#0A0C10] border border-white/5 hover:border-white/10 hover:bg-white/[0.02] transition-all group">
                  <a.icon className={`w-6 h-6 ${a.color} group-hover:scale-110 transition-transform`} />
                  <span className="text-xs text-gray-400">{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Plan Summary if active */}
          {plan && (
            <div className="bg-gradient-to-br from-[#14192A] to-[#0A0C10] rounded-xl border border-[#F6FF2E]/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#F6FF2E]" /> Active Plan: {plan.plans.name}
                </h3>
                <span className="text-xs text-gray-500">Expires: {new Date(plan.expires_at).toLocaleDateString()}</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 uppercase">Daily ROI</p>
                  <p className="text-lg font-bold text-white">{plan.plans.daily_roi_pct}%</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 uppercase">Tasks/Day</p>
                  <p className="text-lg font-bold text-white">{plan.plans.daily_tasks}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 uppercase">Total Earned</p>
                  <p className="text-lg font-bold text-green-400">${parseFloat(plan.total_earned || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-[#14192A] rounded-xl border border-white/5 h-fit">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider opacity-70">Recent Activity</h2>
            <button onClick={() => navigate('/wallet')} className="text-[#F6FF2E] text-xs flex items-center gap-1 hover:underline">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-white/5">
            {stats.recentTx.length === 0 && (
              <p className="p-8 text-gray-500 text-sm text-center">No transactions yet</p>
            )}
            {stats.recentTx.map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tx.type === 'deposit' ? 'bg-green-400/10' : tx.type === 'withdrawal' ? 'bg-red-400/10' : 'bg-blue-400/10'}`}>
                    {tx.type === 'deposit' ? <TrendingUp className="w-4 h-4 text-green-400" /> : tx.type === 'withdrawal' ? <TrendingDown className="w-4 h-4 text-red-400" /> : <Zap className="w-4 h-4 text-blue-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white capitalize">{tx.type.replace('_', ' ')}</p>
                    <p className="text-[10px] text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${tx.type === 'withdrawal' ? 'text-red-400' : 'text-green-400'}`}>
                    {tx.type === 'withdrawal' ? '-' : '+'}${parseFloat(tx.amount).toFixed(2)}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase">{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
