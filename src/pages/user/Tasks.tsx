import { useEffect, useState } from 'react';
import { taskApi, bonusTaskApi } from '@/api/api';
import { toast } from 'sonner';
import {
  ListChecks, Zap, ExternalLink, Clock, CheckCircle, Gift, AlertCircle, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function UserTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [bonusTasks, setBonusTasks] = useState<any[]>([]);
  const [plan, setPlan] = useState<any>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, bonusRes] = await Promise.all([
        taskApi.available(),
        bonusTaskApi.available(),
      ]);
      setTasks(tasksRes.tasks || []);
      setPlan(tasksRes.plan);
      setProgress(tasksRes.progress || { completed: 0, total: 0 });
      setBonusTasks(bonusRes.bonus_tasks || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleComplete = async (taskId: number) => {
    if (progress.completed >= progress.total) {
      toast.error('Daily task limit reached for your plan.');
      return;
    }
    
    setCompleting(taskId);
    try {
      const res = await taskApi.complete(taskId);
      if (res.success) {
        toast.success(res.message || `Earned $${res.reward}!`);
        // Refresh data to get updated progress
        fetchData();
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCompleting(null);
    }
  };

  const handleBonusComplete = async (taskId: number) => {
    setCompleting(taskId);
    try {
      const res = await bonusTaskApi.complete(taskId);
      if (res.success) {
        toast.success(res.message || 'Bonus earned!');
        setBonusTasks((prev) => prev.filter((t) => t.id !== taskId));
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCompleting(null);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F6FF2E]" /></div>;

  // Calculate potential reward per task based on plan
  const calculateReward = () => {
    if (!plan || !plan.plans) return 0;
    const p = plan.plans;
    return (p.price * p.daily_roi_pct / 100) / p.daily_tasks;
  };

  const taskReward = calculateReward();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Daily Tasks</h1>
          <p className="text-gray-400 text-sm mt-1">Complete your tasks to earn daily ROI</p>
        </div>
        
        {plan && (
          <div className="bg-[#14192A] rounded-xl p-4 border border-white/5 flex items-center gap-6 min-w-[300px]">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-400">Daily Progress</span>
                <span className="text-[#F6FF2E] font-medium">{progress.completed}/{progress.total} Tasks</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#F6FF2E] transition-all duration-500" 
                  style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-right border-l border-white/5 pl-6">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Earnings Today</p>
              <p className="text-lg font-bold text-green-400">${(progress.completed * taskReward).toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>

      {!plan && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">No Active Plan</h3>
            <p className="text-gray-400 max-w-md mx-auto mt-2">You need an active investment plan to start earning from tasks. Browse our tiered plans to get started.</p>
          </div>
          <Button onClick={() => navigate('/plans')} className="bg-[#F6FF2E] text-[#0A0C10] hover:bg-[#e5ef2a] font-bold px-8 h-12">
            View Plans
          </Button>
        </div>
      )}

      {plan && (
        <>
          {bonusTasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#F6FF2E]" /> Bonus Tasks (Limited Time)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bonusTasks.map((task) => (
                  <div key={task.id} className="bg-gradient-to-br from-[#F6FF2E]/10 to-[#14192A] rounded-xl p-5 border border-[#F6FF2E]/20">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#F6FF2E]/20 flex items-center justify-center">
                          <Gift className="w-5 h-5 text-[#F6FF2E]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{task.title}</h3>
                          <p className="text-xs text-gray-400">{task.description}</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-[#F6FF2E]">${parseFloat(task.reward).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> One-time bonus
                      </span>
                      <Button
                        size="sm" disabled={!!completing}
                        onClick={() => handleBonusComplete(task.id)}
                        className="bg-[#F6FF2E] text-[#0A0C10] hover:bg-[#e5ef2a]"
                      >
                        {completing === task.id ? 'Processing...' : 'Claim Bonus'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <ListChecks className="w-5 h-5" /> Regular Tasks
              </h2>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <TrendingUp className="w-3 h-3" /> Reward per task: <span className="text-green-400 font-semibold">${taskReward.toFixed(2)}</span>
              </div>
            </div>

            {progress.completed >= progress.total ? (
              <div className="bg-[#14192A] rounded-xl p-12 border border-white/5 text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Daily Goal Achieved!</h3>
                <p className="text-gray-400 text-sm mt-2">You've completed all {progress.total} tasks for today. Come back tomorrow for new opportunities.</p>
                <div className="mt-6 inline-flex items-center gap-2 text-sm text-[#F6FF2E] bg-[#F6FF2E]/10 px-4 py-2 rounded-full">
                  <Zap className="w-4 h-4" /> Total Earned Today: ${(progress.completed * taskReward).toFixed(2)}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.map((task) => (
                  <div key={task.id} className="bg-[#14192A] rounded-xl p-5 border border-white/5 hover:border-white/10 transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-400/10 flex items-center justify-center group-hover:bg-blue-400/20 transition-colors">
                          <Zap className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white line-clamp-1">{task.title}</h3>
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider">{task.platform || 'Social'}</span>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-[#F6FF2E]">${taskReward.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-6 line-clamp-2 h-10">{task.description}</p>
                    <div className="flex items-center gap-2">
                      {task.url && task.url !== '#' && (
                        <a href={task.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <Button variant="outline" size="sm" className="w-full border-white/10 hover:bg-white/5 text-xs">
                            <ExternalLink className="w-3.5 h-3.5 mr-1" /> Visit
                          </Button>
                        </a>
                      )}
                      <Button
                        size="sm" disabled={!!completing}
                        onClick={() => handleComplete(task.id)}
                        className="flex-1 bg-[#F6FF2E] text-[#0A0C10] hover:bg-[#e5ef2a] text-xs font-bold"
                      >
                        {completing === task.id ? (
                          <div className="flex items-center gap-1.5">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#0A0C10]" />
                            ...
                          </div>
                        ) : (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Complete
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
