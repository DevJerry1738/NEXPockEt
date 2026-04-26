import { useAuth } from '@/contexts/AuthContext';
import { Copy, Users, DollarSign, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function UserReferrals() {
  const { user } = useAuth();
  const referralLink = `${window.location.origin}/register?ref=${user?.referral_code || ''}`;

  const copyCode = () => {
    navigator.clipboard.writeText(user?.referral_code || '');
    toast.success('Referral code copied!');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied!');
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Refer & Earn</h1>
        <p className="text-gray-400 text-sm mt-1">Invite friends and earn rewards</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Users, label: 'Your Code', value: user?.referral_code || 'N/A', color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { icon: DollarSign, label: 'Referral Bonus', value: '$5.00', color: 'text-green-400', bg: 'bg-green-400/10' },
          { icon: Award, label: 'Commission', value: '10%', color: 'text-[#F6FF2E]', bg: 'bg-[#F6FF2E]/10' },
        ].map((item) => (
          <div key={item.label} className="bg-[#14192A] rounded-xl p-4 border border-white/5 text-center">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${item.bg} mb-2`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <p className="text-lg font-bold text-white">{item.value}</p>
            <p className="text-xs text-gray-400">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-[#14192A] to-[#1a2040] rounded-xl p-6 border border-white/5 space-y-4">
        <h3 className="font-semibold text-white">Share Your Referral Link</h3>

        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 bg-[#0A0C10] rounded-lg px-4 py-3 border border-white/10 text-sm text-gray-300 font-mono truncate">
              {user?.referral_code}
            </div>
            <Button onClick={copyCode} variant="outline" className="border-white/10 hover:bg-white/5">
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 bg-[#0A0C10] rounded-lg px-4 py-3 border border-white/10 text-sm text-gray-300 truncate">
              {referralLink}
            </div>
            <Button onClick={copyLink} variant="outline" className="border-white/10 hover:bg-white/5">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="bg-[#0A0C10] rounded-lg p-4 border border-white/5">
          <h4 className="text-sm font-medium text-white mb-2">How it works</h4>
          <ol className="space-y-2 text-sm text-gray-400">
            <li className="flex gap-2"><span className="text-[#F6FF2E] font-bold">1.</span> Share your referral link with friends</li>
            <li className="flex gap-2"><span className="text-[#F6FF2E] font-bold">2.</span> They sign up using your code</li>
            <li className="flex gap-2"><span className="text-[#F6FF2E] font-bold">3.</span> You earn $5.00 per referral</li>
            <li className="flex gap-2"><span className="text-[#F6FF2E] font-bold">4.</span> Earn 10% commission on their earnings</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
