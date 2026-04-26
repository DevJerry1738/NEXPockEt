import { useEffect, useState } from 'react';
import { planApi } from '@/api/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Check, Shield, Zap, Award, Star, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UserPlans() {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [listRes, myRes] = await Promise.all([planApi.list(), planApi.my()]);
      setPlans(listRes.plans || []);
      setCurrentPlan(myRes.plan);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleBuy = async (planId: number, price: number) => {
    if (user && (user.balance || 0) < price) {
      toast.error('Insufficient balance. Please deposit funds first.');
      return;
    }
    
    if (!confirm('Are you sure you want to purchase this plan?')) return;
    
    setBuying(planId);
    try {
      const res = await planApi.buy(planId);
      if (res.success) {
        toast.success('Plan purchased successfully!');
        fetchData();
        refreshUser();
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBuying(null);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F6FF2E]" /></div>;

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-3xl font-bold text-white">Investment Plans</h1>
        <p className="text-gray-400">Choose a plan that fits your goals. Higher tiers offer more tasks and greater daily ROI.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrent = currentPlan?.plan_id === plan.id;
          const icons = [Shield, Zap, Award, Star];
          const PlanIcon = icons[plans.indexOf(plan) % icons.length];
          
          return (
            <div key={plan.id} className={`relative bg-[#14192A] rounded-2xl p-6 border transition-all duration-300 ${isCurrent ? 'border-[#F6FF2E] shadow-[0_0_20px_rgba(246,255,46,0.1)]' : 'border-white/5 hover:border-white/10'}`}>
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F6FF2E] text-[#0A0C10] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Current Plan
                </div>
              )}
              
              <div className="mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${isCurrent ? 'bg-[#F6FF2E]/20' : 'bg-white/5'}`}>
                  <PlanIcon className={`w-6 h-6 ${isCurrent ? 'text-[#F6FF2E]' : 'text-gray-400'}`} />
                </div>
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-bold text-white">${plan.price}</span>
                  <span className="text-gray-500 text-sm">/ {plan.duration_days} days</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">Daily ROI: <span className="text-white font-semibold">{plan.daily_roi_pct}%</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">Daily Tasks: <span className="text-white font-semibold">{plan.daily_tasks}</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-[#F6FF2E]" />
                  <span className="text-gray-300">Total ROI: {plan.total_roi_pct}%</span>
                </div>
                <p className="text-xs text-gray-500 italic mt-2">{plan.description}</p>
              </div>

              <Button
                onClick={() => handleBuy(plan.id, plan.price)}
                disabled={isCurrent || buying !== null}
                className={`w-full py-6 rounded-xl font-bold transition-all ${
                  isCurrent 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default' 
                  : 'bg-[#F6FF2E] text-[#0A0C10] hover:bg-[#e5ef2a]'
                }`}
              >
                {isCurrent ? 'Active' : buying === plan.id ? 'Processing...' : 'Choose Plan'}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 text-center max-w-3xl mx-auto">
        <p className="text-blue-400 text-sm">
          <strong>Note:</strong> When you purchase a new plan, your previous active plan will be deactivated.
          Earnings from completed tasks are added instantly to your main balance.
        </p>
      </div>
    </div>
  );
}
