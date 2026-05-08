import { useAuth } from '@/contexts/AuthContext';
import { Mail, Shield, Calendar, Award, UserCircle2 } from 'lucide-react';

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
    unverified: 'text-gray-400',
    not_submitted: 'text-gray-400',
  };

  const kycLabel: any = {
    verified: 'Verified ✓',
    pending: 'Pending Review',
    rejected: 'Rejected',
    unverified: 'Not Submitted',
    not_submitted: 'Not Submitted',
  };

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-gray-400 text-sm mt-1">Your account information</p>
      </div>

      <div className="bg-[#14192A] rounded-xl p-6 border border-white/5">
        {/* Avatar + name */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-[#F6FF2E]/10 border-2 border-[#F6FF2E]/20 flex items-center justify-center flex-shrink-0">
            <UserCircle2 className="w-12 h-12 text-[#F6FF2E]" />
          </div>
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

        {/* Info grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              icon: Mail,
              label: 'Email',
              value: user?.email,
              color: 'text-gray-300',
              capitalize: false,
            },
            {
              icon: Shield,
              label: 'KYC Status',
              value: kycLabel[user?.kyc_status as string] || 'Not Submitted',
              color: kycColors[user?.kyc_status as string] || 'text-gray-400',
              capitalize: false,
            },
            {
              icon: Award,
              label: 'Referral Code',
              value: user?.referral_code || '—',
              color: 'text-[#F6FF2E]',
              capitalize: false,
            },
            {
              icon: Calendar,
              label: 'Member Since',
              value: memberSince,
              color: 'text-gray-300',
              capitalize: false,
            },
          ].map((item) => (
            <div key={item.label} className="bg-[#0A0C10] rounded-lg p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <item.icon className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500">{item.label}</span>
              </div>
              <p className={`text-sm font-medium break-all ${item.color}`}>{item.value || '—'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
