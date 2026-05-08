import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { transactionApi, earningCycleApi, referralApi, notificationApi } from '@/api/api';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Wallet, TrendingUp, TrendingDown, ListChecks,
  ArrowRight, Zap, Award, Clock, Users, Play, Bell, Check, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function UserDashboard() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [earningCycle, setEarningCycle] = useState<any>(null);
  const [referrals, setReferrals] = useState<any>(null);
  const [stats, setStats] = useState({ recentTx: [] as any[] });
  const [loading, setLoading] = useState(true);
  const [initiatingCycle, setInitiatingCycle] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const channelRef = useRef<any>(null);

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.my();
      setNotifications(res.notifications || []);
    } catch {}
  };

  // Personal = user_id matches; Broadcast = user_id is null
  const isBroadcast = (n: any) => n.user_id === null || n.user_id === undefined;

  const markReadInDashboard = async (notif: any) => {
    if (notif.is_read) return;
    setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, is_read: true } : n));
    if (!isBroadcast(notif)) {
      await notificationApi.markRead(notif.id);
    }
  };

  const deleteInDashboard = async (notif: any) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    if (!isBroadcast(notif)) {
      await notificationApi.delete(notif.id);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await refreshUser();
        const [cycleRes, referralRes, txRes] = await Promise.all([
          earningCycleApi.current(),
          referralApi.myCode(),
          transactionApi.my(),
        ]);

        // Cycle just auto-completed via lazy completion  show a simple toast
        if (cycleRes.justCompleted) {
          toast.success(
            '🎉 Your 21-day earning cycle is complete! Your funds are now available for withdrawal.',
            { duration: 8000 }
          );
          await refreshUser(); // reload balance now that cycle is cleared
        }

        setEarningCycle(cycleRes.cycle);
        setReferrals(referralRes);
        setStats({
          recentTx: (txRes.transactions || []).slice(0, 5),
        });
      } catch (err: any) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    fetchNotifications();

    // Subscribe to real-time notifications
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications();
      })
      .subscribe();
    channelRef.current = channel;
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);


  const handleInitiateCycle = async () => {
    // Guard: must have at least $50 balance
    const balance = Number(user?.balance || 0);
    if (balance < 50) {
      toast.error(`You need at least $50 to start an earning cycle. Current balance: $${balance.toFixed(2)}`);
      return;
    }

    setInitiatingCycle(true);
    try {
      const res = await earningCycleApi.initiate();
      if (res.success) {
        toast.success('Earning cycle started! Complete tasks daily to earn 5% of your cycle balance.');
        // Refresh cycle data
        const cycleRes = await earningCycleApi.current();
        setEarningCycle(cycleRes.cycle);
        await refreshUser();
      } else {
        toast.error(res.message || 'Failed to start earning cycle');
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setInitiatingCycle(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F6FF2E]" /></div>;

  // Always use Number() to coerce Postgres NUMERIC strings → JS numbers
  const initialBalance = Number(earningCycle?.initialBalance ?? 0);
  const currentBalance = Number(earningCycle?.currentBalance ?? 0);
  const dailyEarning = currentBalance * 0.05;

  const userBalance = Number(user?.balance || 0);
  const canStartCycle = userBalance >= 50;

  // Check if the user already completed a task today
  const completedToday = (() => {
    if (!earningCycle?.lastTaskCompletionDate) return false;
    const last = new Date(earningCycle.lastTaskCompletionDate);
    const now = new Date();
    return (
      last.getUTCFullYear() === now.getUTCFullYear() &&
      last.getUTCMonth() === now.getUTCMonth() &&
      last.getUTCDate() === now.getUTCDate()
    );
  })();

  const statCards = [
    { label: 'Main Balance', value: `$${userBalance.toFixed(2)}`, icon: Wallet, color: 'text-[#F6FF2E]', bg: 'bg-[#F6FF2E]/10' },
    ...(earningCycle ? [
      {
        label: completedToday ? "Tomorrow's Potential Earn" : "Today's Potential Earn",
        sublabel: completedToday ? '✓ Earned today' : undefined,
        value: `+$${dailyEarning.toFixed(2)}`,
        icon: TrendingUp,
        color: 'text-green-400',
        bg: completedToday ? 'bg-green-400/10' : 'bg-green-400/10',
      },
      { label: 'Days Remaining', value: `${earningCycle.daysRemaining}`, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    ] : []),
    { label: 'Total Earned', value: `$${Number(user?.total_earned || 0).toFixed(2)}`, icon: Award, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ];


  return (
    <div className="space-y-6">
      {/* Notifications section */}
      <div className="bg-[#14192A] rounded-xl border border-white/5 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#F6FF2E]" />
            <span className="font-semibold text-white">Notifications</span>
            {notifications.filter((n) => !n.is_read).length > 0 && (
              <span className="text-xs bg-[#F6FF2E] text-black font-bold rounded-full px-1.5 py-0.5 leading-none">
                {notifications.filter((n) => !n.is_read).length}
              </span>
            )}
          </div>
          <Button size="sm" variant="ghost" onClick={() => navigate('/notifications')} className="text-[#F6FF2E] text-xs h-7">
            View All
          </Button>
        </div>

        {notifications.length === 0 && (
          <p className="text-gray-500 text-sm py-2">No notifications yet</p>
        )}

        <div className="space-y-1">
          {notifications.slice(0, 3).map((notif) => (
            <div
              key={notif.id}
              className={`rounded-lg px-3 py-2 flex items-start gap-2 transition-all ${
                notif.is_read ? 'bg-white/5 opacity-60' : 'bg-[#F6FF2E]/10'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-white truncate">{notif.title}</span>
                  {!notif.is_read && <span className="w-1.5 h-1.5 rounded-full bg-[#F6FF2E] flex-shrink-0" />}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{notif.message}</p>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0 mt-0.5">
                {!notif.is_read && (
                  <button
                    onClick={() => markReadInDashboard(notif)}
                    className="p-1 text-gray-500 hover:text-[#F6FF2E] transition-colors rounded"
                    title="Mark as read"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => deleteInDashboard(notif)}
                  className="p-1 text-gray-500 hover:text-red-400 transition-colors rounded"
                  title="Dismiss"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Welcome back, {user?.name}</p>
        </div>
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

        {!earningCycle && (
          <div className={`border rounded-xl p-4 flex items-center gap-4 ${
            canStartCycle
              ? 'bg-blue-500/10 border-blue-500/20'
              : 'bg-gray-500/10 border-gray-500/20'
          }`}>
            <Zap className={`w-5 h-5 flex-shrink-0 ${canStartCycle ? 'text-blue-400' : 'text-gray-400'}`} />
            <div className="flex-1">
              <p className={`text-sm font-medium ${canStartCycle ? 'text-blue-200' : 'text-gray-300'}`}>
                {canStartCycle ? 'Ready to Start Earning' : 'Deposit Required'}
              </p>
              <p className={`text-xs ${canStartCycle ? 'text-blue-200/70' : 'text-gray-400'}`}>
                {canStartCycle
                  ? `You have $${userBalance.toFixed(2)} — click Activate Cycle below to begin earning 5% daily`
                  : `Deposit at least $50 to start your 21-day earning cycle (current: $${userBalance.toFixed(2)})`}
              </p>
            </div>
            {!canStartCycle && (
              <Button size="sm" onClick={() => navigate('/wallet')} className="bg-blue-500 text-white hover:bg-blue-600">Deposit</Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {earningCycle && (
            <div className="bg-gradient-to-br from-[#14192A] to-[#0A0C10] rounded-xl border border-[#F6FF2E]/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Play className="w-5 h-5 text-[#F6FF2E]" /> 21-Day Earning Cycle
                </h3>
                <span className="text-xs text-gray-500">Progress: {earningCycle.daysRemaining} days remaining</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 uppercase">Initial</p>
                  <p className="text-lg font-bold text-white">${initialBalance.toFixed(2)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 uppercase">Current</p>
                  <p className="text-lg font-bold text-[#F6FF2E]">${currentBalance.toFixed(2)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 uppercase">Daily (5%)</p>
                  <p className="text-lg font-bold text-green-400">${dailyEarning.toFixed(2)}</p>
                </div>
              </div>
              <div className="bg-[#0A0C10] rounded-lg p-3 border border-white/5">
                <p className="text-xs text-gray-400">💡 Tip: Complete at least one task daily to earn 5% of your cycle balance</p>
              </div>
            </div>
          )}

          {!earningCycle && canStartCycle && (
            <div className="bg-[#14192A] rounded-xl border border-[#F6FF2E]/10 p-6">
              <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#F6FF2E]" /> Activate Your Earning Cycle
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Your wallet balance of <span className="text-[#F6FF2E] font-semibold">${userBalance.toFixed(2)}</span> will be locked into a 21-day cycle.
                Complete at least one task each day to earn <span className="text-green-400 font-semibold">5% daily</span>.
              </p>
              <Button
                onClick={handleInitiateCycle}
                disabled={initiatingCycle}
                className="w-full bg-[#F6FF2E] text-black hover:bg-[#F6FF2E]/90 font-semibold"
              >
                {initiatingCycle ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" /> Starting...
                  </span>
                ) : 'Activate Cycle'}
              </Button>
            </div>
          )}

          {!earningCycle && !canStartCycle && (
            <div className="bg-[#14192A] rounded-xl border border-white/5 p-6">
              <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#F6FF2E]" /> How It Works
              </h3>
              <ol className="space-y-2 text-sm text-gray-400 list-decimal list-inside">
                <li>Deposit at least <span className="text-white font-medium">$50</span> to your wallet</li>
                <li>Activate your 21-day earning cycle</li>
                <li>Complete at least one task per day to earn <span className="text-green-400 font-medium">5% daily</span></li>
              </ol>
              <Button onClick={() => navigate('/wallet')} className="w-full mt-4 bg-[#F6FF2E] text-black hover:bg-[#F6FF2E]/90 font-semibold">
                Make a Deposit
              </Button>
            </div>
          )}

          <div className="bg-[#14192A] rounded-xl border border-white/5">
            <div className="p-4 border-b border-white/5">
              <h2 className="font-semibold text-white text-sm uppercase tracking-wider opacity-70">Quick Actions</h2>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Tasks', icon: ListChecks, path: '/tasks', color: 'text-blue-400', disabled: !earningCycle },
                { label: 'Wallet', icon: Wallet, path: '/wallet', color: 'text-green-400' },
                { label: 'Referrals', icon: Award, path: '/referrals', color: 'text-purple-400' },
                { label: 'Profile', icon: Users, path: '/profile', color: 'text-cyan-400' },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={() => !a.disabled && navigate(a.path)}
                  disabled={a.disabled}
                  title={a.disabled ? 'Activate an earning cycle to access tasks' : undefined}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-[#0A0C10] border border-white/5 transition-all group ${
                    a.disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:border-white/10 hover:bg-white/[0.02]'
                  }`}>
                  <a.icon className={`w-6 h-6 ${a.color} group-hover:scale-110 transition-transform`} />
                  <span className="text-xs text-gray-400">{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          {referrals && (
            <div className="bg-[#14192A] rounded-xl border border-white/5 p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" /> Referral Summary
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Valid Connections</span>
                  <span className="text-xl font-bold text-white">{referrals.validConnections}/5</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-[#F6FF2E] h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((referrals.validConnections / 5) * 100, 100)}%` }}
                  />
                </div>
                {referrals.validConnections >= 5 ? (
                  <p className="text-green-400 text-xs font-medium">✓ You can withdraw!</p>
                ) : (
                  <p className="text-amber-400 text-xs">Need {5 - referrals.validConnections} more to unlock withdrawals</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#14192A] rounded-xl border border-white/5 h-fit">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider opacity-70">Recent Activity</h2>
            <button onClick={() => navigate('/wallet')} className="text-[#F6FF2E] text-xs flex items-center gap-1 hover:underline">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
            {stats.recentTx.length === 0 && (
              <div className="p-6 text-center text-gray-500 text-sm">No transactions yet</div>
            )}
            {stats.recentTx.map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    tx.type === 'withdraw' ? 'bg-red-500/20' : 'bg-green-500/20'
                  }`}>
                    {tx.type === 'withdraw' ? <TrendingDown className="w-5 h-5 text-red-400" /> : <TrendingUp className="w-5 h-5 text-green-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white capitalize">{tx.type.replace('_', ' ')}</p>
                    <p className="text-[10px] text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className={`text-sm font-bold ${tx.type === 'withdraw' ? 'text-red-400' : 'text-green-400'}`}>
                    {tx.type === 'withdraw' ? '-' : '+'}${parseFloat(tx.amount).toFixed(2)}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase">{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-[#14192A] rounded-xl p-4 border border-white/5 shadow-sm">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${s.bg} mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-gray-400 text-xs mt-1">{s.label}</p>
            {'sublabel' in s && s.sublabel && (
              <p className="text-green-400 text-[10px] mt-0.5 font-medium">{s.sublabel}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
