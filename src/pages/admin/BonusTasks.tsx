import { Gift } from 'lucide-react';

export default function AdminBonusTasks() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Bonus Tasks</h1>
        <p className="text-gray-400 text-sm mt-1">Manage limited-time bonus tasks for users</p>
      </div>

      <div className="bg-[#14192A] rounded-xl border border-white/5 p-12 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 bg-[#F6FF2E]/10 rounded-full flex items-center justify-center">
          <Gift className="w-8 h-8 text-[#F6FF2E]" />
        </div>
        <h3 className="text-lg font-semibold text-white">Bonus Tasks Coming Soon</h3>
        <p className="text-gray-400 text-sm max-w-sm">
          The bonus tasks feature is currently disabled. It will be available in a future update.
        </p>
      </div>
    </div>
  );
}