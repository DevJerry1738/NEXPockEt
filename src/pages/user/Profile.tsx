import { useAuth } from '@/contexts/AuthContext';
import { Mail, Shield, Calendar, Award } from 'lucide-react';

export default function UserProfile() {
  const { user } = useAuth();

  const statusColors: any = {
    active: 'text-green-400 bg-green-400/10',
    suspended: 'text-amber-400 bg-amber-400/10',
    banned: 'text-red-400 bg-red-400/10',
  };

  const kycColors: any = {
    verified: 'text-green-400',
    pending: 'text-amber-400',
    rejected: 'text-red-400',
    not_submitted: 'text-gray-400',
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-gray-400 text-sm mt-1">Your account information</p>
      </div>

      <div className="bg-[#14192A] rounded-xl p-6 border border-white/5">
        <div className="flex items-center gap-4 mb-6">
          <img src={user?.avatar || ''} alt="" className="w-20 h-20 rounded-2xl bg-gray-700 border-2 border-[#F6FF2E]/20" />
          <div>
            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[user?.status as string] || statusColors.active}`}>
                {user?.status}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-400/10 text-blue-400 font-medium capitalize">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: Mail, label: 'Email', value: user?.email, color: 'text-gray-400' },
            { icon: Shield, label: 'KYC Status', value: user?.kyc_status, color: kycColors[user?.kyc_status as string] || 'text-gray-400' },
            { icon: Award, label: 'Referral Code', value: user?.referral_code, color: 'text-[#F6FF2E]' },
            { icon: Calendar, label: 'Member Since', value: 'Active Account', color: 'text-gray-400' },
          ].map((item) => (
            <div key={item.label} className="bg-[#0A0C10] rounded-lg p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <item.icon className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500">{item.label}</span>
              </div>
              <p className={`text-sm font-medium capitalize ${item.color}`}>{item.value || 'N/A'}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#14192A] rounded-xl p-6 border border-white/5">
        <h3 className="font-semibold text-white mb-4">Plan Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Current Plan', value: user?.role === 'admin' ? 'Admin' : 'Free Starter' },
            { label: 'Daily Tasks', value: '3' },
            { label: 'Earning Cap', value: '$5.00/day' },
            { label: 'Withdrawal', value: user?.withdrawal_enabled ? 'Enabled' : 'Disabled' },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-lg font-bold text-white">{item.value}</p>
              <p className="text-xs text-gray-400">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
