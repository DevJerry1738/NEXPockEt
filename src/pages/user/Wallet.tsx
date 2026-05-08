import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { transactionApi, paymentApi, storageApi, earningCycleApi } from '@/api/api';
import { toast } from 'sonner';
import {
  Wallet, ArrowDownLeft, ArrowUpRight, Clock, CheckCircle, XCircle,
  Copy, Check, Upload, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type PaymentField = { label: string; value: string };
type PaymentMethod = { id: number; name: string; type: string; fields: PaymentField[]; min_amount: number; max_amount: number };

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="flex items-center justify-between bg-[#0A0C10] rounded-lg px-4 py-3 border border-white/5">
      <div><p className="text-xs text-gray-500 mb-0.5">{label}</p><p className="text-sm font-mono text-white break-all">{value}</p></div>
      <button onClick={copy} className="ml-3 shrink-0 text-gray-400 hover:text-[#F6FF2E] transition-colors">
        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function UserWallet() {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [depositMethods, setDepositMethods] = useState<PaymentMethod[]>([]);
  const [withdrawMethods, setWithdrawMethods] = useState<PaymentMethod[]>([]);
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [withdrawMethod, setWithdrawMethod] = useState('');
  const [withdrawDetails, setWithdrawDetails] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState('deposit');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const [txRes, depRes, withRes, cycleRes] = await Promise.all([
        transactionApi.my(),
        paymentApi.active('deposit'),
        paymentApi.active('withdrawal'),
        earningCycleApi.current(),   // lazy-completes expired cycle if needed
      ]);
      setTransactions(txRes.transactions || []);
      setDepositMethods(depRes.methods || []);
      setWithdrawMethods(withRes.methods || []);

      // If an expired cycle was just completed, refresh user so balance is current
      if (cycleRes.justCompleted) {
        toast.success(
          '🎉 Your 21-day earning cycle is complete! Your funds are now available for withdrawal.',
          { duration: 8000 }
        );
        refreshUser();
      }
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return; }
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const clearProof = () => { setProofFile(null); setProofPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; };

  const handleDeposit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (!selectedMethod) { toast.error('Select a payment method'); return; }
    if (selectedMethod.min_amount && amt < selectedMethod.min_amount) { toast.error(`Minimum deposit is $${selectedMethod.min_amount}`); return; }
    if (!proofFile) { toast.error('Please upload proof of payment'); return; }
    setSubmitting(true);
    try {
      if (!user?.id) throw new Error('Not authenticated');
      const uploadRes = await storageApi.uploadProof(proofFile, user.id);
      if (!uploadRes.success) throw new Error(uploadRes.message || 'Upload failed');
      const res = await transactionApi.deposit({ amount: amt, payment_method: selectedMethod.name, proof_url: uploadRes.path, status: 'pending' });
      if (!res.success) throw new Error(res.message || 'Deposit failed');
      toast.success('Deposit request submitted! Pending admin approval.');
      setAmount(''); setSelectedMethod(null); clearProof();
      fetchData(); refreshUser();
    } catch (err: any) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const handleWithdraw = async () => {
    if (user?.kyc_status !== 'verified') { toast.error('Complete KYC verification first to enable withdrawals'); return; }
    if (!user?.withdrawal_enabled) { toast.error('Withdrawals are currently disabled for your account'); return; }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid withdrawal amount'); return; }
    if (amt < 50) { toast.error('Minimum withdrawal amount is $50'); return; }
    if (Number(user?.balance || 0) < amt) { toast.error(`Insufficient balance. Available: $${Number(user?.balance || 0).toFixed(2)}`); return; }
    if (!withdrawMethod) { toast.error('Select a payment method'); return; }
    if (!withdrawDetails) { toast.error('Enter your account details'); return; }
    setSubmitting(true);
    try {
      const res = await transactionApi.withdraw({ amount: amt, payment_method: withdrawMethod, details: withdrawDetails });
      if (!res.success) {
        toast.error(res.message || 'Withdrawal request failed');
        return;
      }
      toast.success('Withdrawal request submitted! Pending admin approval.');
      setAmount(''); setWithdrawMethod(''); setWithdrawDetails('');
      fetchData(); refreshUser();
    } catch (err: any) { toast.error(err.message || 'Withdrawal failed'); }
    finally { setSubmitting(false); }
  };


  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F6FF2E]" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">My Wallet</h1><p className="text-gray-400 text-sm mt-1">Manage your funds</p></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 bg-gradient-to-br from-[#14192A] to-[#1a2040] rounded-xl p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#F6FF2E]/10 flex items-center justify-center"><Wallet className="w-6 h-6 text-[#F6FF2E]" /></div>
            <div><p className="text-gray-400 text-sm">Available Balance</p><p className="text-3xl font-bold text-white">${(user?.balance || 0).toFixed(2)}</p></div>
          </div>
          <div className="space-y-2 pt-4 border-t border-white/5">
            <div className="flex justify-between text-sm"><span className="text-gray-400">Total Earned</span><span className="text-green-400">${(user?.total_earned || 0).toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Total Withdrawn</span><span className="text-blue-400">${(user?.total_withdrawn || 0).toFixed(2)}</span></div>
          </div>
        </div>

        <div className="md:col-span-2 bg-[#14192A] rounded-xl p-6 border border-white/5">
          <Tabs value={tab} onValueChange={(v) => { setTab(v); setSelectedMethod(null); setAmount(''); clearProof(); }}>
            <TabsList className="bg-[#0A0C10] mb-5">
              <TabsTrigger value="deposit" className="data-[state=active]:bg-[#F6FF2E] data-[state=active]:text-[#0A0C10]"><ArrowDownLeft className="w-4 h-4 mr-1" /> Deposit</TabsTrigger>
              <TabsTrigger value="withdraw" className="data-[state=active]:bg-[#F6FF2E] data-[state=active]:text-[#0A0C10]"><ArrowUpRight className="w-4 h-4 mr-1" /> Withdraw</TabsTrigger>
            </TabsList>

            <TabsContent value="deposit" className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#F6FF2E] text-[#0A0C10] text-xs font-bold mr-2">1</span>
                  Enter Amount
                </label>
                <Input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="$0.00" className="bg-[#0A0C10] border-white/10 text-white text-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#F6FF2E] text-[#0A0C10] text-xs font-bold mr-2">2</span>
                  Select Payment Method
                </label>
                {depositMethods.length === 0
                  ? <p className="text-sm text-gray-500 bg-[#0A0C10] rounded-lg p-4">No payment methods available.</p>
                  : <select 
                      value={selectedMethod?.id || ''} 
                      onChange={(e) => {
                        const method = depositMethods.find(m => m.id === parseInt(e.target.value));
                        setSelectedMethod(method || null);
                      }}
                      className="w-full bg-[#0A0C10] border border-white/10 text-white rounded-lg p-3 outline-none focus:border-[#F6FF2E]/50 appearance-none"
                    >
                      <option value="" disabled>Select a method...</option>
                      {depositMethods.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.min_amount > 0 ? `(Min: $${m.min_amount})` : ''}
                        </option>
                      ))}
                    </select>
                }
              </div>
              {selectedMethod && selectedMethod.fields && selectedMethod.fields.length > 0 && (
                <div className="rounded-xl border border-[#F6FF2E]/20 bg-[#F6FF2E]/5 p-4 space-y-2">
                  <p className="text-xs font-semibold text-[#F6FF2E] uppercase tracking-wider mb-3">Send payment to:</p>
                  {selectedMethod.fields.map((field, i) => <CopyField key={i} label={field.label} value={field.value} />)}
                </div>
              )}
              {selectedMethod && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#F6FF2E] text-[#0A0C10] text-xs font-bold mr-2">3</span>
                    Upload Proof of Payment
                  </label>
                  {proofPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-white/10">
                      <img src={proofPreview} alt="Proof" className="w-full max-h-48 object-cover" />
                      <button onClick={clearProof} className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-red-500/80 transition-colors"><X className="w-4 h-4 text-white" /></button>
                    </div>
                  ) : (
                    <button onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center gap-2 hover:border-[#F6FF2E]/40 hover:bg-[#F6FF2E]/5 transition-all">
                      <Upload className="w-8 h-8 text-gray-500" />
                      <p className="text-sm text-gray-400">Click to upload screenshot</p>
                      <p className="text-xs text-gray-600">PNG, JPG up to 5MB</p>
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </div>
              )}
              <Button onClick={handleDeposit} disabled={submitting || !selectedMethod || !proofFile}
                className="w-full bg-[#F6FF2E] text-[#0A0C10] hover:bg-[#e5ef2a] font-semibold disabled:opacity-40">
                {submitting ? 'Submitting...' : 'Submit Deposit Request'}
              </Button>
            </TabsContent>

            <TabsContent value="withdraw" className="space-y-4">
              {user?.kyc_status !== 'verified' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">Complete KYC verification to enable withdrawals</div>
              )}
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Amount</label>
                <Input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="$0.00" className="bg-[#0A0C10] border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Payment Method</label>
                <select 
                  value={withdrawMethod} 
                  onChange={(e) => setWithdrawMethod(e.target.value)}
                  className="w-full bg-[#0A0C10] border border-white/10 text-white rounded-lg p-3 outline-none focus:border-[#F6FF2E]/50 appearance-none"
                >
                  <option value="" disabled>Select a method...</option>
                  {withdrawMethods.map((m) => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Your Account Details</label>
                <Input value={withdrawDetails} onChange={(e) => setWithdrawDetails(e.target.value)} placeholder="e.g. PayPal email, wallet address..." className="bg-[#0A0C10] border-white/10 text-white" />
              </div>
              <Button onClick={handleWithdraw} disabled={submitting} className="w-full bg-[#F6FF2E] text-[#0A0C10] hover:bg-[#e5ef2a] font-semibold">
                {submitting ? 'Processing...' : 'Request Withdrawal'}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="bg-[#14192A] rounded-xl border border-white/5">
        <div className="p-4 border-b border-white/5"><h2 className="font-semibold text-white">Transaction History</h2></div>
        <div className="divide-y divide-white/5">
          {transactions.length === 0 && <p className="p-4 text-gray-500 text-sm text-center">No transactions yet</p>}
          {transactions.map((tx) => (
            <div key={tx.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'deposit' ? 'bg-green-400/10' : 'bg-red-400/10'}`}>
                  {tx.type === 'deposit' ? <ArrowDownLeft className="w-4 h-4 text-green-400" /> : <ArrowUpRight className="w-4 h-4 text-red-400" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-white capitalize">{tx.type?.replace('_', ' ')}</p>
                  <p className="text-xs text-gray-500">{tx.payment_method} · {new Date(tx.created_at).toLocaleString()}</p>
                  {tx.rejection_reason && <p className="text-xs text-red-400 mt-0.5">Reason: {tx.rejection_reason}</p>}
                </div>
              </div>
              <div className="text-right">
                <span className={`text-sm font-semibold ${tx.type === 'withdraw' ? 'text-red-400' : 'text-green-400'}`}>
                  {tx.type === 'withdraw' ? '-' : '+'}${parseFloat(tx.amount).toFixed(2)}
                </span>
                <div className="flex items-center gap-1 mt-0.5 justify-end">
                  {tx.status === 'pending' && <Clock className="w-3 h-3 text-amber-400" />}
                  {tx.status === 'approved' && <CheckCircle className="w-3 h-3 text-green-400" />}
                  {tx.status === 'rejected' && <XCircle className="w-3 h-3 text-red-400" />}
                  <span className={`text-xs capitalize ${tx.status === 'pending' ? 'text-amber-400' : tx.status === 'approved' ? 'text-green-400' : 'text-red-400'}`}>{tx.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
