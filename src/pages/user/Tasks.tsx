import { useEffect, useState } from 'react';
import { taskApi, bonusTaskApi } from '@/api/api';
import { toast } from 'sonner';
import {
  ListChecks, ExternalLink, Clock, CheckCircle, Gift, AlertCircle, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function UserTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [bonusTasks, setBonusTasks] = useState<any[]>([]);
  const [activeCycle, setActiveCycle] = useState<boolean>(false);
  const [dailyEarning, setDailyEarning] = useState<number>(0);
  const [completedToday, setCompletedToday] = useState<boolean>(false);
  const [totalTasks, setTotalTasks] = useState<number>(0);
  const [allTasksCompleted, setAllTasksCompleted] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, bonusRes] = await Promise.all([
        taskApi.available(),
        bonusTaskApi.available(),
      ]);

      // Cycle expired and was completed during this fetch
      if (tasksRes.cycleJustCompleted) {
        toast.success(
          '🎉 Your 21-day earning cycle is complete! Your funds are now available for withdrawal.',
          { duration: 8000 }
        );
        setActiveCycle(false);
        setTasks([]);
        setBonusTasks([]);
        setDailyEarning(0);
        setCompletedToday(false);
        setTotalTasks(0);
        setAllTasksCompleted(false);
        return;
      }

      setTasks(tasksRes.tasks || []);
      setActiveCycle(tasksRes.activeCycle || false);
      setDailyEarning(tasksRes.dailyEarning || 0);
      setCompletedToday(tasksRes.completedToday || false);
      setTotalTasks(tasksRes.totalTasks || 0);
      setAllTasksCompleted(tasksRes.allTasksCompleted || false);
      setBonusTasks(bonusRes.bonus_tasks || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleComplete = async (taskId: number) => {
    setCompleting(taskId);
    try {
      const res = await taskApi.complete(taskId);

      // Cycle expired at the moment the user tried to complete a task
      if (res.cycleCompleted) {
        toast.success(
          '🎉 Your 21-day earning cycle is complete! Your funds are now available for withdrawal.',
          { duration: 8000 }
        );
        setActiveCycle(false);
        setTasks([]);
        setCompletedToday(false);
        return;
      }

      if (res.success) {
        toast.success(res.message || `Earned $${res.rewardAmount}!`);
        setCompletedToday(true);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Daily Tasks</h1>
          <p className="text-gray-400 text-sm mt-1">Complete tasks to earn 5% daily</p>
        </div>
      </div>

      {!activeCycle ? (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">No Active Earning Cycle</h3>
            <p className="text-gray-400 max-w-md mx-auto mt-2">You need an active earning cycle to start earning from tasks. Make a deposit ($50 minimum) and start your cycle.</p>
          </div>
          <Button onClick={() => navigate('/wallet')} className="bg-[#F6FF2E] text-[#0A0C10] hover:bg-[#e5ef2a] font-bold px-8 h-12">
            Make a Deposit
          </Button>
        </div>
      ) : (
        <>
          {/* Daily Earning Card */}
          <div className="bg-gradient-to-br from-green-500/10 to-[#14192A] rounded-xl p-6 border border-green-500/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-gray-400 uppercase mb-1">Complete any task today to earn</p>
                <p className="text-3xl font-bold text-green-400">${dailyEarning.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
            
            {completedToday ? (
              <div className="p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                <div className="flex items-center gap-2 text-green-300 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" /> You earned 5% today! Return tomorrow for another 5%.
                </div>
              </div>
            ) : (
              <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <div className="flex items-center gap-2 text-blue-300 text-sm font-medium">
                  <Clock className="w-4 h-4" /> Complete one task to earn your 5% now
                </div>
              </div>
            )}
          </div>

          {/* Bonus Tasks */}
          {bonusTasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#F6FF2E]" /> Bonus Tasks (Limited Time)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bonusTasks.map((task) => (
                  <div key={task.id} className="bg-gradient-to-br from-[#F6FF2E]/10 to-[#14192A] rounded-xl p-5 border border-[#F6FF2E]/20">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-[#F6FF2E]/20 flex items-center justify-center flex-shrink-0">
                          <Gift className="w-5 h-5 text-[#F6FF2E]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{task.title}</h3>
                          <p className="text-xs text-gray-400">{task.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    {task.platform && (
                      <a href={task.platform} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#F6FF2E] hover:underline mb-3">
                        Open Task <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    <Button
                      onClick={() => handleBonusComplete(task.id)}
                      disabled={completing === task.id}
                      className="w-full bg-[#F6FF2E] text-[#0A0C10] hover:bg-[#e5ef2a] font-semibold"
                    >
                      {completing === task.id ? 'Completing...' : 'Claim Bonus'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regular Tasks */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-blue-400" /> Available Tasks ({tasks.length})
            </h2>

            {tasks.length === 0 ? (
              <div className="text-center py-12 bg-[#0A0C10] rounded-xl border border-white/5">
                <ListChecks className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                {allTasksCompleted ? (
                  <p className="text-gray-400">
                    ✓ All {totalTasks} tasks completed this cycle! <br />
                    <span className="text-sm text-gray-500 mt-2 block">Your earning cycle continues. Check back tomorrow for more tasks or complete bonus tasks if available.</span>
                  </p>
                ) : (
                  <p className="text-gray-400">All done for today! Check back tomorrow.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.map((task) => (
                  <div key={task.id} className="bg-[#14192A] rounded-xl p-5 border border-white/5 hover:border-white/10 transition-all group">
                    <div className="mb-4">
                      <h3 className="font-semibold text-white group-hover:text-[#F6FF2E] transition-colors">{task.title}</h3>
                      <p className="text-xs text-gray-400 mt-1">{task.description}</p>
                    </div>

                    {/* {task.platform && (
                      <a href={task.platform} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#F6FF2E] hover:underline mb-3 display-none">
                        Open Task <ExternalLink className="w-3 h-3" />
                      </a>
                    )} */}

                    <Button
                      onClick={() => handleComplete(task.id)}
                      disabled={completing === task.id || completedToday}
                      className="w-full bg-blue-600 text-white hover:bg-blue-700 font-semibold"
                    >
                      {completing === task.id ? 'Completing...' : completedToday ? 'Already Completed Today' : 'Complete Task'}
                    </Button>
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
