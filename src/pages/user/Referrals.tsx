import { useEffect, useState } from 'react';
import { referralApi, referralBonusTiersApi } from '@/api/api';
import { toast } from 'sonner';
import { Users, Copy, CheckCircle2, Clock, Gift, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UserReferrals() {
  const [referralCode, setReferralCode] = useState<string>('');
  const [connections, setConnections] = useState<any[]>([]);
  const [bonusTiers, setBonusTiers] = useState<any[]>([]);
  const [eligibility, setEligibility] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [codeRes, connRes, tiersRes, eligRes] = await Promise.all([
          referralApi.myCode(),
          referralApi.myConnections(),
          referralBonusTiersApi.list(),
          referralApi.bonusEligibility(),
        ]);

        setReferralCode(codeRes.code || '');
        setConnections(connRes.connections || []);
        setBonusTiers(tiersRes.tiers || []);
        setEligibility(eligRes.eligibility);
      } catch (err: any) {
        toast.error('Failed to load referral data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareCode = () => {
    const text = `Join me on NEXPockEt and start earning! Use my referral code: ${referralCode}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join NEXPockEt',
        text: text,
      });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Share text copied!');
    }
  };

  const validConnections = eligibility?.validConnections || 0;

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F6FF2E]" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Referral Program</h1>
        <p className="text-gray-400 text-sm mt-1">Build connections and earn bonuses</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Your Code */}
        <div className="lg:col-span-2">
          <div className="bg-[#14192A] rounded-xl border border-white/5 p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-[#F6FF2E]" /> Your Referral Code
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 uppercase mb-2">Referral Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralCode}
                    readOnly
                    className="flex-1 bg-[#0A0C10] border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-lg font-bold text-center"
                  />
                  <Button
                    onClick={handleCopyCode}
                    variant="outline"
                    className="border-white/10 hover:bg-white/5"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleShareCode} className="flex-1 bg-[#F6FF2E] text-[#0A0C10] hover:bg-[#e5ef2a] font-semibold">
                  <Share2 className="w-4 h-4 mr-2" /> Share Code
                </Button>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-xs text-blue-200">
                  ✨ <span className="font-medium">How it works:</span> Share your code with friends. When they sign up and make a $50+ deposit, they become a valid connection and you unlock withdrawal access (at 5 connections) plus earn bonuses!
                </p>
              </div>
            </div>
          </div>

          {/* Referrals List */}
          <div className="bg-[#14192A] rounded-xl border border-white/5 p-6 mt-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" /> Your Referrals ({connections.length})
            </h2>

            {connections.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No referrals yet. Share your code to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {connections.map((conn) => (
                  <div key={conn.id} className="flex items-center justify-between p-4 bg-[#0A0C10] border border-white/5 rounded-lg">
                    <div className="flex-1">
                      <p className="text-white font-medium">{conn.profiles?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{new Date(conn.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {conn.is_valid ? (
                        <div className="flex items-center gap-1 text-green-400 text-xs font-medium">
                          <CheckCircle2 className="w-4 h-4" /> Verified
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-yellow-400 text-xs font-medium">
                          <Clock className="w-4 h-4" /> Pending
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bonus Tiers & Status */}
        <div className="space-y-6">
          {/* Bonus Status */}
          <div className="bg-[#14192A] rounded-xl border border-white/5 p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-[#F6FF2E]" /> Bonus Status
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Valid Connections</span>
                  <span className="text-xl font-bold text-[#F6FF2E]">{validConnections}/5</span>
                </div>
                <div className="w-full bg-[#0A0C10] rounded-full h-3 border border-white/10">
                  <div
                    className="bg-gradient-to-r from-[#F6FF2E] to-yellow-400 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(validConnections / 5, 1) * 100}%` }}
                  />
                </div>
              </div>

              {eligibility?.applicableTier ? (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-xs text-green-200 font-medium mb-2">🎉 You Qualify for a Bonus!</p>
                  <p className="text-sm text-green-300 font-bold">${eligibility.applicableTier.bonus_amount}</p>
                  <p className="text-xs text-green-200/70 mt-1">Bonus available at {eligibility.applicableTier.min_connections}+ connections</p>
                </div>
              ) : (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-xs text-amber-200">Complete {5 - validConnections} more referrals to unlock the withdrawal feature</p>
                </div>
              )}
            </div>
          </div>

          {/* Bonus Tiers */}
          <div className="bg-[#14192A] rounded-xl border border-white/5 p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider opacity-70 mb-4">Bonus Tiers</h2>

            <div className="space-y-3">
              {bonusTiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`p-3 rounded-lg border ${
                    validConnections >= tier.min_connections && (!tier.max_connections || validConnections <= tier.max_connections)
                      ? 'bg-green-500/10 border-green-500/20'
                      : 'bg-[#0A0C10] border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">
                        {tier.min_connections}
                        {tier.max_connections ? ` - ${tier.max_connections}` : '+'}
                      </p>
                      <p className="text-sm font-medium text-white">connections</p>
                    </div>
                    <div>
                      {tier.bonus_amount > 0 ? (
                        <p className="text-lg font-bold text-[#F6FF2E]">${tier.bonus_amount}</p>
                      ) : (
                        <p className="text-sm text-gray-400">Unlocks Withdrawal</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
